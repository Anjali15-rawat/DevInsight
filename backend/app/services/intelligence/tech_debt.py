"""
Technical Debt Engine — estimates technical debt score, components, trend, and high-risk areas.
"""
from datetime import datetime, timedelta, UTC
from collections import Counter
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.repository import Repository
from app.models.pull_request import PullRequest, PullRequestFinding
from app.models.bug import Bug
from app.services.intelligence.scoring import calculate_technical_debt_score

async def compute_technical_debt(db: AsyncSession, repo_id: int) -> dict:
    """
    Analyzes technical debt signals for a repository and computes technical debt score.
    """
    repo_stmt = select(Repository).where(Repository.id == repo_id)
    repo = (await db.execute(repo_stmt)).scalar_one_or_none()
    if not repo:
        raise ValueError(f"Repository with ID {repo_id} not found.")

    # ─── Fetch PR findings linked to this repository ─────────────────────────
    findings_q = (
        select(PullRequestFinding)
        .join(PullRequest)
        .where(
            PullRequest.repository_id == repo_id,
            PullRequestFinding.status == "pending"
        )
    )
    findings = (await db.execute(findings_q)).scalars().all()

    # ─── Fetch bugs linked to this repository ─────────────────────────────────
    bugs_q = select(Bug).options(selectinload(Bug.root_cause)).where(Bug.repository_id == repo_id)
    bugs = (await db.execute(bugs_q)).scalars().all()

    # ─── Fetch open and merged PRs for branching metrics ──────────────────────
    pr_q = select(PullRequest).where(PullRequest.repository_id == repo_id)
    prs = (await db.execute(pr_q)).scalars().all()

    total_prs = len(prs)
    total_findings = len(findings)

    # ─── 1. Code Smells Score ─────────────────────────────────────────────────
    # Quality findings that are warnings or optimizations
    code_smells = [f for f in findings if f.agent_type == "code_quality" and f.severity in ("warning", "optimization")]
    code_smells_count = len(code_smells)
    # Scale from 0 to 100 based on code smells count relative to repository size / baseline
    # 0 smells = 100, 50 smells = 0.
    code_smells_score = max(0.0, 100.0 - (code_smells_count * 2.0))

    # ─── 2. TODOs Score ───────────────────────────────────────────────────────
    # Look for TODOs/FIXMEs in findings explanations or code snippets
    todos_count = 0
    for f in findings:
        text = f"{f.explanation or ''} {f.code_snippet or ''}".lower()
        if "todo" in text or "fixme" in text:
            todos_count += 1
    # Scale from 0 to 100 based on TODO count
    # 0 TODOs = 100, 20 TODOs = 0.
    todos_score = max(0.0, 100.0 - (todos_count * 5.0))

    # ─── 3. Long-Lived Branches Score ─────────────────────────────────────────
    # PRs that have been open for more than 14 days
    now_utc = datetime.now(UTC)
    long_lived_prs = 0
    for pr in prs:
        if pr.github_state == "open" and pr.github_created_at:
            age = now_utc - pr.github_created_at.replace(tzinfo=UTC)
            if age.days > 14:
                long_lived_prs += 1
    long_lived_ratio = long_lived_prs / total_prs if total_prs > 0 else 0.0
    long_lived_branches_score = max(0.0, 100.0 - (long_lived_ratio * 100.0))

    # ─── 4. Large Pull Requests Score ─────────────────────────────────────────
    # PRs with additions > 500 lines
    large_prs = sum(1 for pr in prs if pr.additions > 500)
    large_pr_ratio = large_prs / total_prs if total_prs > 0 else 0.0
    large_prs_score = max(0.0, 100.0 - (large_pr_ratio * 100.0))

    # ─── 5. Repeated Bugs Score ───────────────────────────────────────────────
    # Count bugs by file hotspot to check for repeated occurrences
    bug_files = [b.root_cause.affected_file for b in bugs if b.root_cause and b.root_cause.affected_file]
    repeated_files_count = sum(1 for file, count in Counter(bug_files).items() if count > 1)
    repeated_bugs_score = max(0.0, 100.0 - (repeated_files_count * 15.0))

    # ─── Calculate Technical Debt Score ───────────────────────────────────────
    tech_debt_score = calculate_technical_debt_score(
        code_smells_score=code_smells_score,
        todos_score=todos_score,
        long_lived_branches_score=long_lived_branches_score,
        large_prs_score=large_prs_score,
        repeated_bugs_score=repeated_bugs_score,
    )

    # ─── High-Risk Areas ──────────────────────────────────────────────────────
    # Group findings and bugs by file path to identify hotspot files
    area_risk_counter = Counter()
    for f in findings:
        area_risk_counter[f.file_path] += 1
    for b in bugs:
        if b.root_cause and b.root_cause.affected_file:
            area_risk_counter[b.root_cause.affected_file] += 2  # bugs have higher weight

    high_risk_areas = [
        {
            "file_path": file,
            "risk_score": min(100.0, score * 10),
            "findings_count": sum(1 for f in findings if f.file_path == file),
            "bugs_count": sum(1 for b in bugs if b.root_cause and b.root_cause.affected_file == file)
        }
        for file, score in area_risk_counter.most_common(5)
    ]

    # ─── Debt Trend ───────────────────────────────────────────────────────────
    # Compare with historical snapshots.
    # Default to "stable" if no previous snapshots exist.
    debt_trend = "stable"
    from app.models.repository import RepositoryHealth
    prev_snapshots_q = (
        select(RepositoryHealth)
        .where(RepositoryHealth.repository_id == repo_id)
        .order_by(RepositoryHealth.recorded_at.desc())
        .limit(2)
    )
    prev_snapshots = (await db.execute(prev_snapshots_q)).scalars().all()
    if len(prev_snapshots) >= 2:
        old_score = prev_snapshots[1].health_score
        if tech_debt_score > old_score + 2.0:
            debt_trend = "decreasing"  # health is increasing, meaning debt is decreasing
        elif tech_debt_score < old_score - 2.0:
            debt_trend = "increasing"  # health is decreasing, meaning debt is increasing

    return {
        "repository_id": repo_id,
        "name": repo.name,
        "technical_debt_score": tech_debt_score,
        "debt_trend": debt_trend,
        "metrics": {
            "code_smells_count": code_smells_count,
            "todos_count": todos_count,
            "long_lived_branches_count": long_lived_prs,
            "large_prs_count": large_prs,
            "repeated_bugs_count": repeated_files_count,
            "open_security_findings": sum(1 for f in findings if f.agent_type == "security"),
            "unused_files_count": sum(1 for f in findings if "unused" in f.explanation.lower() or "dead" in f.explanation.lower()),
        },
        "components": {
            "code_smells_score": round(code_smells_score, 1),
            "todos_score": round(todos_score, 1),
            "long_lived_branches_score": round(long_lived_branches_score, 1),
            "large_prs_score": round(large_prs_score, 1),
            "repeated_bugs_score": round(repeated_bugs_score, 1),
        },
        "high_risk_areas": high_risk_areas,
    }

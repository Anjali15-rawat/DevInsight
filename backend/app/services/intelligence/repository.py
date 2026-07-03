"""
Repository Intelligence Engine — computes metrics for repository health, activity, velocity, and growth.
"""
from datetime import UTC, datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.repository import Repository, RepositoryHealth
from app.models.pull_request import PullRequest
from app.models.bug import Bug
from app.models.analytics import DeveloperMetric
from app.services.intelligence.scoring import (
    calculate_repository_health_score,
    calculate_code_quality_score,
    calculate_security_score,
    calculate_maintainability_score,
)

async def compute_repository_intelligence(db: AsyncSession, repo_id: int) -> dict:
    """
    Query database and compute comprehensive intelligence reports and metrics for a repository.
    """
    # ─── Fetch Repository Metadata ────────────────────────────────────────────
    repo_stmt = select(Repository).where(Repository.id == repo_id)
    repo = (await db.execute(repo_stmt)).scalar_one_or_none()
    if not repo:
        raise ValueError(f"Repository with ID {repo_id} not found.")

    # ─── Fetch PR metrics ─────────────────────────────────────────────────────
    pr_stmt = select(PullRequest).where(PullRequest.repository_id == repo_id)
    prs_result = await db.execute(pr_stmt)
    prs = prs_result.scalars().all()

    total_prs = len(prs)
    merged_prs = [p for p in prs if p.github_state == "merged" or p.github_merged_at is not None]
    open_prs = [p for p in prs if p.github_state == "open"]
    total_merged = len(merged_prs)
    total_open = len(open_prs)

    # PR Merge Rate
    merge_rate = total_merged / total_prs if total_prs > 0 else 0.0

    # PR Velocity (average time to merge in hours)
    durations = []
    for pr in merged_prs:
        if pr.github_merged_at and pr.github_created_at:
            delta = pr.github_merged_at - pr.github_created_at
            durations.append(delta.total_seconds() / 3600.0)
    avg_pr_velocity_hours = sum(durations) / len(durations) if durations else 0.0

    # ─── Contributor Activity & Commits ───────────────────────────────────────
    # Query developer_metrics table for this repository / workspace
    dev_stmt = select(DeveloperMetric).where(DeveloperMetric.workspace_id == repo.workspace_id)
    dev_results = (await db.execute(dev_stmt)).scalars().all()

    unique_contributors = set(d.github_login for d in dev_results)
    contributor_count = len(unique_contributors) if unique_contributors else 1
    total_commits = sum(d.commits_count for d in dev_results)

    # Commit frequency: commits per week (estimate based on recorded period or default)
    # Default to a baseline commit frequency if metrics are empty
    commit_frequency_per_week = total_commits / 4.0 if dev_results else 12.5

    # ─── Repository Age ───────────────────────────────────────────────────────
    repo_age_days = (datetime.now(UTC) - repo.created_at.replace(tzinfo=UTC)).days
    repo_age_months = max(1.0, repo_age_days / 30.4)

    # ─── Open Bugs count ──────────────────────────────────────────────────────
    bug_stmt = select(func.count(Bug.id)).where(Bug.repository_id == repo_id, Bug.status != "Resolved")
    open_bugs_count = (await db.execute(bug_stmt)).scalar() or 0

    # ─── Component Scores ─────────────────────────────────────────────────────
    # Code Quality Component
    # Aggregate from PR findings
    from app.models.pull_request import PullRequestFinding
    findings_q = select(func.count(PullRequestFinding.id)).join(PullRequest).where(
        PullRequest.repository_id == repo_id
    )
    total_findings = (await db.execute(findings_q)).scalar() or 0
    findings_density = total_findings / total_prs if total_prs > 0 else 0.0

    code_quality_score = calculate_code_quality_score(repo.code_coverage, findings_density)

    # Security Component
    sec_crit_q = select(func.count(PullRequestFinding.id)).join(PullRequest).where(
        PullRequest.repository_id == repo_id,
        PullRequestFinding.agent_type == "security",
        PullRequestFinding.severity == "critical",
        PullRequestFinding.status == "pending"
    )
    sec_warn_q = select(func.count(PullRequestFinding.id)).join(PullRequest).where(
        PullRequest.repository_id == repo_id,
        PullRequestFinding.agent_type == "security",
        PullRequestFinding.severity == "warning",
        PullRequestFinding.status == "pending"
    )
    crit_sec = (await db.execute(sec_crit_q)).scalar() or 0
    warn_sec = (await db.execute(sec_warn_q)).scalar() or 0
    security_score = calculate_security_score(crit_sec, warn_sec, repo.security_alerts_count)

    # Maintainability Component
    smell_q = select(func.count(PullRequestFinding.id)).join(PullRequest).where(
        PullRequest.repository_id == repo_id,
        PullRequestFinding.agent_type == "code_quality",
        PullRequestFinding.severity == "warning",
        PullRequestFinding.status == "pending"
    )
    smells = (await db.execute(smell_q)).scalar() or 0
    smells_density = smells / total_prs if total_prs > 0 else 0.0

    # Estimate large PR ratio (>500 lines)
    large_pr_count = sum(1 for pr in prs if pr.additions > 500)
    large_pr_ratio = large_pr_count / total_prs if total_prs > 0 else 0.0

    maintainability_score = calculate_maintainability_score(smells_density, 0.1, large_pr_ratio)

    # Activity score: based on merge rate, PR velocity, and commit frequency
    activity_score = min(100.0, (merge_rate * 40.0) + (min(1.0, 24.0 / max(1.0, avg_pr_velocity_hours)) * 30.0) + (min(1.0, commit_frequency_per_week / 20.0) * 30.0))
    activity_score = round(activity_score, 1)

    # Repository Health Score
    health_score = calculate_repository_health_score(
        code_quality_score=code_quality_score,
        security_score=security_score,
        activity_score=activity_score,
        maintainability_score=maintainability_score,
    )

    # Update Repository main scores in DB (lazy write)
    repo.health_score = health_score
    # Calculate security grade based on security score
    if security_score >= 90.0:
        repo.security_grade = "A"
    elif security_score >= 80.0:
        repo.security_grade = "B"
    elif security_score >= 70.0:
        repo.security_grade = "C"
    elif security_score >= 60.0:
        repo.security_grade = "D"
    else:
        repo.security_grade = "F"

    await db.commit()

    # ─── Language Distribution ────────────────────────────────────────────────
    # Map repo.language to a primary, and construct mock distribution
    primary_lang = repo.language or "TypeScript"
    lang_dist = {primary_lang: 75.0}
    if primary_lang in ["TypeScript", "JavaScript"]:
        lang_dist["CSS"] = 15.0
        lang_dist["HTML"] = 10.0
    elif primary_lang == "Python":
        lang_dist["Shell"] = 15.0
        lang_dist["Dockerfile"] = 10.0
    else:
        lang_dist["Other"] = 25.0

    return {
        "repository_id": repo.id,
        "name": repo.name,
        "full_name": repo.full_name,
        "health_score": health_score,
        "activity_score": activity_score,
        "code_quality_score": code_quality_score,
        "security_score": security_score,
        "maintainability_score": maintainability_score,
        "metrics": {
            "commit_frequency_per_week": round(commit_frequency_per_week, 1),
            "pr_merge_rate": round(merge_rate, 2),
            "avg_pr_velocity_hours": round(avg_pr_velocity_hours, 1),
            "open_prs_count": total_open,
            "open_bugs_count": open_bugs_count,
            "contributor_count": contributor_count,
            "repository_age_months": round(repo_age_months, 1),
            "lines_analyzed": repo.analyzed_lines,
        },
        "language_distribution": lang_dist,
    }

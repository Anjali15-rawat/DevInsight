"""
Pull Request Intelligence Engine — aggregates findings and computes complexity, risks, readiness, and estimates review time.
"""
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pull_request import PullRequest, PullRequestFinding
from app.models.repository import Repository
from app.services.intelligence.scoring import calculate_maintainability_score

async def compute_pull_request_intelligence(db: AsyncSession, pr_id: int) -> dict:
    """
    Computes quality, risk, complexity and merge readiness for a specific Pull Request.
    """
    # ─── Fetch PR and findings ────────────────────────────────────────────────
    stmt = (
        select(PullRequest)
        .options(selectinload(PullRequest.findings), selectinload(PullRequest.repository))
        .where(PullRequest.id == pr_id)
    )
    result = await db.execute(stmt)
    pr = result.scalar_one_or_none()
    if not pr:
        raise ValueError(f"Pull Request with ID {pr_id} not found.")

    findings = pr.findings
    total_findings = len(findings)

    # ─── Review Complexity ────────────────────────────────────────────────────
    # Based on size and finding count
    total_lines = pr.additions + pr.deletions
    if total_lines > 500 or total_findings > 8:
        complexity = "high"
    elif total_lines > 150 or total_findings > 3:
        complexity = "medium"
    else:
        complexity = "low"

    # ─── Risk Level ───────────────────────────────────────────────────────────
    # Based on critical findings and change magnitude
    critical_findings_count = sum(1 for f in findings if f.severity == "critical" and f.status == "pending")
    warning_findings_count = sum(1 for f in findings if f.severity == "warning" and f.status == "pending")

    if critical_findings_count > 0 or (total_lines > 800 and warning_findings_count > 2):
        risk_level = "high"
    elif warning_findings_count > 0 or total_lines > 300:
        risk_level = "medium"
    else:
        risk_level = "low"

    # ─── Review Confidence ────────────────────────────────────────────────────
    # Average of findings confidence
    conf_values = [f.confidence_score for f in findings]
    avg_confidence = sum(conf_values) / len(conf_values) if conf_values else 0.85

    # Map numeric confidence to label
    if avg_confidence >= 0.8:
        confidence_label = "high"
    elif avg_confidence >= 0.5:
        confidence_label = "medium"
    else:
        confidence_label = "low"

    # ─── Estimated Review Time ────────────────────────────────────────────────
    # Formula: 5 minutes base + 0.05 minutes per line addition + 2 minutes per pending finding
    estimated_review_time_mins = 5.0 + (pr.additions * 0.05) + (warning_findings_count * 2.0) + (critical_findings_count * 5.0)
    estimated_review_time_mins = round(estimated_review_time_mins, 1)

    # ─── Merge Readiness ──────────────────────────────────────────────────────
    # Red: build failure or pending critical findings
    # Yellow: build warning or pending warning findings
    # Green: success and no critical/warning pending findings
    if pr.build_status in ("error", "failed") or critical_findings_count > 0:
        merge_readiness = "red"
    elif pr.build_status == "warning" or warning_findings_count > 0:
        merge_readiness = "yellow"
    else:
        merge_readiness = "green"

    # ─── Categorized Risks ────────────────────────────────────────────────────
    security_risks = [
        {
            "file": f.file_path,
            "line": f.line_number,
            "severity": f.severity,
            "explanation": f.explanation,
            "suggested_fix": f.suggested_fix,
        }
        for f in findings
        if f.agent_type == "security" and f.status == "pending"
    ]

    performance_risks = [
        {
            "file": f.file_path,
            "line": f.line_number,
            "severity": f.severity,
            "explanation": f.explanation,
            "suggested_fix": f.suggested_fix,
        }
        for f in findings
        if f.agent_type == "performance" and f.status == "pending"
    ]

    blocking_issues = [
        {
            "file": f.file_path,
            "line": f.line_number,
            "agent": f.agent_type,
            "explanation": f.explanation,
        }
        for f in findings
        if f.severity == "critical" and f.status == "pending"
    ]

    # ─── Maintainability Score ───────────────────────────────────────────────
    # Local maintainability index for the PR code changes
    code_smells_count = sum(1 for f in findings if f.agent_type == "code_quality" and f.severity == "warning" and f.status == "pending")
    smells_density = code_smells_count / 1.0  # density in this PR scope
    todos_density = sum(1 for f in findings if "todo" in f.explanation.lower() or "todo" in (f.code_snippet or "").lower())
    large_pr_ratio = 1.0 if pr.additions > 500 else 0.0

    maintainability_score = calculate_maintainability_score(
        code_smells_density=smells_density,
        todos_density=todos_density,
        large_pr_ratio=large_pr_ratio,
    )

    return {
        "pr_id": pr.id,
        "number": pr.number,
        "title": pr.title,
        "repository": pr.repository.name,
        "complexity": complexity,
        "risk_level": risk_level,
        "review_confidence": confidence_label,
        "confidence_score": round(avg_confidence, 2),
        "merge_readiness": merge_readiness,
        "estimated_review_time_minutes": estimated_review_time_mins,
        "maintainability_score": maintainability_score,
        "summary": pr.ai_insights_summary,
        "blocking_issues_count": len(blocking_issues),
        "security_risks_count": len(security_risks),
        "performance_risks_count": len(performance_risks),
        "risks": {
            "blocking": blocking_issues,
            "security": security_risks,
            "performance": performance_risks,
        },
    }

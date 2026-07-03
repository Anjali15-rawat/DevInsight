"""
Analytics service — calculates high-level KPIs and analytics datasets for DevInsight.
"""
from datetime import datetime, UTC
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.repository import Repository
from app.models.pull_request import PullRequest, PullRequestFinding
from app.schemas.analytics import OverviewKPIs


async def get_overview_kpis(db: AsyncSession, workspace_id: int) -> OverviewKPIs:
    """
    Computes aggregated high-level KPIs for the primary dashboard view.
    """
    # 1. Total Repositories
    stmt_repos = select(func.count(Repository.id)).where(Repository.workspace_id == workspace_id)
    total_repositories = (await db.execute(stmt_repos)).scalar() or 0

    # 2. Total Open PRs
    stmt_open_prs = (
        select(func.count(PullRequest.id))
        .join(Repository)
        .where(Repository.workspace_id == workspace_id, PullRequest.github_state == "open")
    )
    total_open_prs = (await db.execute(stmt_open_prs)).scalar() or 0

    # 3. Critical Findings Unresolved
    stmt_crit = (
        select(func.count(PullRequestFinding.id))
        .join(PullRequest)
        .join(Repository)
        .where(
            Repository.workspace_id == workspace_id,
            PullRequestFinding.severity == "critical",
            PullRequestFinding.status == "pending"
        )
    )
    critical_findings_unresolved = (await db.execute(stmt_crit)).scalar() or 0

    # 4. Average Health Score
    stmt_health = select(func.avg(Repository.health_score)).where(Repository.workspace_id == workspace_id)
    avg_health = (await db.execute(stmt_health)).scalar()
    avg_health_score = round(float(avg_health), 1) if avg_health is not None else 0.0

    # 5. AI Reviews This Month & Hours Saved
    now = datetime.now(UTC)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=UTC)
    stmt_ai = (
        select(func.count(PullRequest.id))
        .join(Repository)
        .where(
            Repository.workspace_id == workspace_id,
            PullRequest.ai_review_posted_at >= start_of_month
        )
    )
    ai_reviews_this_month = (await db.execute(stmt_ai)).scalar() or 0
    estimated_hours_saved_this_month = round(ai_reviews_this_month * 1.5, 1)

    # 6. Total Security Alerts Unresolved
    stmt_sec = select(func.sum(Repository.security_alerts_count)).where(Repository.workspace_id == workspace_id)
    total_security_alerts_unresolved = (await db.execute(stmt_sec)).scalar() or 0

    return OverviewKPIs(
        total_repositories=total_repositories,
        total_open_prs=total_open_prs,
        critical_findings_unresolved=critical_findings_unresolved,
        avg_health_score=avg_health_score,
        ai_reviews_this_month=ai_reviews_this_month,
        estimated_hours_saved_this_month=estimated_hours_saved_this_month,
        total_security_alerts_unresolved=total_security_alerts_unresolved,
    )

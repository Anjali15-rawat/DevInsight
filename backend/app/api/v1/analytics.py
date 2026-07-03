"""Analytics API endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DB, verify_workspace_access
from app.models.analytics import AnalyticsSnapshot, DeveloperMetric
from app.models.pull_request import PullRequest, PullRequestFinding
from app.models.repository import Repository
from app.schemas.analytics import (
    AnalyticsResponse,
    DeveloperKPIRead,
    OverviewKPIs,
    PRMetricsPoint,
    QualityHistoryPoint,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsResponse, summary="Full analytics dashboard data")
async def get_analytics(
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_workspace_access),
):
    """
    Returns all analytics data for the workspace dashboard:
    overview KPIs, PR metrics history, quality history, developer leaderboard.
    """
    # ── Overview KPIs ──────────────────────────────────────────────────────────
    repo_ids_stmt = select(Repository.id).where(Repository.workspace_id == workspace_id)
    repo_ids_result = await db.execute(repo_ids_stmt)
    repo_ids = [row[0] for row in repo_ids_result.all()]

    total_repos = len(repo_ids)

    # Count open PRs
    open_prs = 0
    critical_findings = 0
    ai_reviews = 0

    if repo_ids:
        open_prs_stmt = select(func.count(PullRequest.id)).where(
            PullRequest.repository_id.in_(repo_ids),
            PullRequest.github_state == "open",
        )
        open_prs = (await db.execute(open_prs_stmt)).scalar() or 0

        critical_stmt = select(func.count(PullRequestFinding.id)).where(
            PullRequestFinding.severity == "critical",
            PullRequestFinding.status == "pending",
        )
        critical_findings = (await db.execute(critical_stmt)).scalar() or 0

    # Latest analytics snapshot
    snapshot_stmt = (
        select(AnalyticsSnapshot)
        .where(AnalyticsSnapshot.workspace_id == workspace_id)
        .order_by(AnalyticsSnapshot.recorded_at.desc())
        .limit(1)
    )
    snapshot = (await db.execute(snapshot_stmt)).scalar_one_or_none()

    avg_health = 0.0
    if repo_ids:
        health_stmt = select(func.avg(Repository.health_score)).where(
            Repository.workspace_id == workspace_id
        )
        avg_health = float((await db.execute(health_stmt)).scalar() or 0)

    overview = OverviewKPIs(
        total_repositories=total_repos,
        total_open_prs=open_prs,
        critical_findings_unresolved=critical_findings,
        avg_health_score=round(avg_health, 1),
        ai_reviews_this_month=snapshot.ai_reviews_performed if snapshot else 0,
        estimated_hours_saved_this_month=snapshot.estimated_hours_saved if snapshot else 0.0,
        total_security_s_unresolved=sum(
            (await db.execute(
                select(func.sum(Repository.security_s_count)).where(
                    Repository.workspace_id == workspace_id
                )
            )).scalar() or 0
            for _ in [1]  # single scalar fetch
        ),
    )

    # ── PR Metrics History (from snapshots) ────────────────────────────────────
    snapshots_stmt = (
        select(AnalyticsSnapshot)
        .where(AnalyticsSnapshot.workspace_id == workspace_id)
        .order_by(AnalyticsSnapshot.period_start.desc())
        .limit(10)
    )
    snapshots = (await db.execute(snapshots_stmt)).scalars().all()

    pr_history = [
        PRMetricsPoint(
            period_label=s.period_label,
            avg_review_time_hours=s.avg_pr_review_time_hours,
            total_prs=s.total_prs_merged,
            merge_rate=s.pr_merge_rate,
        )
        for s in reversed(snapshots)
    ]

    quality_history = [
        QualityHistoryPoint(
            period_label=s.period_label,
            total_findings=s.total_findings,
            critical_findings=s.critical_findings,
            avg_health_score=s.avg_health_score,
            total_vulnerabilities=s.total_vulnerabilities,
            ai_reviews=s.ai_reviews_performed,
        )
        for s in reversed(snapshots)
    ]

    # ── Developer KPIs ────────────────────────────────────────────────────────
    dev_stmt = (
        select(DeveloperMetric)
        .where(DeveloperMetric.workspace_id == workspace_id)
        .order_by(DeveloperMetric.engagement_score.desc())
        .limit(10)
    )
    developers = (await db.execute(dev_stmt)).scalars().all()

    return AnalyticsResponse(
        overview=overview,
        pr_metrics_history=pr_history,
        quality_history=quality_history,
        developer_kpis=[DeveloperKPIRead.model_validate(d) for d in developers],
    )

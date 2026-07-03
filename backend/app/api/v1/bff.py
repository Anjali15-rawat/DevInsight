"""
Backend-for-Frontend (BFF) endpoints.
Aggregates multiple services and database queries into single optimized payloads for UI page loads.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DB, verify_pr_access, verify_repository_access, verify_workspace_access
from app.models.bug import Bug
from app.models.notification import Notification
from app.models.pull_request import PullRequest
from app.models.repository import Repository, RepositoryHealth
from app.schemas.analytics import DeveloperKPIRead
from app.schemas.bff import DashboardBFFResponse, PullRequestBFFResponse, RepositoryBFFResponse
from app.schemas.bug import BugAssignee, BugRead, BugRootCauseRead
from app.schemas.notification import NotificationRead
from app.schemas.pull_request import PRAuthor, PRFindingRead, PullRequestRead
from app.schemas.repository import RepositoryHealthRead, RepositoryRead
from app.services.analytics import get_overview_kpis
from app.services.intelligence.bug import compute_bug_intelligence
from app.services.intelligence.pull_request import compute_pull_request_intelligence
from app.services.intelligence.recommendations import generate_recommendations
from app.services.intelligence.repository import compute_repository_intelligence
from app.services.intelligence.tech_debt import compute_technical_debt

router = APIRouter(prefix="/bff", tags=["Backend-for-Frontend"])


def _to_pr_read(pr: PullRequest) -> PullRequestRead:
    """Safely build PullRequestRead schema from ORM model."""
    author = PRAuthor(
        name=pr.author_name or pr.author_github_login,
        username=pr.author_github_login,
        avatar_url=pr.author_avatar_url,
    )
    repo_name = pr.repository.name if pr.repository else "unknown"
    findings = [PRFindingRead.model_validate(f) for f in pr.findings] if pr.findings else []
    
    return PullRequestRead(
        id=pr.id,
        github_pr_id=pr.github_pr_id,
        number=pr.number,
        title=pr.title,
        author=author,
        repository=repo_name,
        head_branch=pr.head_branch,
        base_branch=pr.base_branch,
        additions=pr.additions,
        deletions=pr.deletions,
        changed_files=pr.changed_files,
        review_status=pr.review_status,
        build_status=pr.build_status,
        ai_insights_summary=pr.ai_insights_summary,
        findings=findings,
        github_created_at=pr.github_created_at,
        github_merged_at=pr.github_merged_at,
    )


def _to_bug_read(b: Bug) -> BugRead:
    """Safely build BugRead schema from ORM model."""
    assignee = BugAssignee(name=b.assignee_name, avatar_url=b.assignee_avatar_url) if b.assignee_name else None
    root_cause = BugRootCauseRead.model_validate(b.root_cause) if b.root_cause else None
    repo_name = b.repository.name if b.repository else "unknown"

    return BugRead(
        id=b.id,
        github_issue_id=b.github_issue_id,
        issue_number=b.issue_number,
        title=b.title,
        body=b.body,
        html_url=b.html_url,
        priority=b.priority,
        status=b.status,
        category=b.category,
        repository=repo_name,
        assignee=assignee,
        root_cause=root_cause,
        github_created_at=b.github_created_at,
        github_closed_at=b.github_closed_at,
    )


@router.get("/dashboard", response_model=DashboardBFFResponse, summary="Aggregated Dashboard Data")
async def get_dashboard_bff(
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_workspace_access),
):
    """
    Returns all core datasets for the main developer dashboard in a single optimized payload.
    """
    # 1. Overview KPIs
    overview = await get_overview_kpis(db, workspace_id)

    # 2. Workspace repositories
    repo_stmt = select(Repository).where(Repository.workspace_id == workspace_id)
    repos = (await db.execute(repo_stmt)).scalars().all()
    repo_reads = [RepositoryRead.model_validate(r) for r in repos]
    repo_ids = [r.id for r in repos]

    # 3. AI Recommendations
    ai_recs = await generate_recommendations(db, workspace_id)

    # 4. Recent PRs
    recent_prs = []
    if repo_ids:
        pr_stmt = (
            select(PullRequest)
            .options(selectinload(PullRequest.findings), selectinload(PullRequest.repository))
            .where(PullRequest.repository_id.in_(repo_ids))
            .order_by(PullRequest.created_at.desc())
            .limit(5)
        )
        pr_rows = (await db.execute(pr_stmt)).scalars().all()
        recent_prs = [_to_pr_read(p) for p in pr_rows]

    # 5. Recent Bugs
    recent_bugs = []
    if repo_ids:
        bug_stmt = (
            select(Bug)
            .options(selectinload(Bug.root_cause), selectinload(Bug.repository))
            .where(Bug.repository_id.in_(repo_ids))
            .order_by(Bug.github_created_at.desc())
            .limit(5)
        )
        bug_rows = (await db.execute(bug_stmt)).scalars().all()
        recent_bugs = [_to_bug_read(b) for b in bug_rows]

    # 6. Notifications for active user
    notif_stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(5)
    )
    notif_rows = (await db.execute(notif_stmt)).scalars().all()
    notif_reads = [NotificationRead.model_validate(n) for n in notif_rows]

    # 7. Developer Activity
    from app.models.analytics import DeveloperMetric
    dev_stmt = (
        select(DeveloperMetric)
        .where(DeveloperMetric.workspace_id == workspace_id)
        .order_by(DeveloperMetric.engagement_score.desc())
        .limit(5)
    )
    dev_rows = (await db.execute(dev_stmt)).scalars().all()
    dev_reads = [DeveloperKPIRead.model_validate(d) for d in dev_rows]

    # 8. Trend Data
    trend_data = [
        {"day": "Mon", "prs": 14, "bugs": 4, "activity": 112},
        {"day": "Tue", "prs": 19, "bugs": 5, "activity": 140},
        {"day": "Wed", "prs": 28, "bugs": 2, "activity": 204},
        {"day": "Thu", "prs": 22, "bugs": 6, "activity": 165},
        {"day": "Fri", "prs": 31, "bugs": 3, "activity": 220},
        {"day": "Sat", "prs": 8, "bugs": 1, "activity": 75},
        {"day": "Sun", "prs": 12, "bugs": 2, "activity": 90},
    ]

    return DashboardBFFResponse(
        overview=overview,
        health_map=repo_reads,
        ai_recommendations=ai_recs,
        recent_prs=recent_prs,
        recent_bugs=recent_bugs,
        notifications=notif_reads,
        developer_activity=dev_reads,
        trend_data=trend_data,
    )


@router.get("/repository/{repo_id}", response_model=RepositoryBFFResponse, summary="Aggregated Repository Detail Data")
async def get_repository_bff(
    repo_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_repository_access),
):
    """
    Returns full details, metrics, intelligence, tech debt, PRs, and bugs for a repository.
    """
    repo_stmt = select(Repository).where(Repository.id == repo_id)
    repo = (await db.execute(repo_stmt)).scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Health history
    health_stmt = (
        select(RepositoryHealth)
        .where(RepositoryHealth.repository_id == repo_id)
        .order_by(RepositoryHealth.recorded_at.desc())
        .limit(30)
    )
    health_rows = (await db.execute(health_stmt)).scalars().all()

    # Intelligence & tech debt reports
    intelligence_report = await compute_repository_intelligence(db, repo_id)
    tech_debt_report = await compute_technical_debt(db, repo_id)

    # Repository PRs
    pr_stmt = (
        select(PullRequest)
        .options(selectinload(PullRequest.findings), selectinload(PullRequest.repository))
        .where(PullRequest.repository_id == repo_id)
        .order_by(PullRequest.created_at.desc())
        .limit(20)
    )
    pr_rows = (await db.execute(pr_stmt)).scalars().all()

    # Repository Bugs
    bug_stmt = (
        select(Bug)
        .options(selectinload(Bug.root_cause), selectinload(Bug.repository))
        .where(Bug.repository_id == repo_id)
        .order_by(Bug.github_created_at.desc())
        .limit(20)
    )
    bug_rows = (await db.execute(bug_stmt)).scalars().all()

    return RepositoryBFFResponse(
        repository=RepositoryRead.model_validate(repo),
        health_history=[RepositoryHealthRead.model_validate(h) for h in health_rows],
        intelligence_report=intelligence_report,
        tech_debt_report=tech_debt_report,
        pull_requests=[_to_pr_read(p) for p in pr_rows],
        bugs=[_to_bug_read(b) for b in bug_rows],
    )


@router.get("/pull-request/{pr_id}", response_model=PullRequestBFFResponse, summary="Aggregated PR Detail Data")
async def get_pull_request_bff(
    pr_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_pr_access),
):
    """
    Returns PR detail, AI findings, and pull request intelligence report.
    """
    pr_stmt = (
        select(PullRequest)
        .options(selectinload(PullRequest.findings), selectinload(PullRequest.repository))
        .where(PullRequest.id == pr_id)
    )
    pr = (await db.execute(pr_stmt)).scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Pull Request not found")

    intel = await compute_pull_request_intelligence(db, pr_id)

    return PullRequestBFFResponse(
        pull_request=_to_pr_read(pr),
        intelligence_report=intel,
    )

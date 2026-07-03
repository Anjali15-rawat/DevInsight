"""
Intelligence API Endpoints — exposes scores, metrics, recommendations, and trends.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DB, verify_bug_access, verify_pr_access, verify_repository_access, verify_workspace_access
from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.services.intelligence.repository import compute_repository_intelligence
from app.services.intelligence.pull_request import compute_pull_request_intelligence
from app.services.intelligence.bug import compute_bug_intelligence
from app.services.intelligence.tech_debt import compute_technical_debt
from app.services.intelligence.recommendations import generate_recommendations
from app.services.intelligence.cache import intelligence_cache

router = APIRouter(prefix="/intelligence", tags=["Engineering Intelligence"])


@router.get("/repository/{repo_id}", summary="Get Repository Intelligence Report")
async def get_repository_intelligence(
    repo_id: int,
    current_user: CurrentUser,
    db: DB,
    bypass_cache: bool = Query(False, description="Bypass cache and force recalculation"),
    _: None = Depends(verify_repository_access),
):
    """
    Returns full repository intelligence metrics, activity, growth, and health scores.
    """
    # Verify repository exists and belongs to a workspace user has access to
    repo_stmt = select(Repository).where(Repository.id == repo_id)
    repo = (await db.execute(repo_stmt)).scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    cache_key = f"intelligence:repo:{repo_id}"

    async def calculate():
        return await compute_repository_intelligence(db, repo_id)

    report = await intelligence_cache.get_or_calculate(
        cache_key, calculate, ttl_seconds=300, bypass_cache=bypass_cache
    )
    return report


@router.get("/pull-requests/{pr_id}", summary="Get Pull Request Intelligence Report")
async def get_pull_request_intelligence(
    pr_id: int,
    current_user: CurrentUser,
    db: DB,
    bypass_cache: bool = Query(False, description="Bypass cache and force recalculation"),
    _: None = Depends(verify_pr_access),
):
    """
    Aggregates findings and returns pull request risk, complexity, readiness, and review details.
    """
    pr_stmt = select(PullRequest).where(PullRequest.id == pr_id)
    pr = (await db.execute(pr_stmt)).scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Pull Request not found")

    cache_key = f"intelligence:pr:{pr_id}"

    async def calculate():
        return await compute_pull_request_intelligence(db, pr_id)

    report = await intelligence_cache.get_or_calculate(
        cache_key, calculate, ttl_seconds=300, bypass_cache=bypass_cache
    )
    return report


@router.get("/bugs", summary="Get Workspace Bug Intelligence Report")
async def get_bug_intelligence(
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    repo_id: int | None = Query(None, description="Filter by repository ID"),
    bypass_cache: bool = Query(False, description="Bypass cache and force recalculation"),
    _: None = Depends(verify_workspace_access),
):
    """
    Analyzes issues/bugs to report bug health, resolution speeds, density, duplicates, and hotspot files.
    """
    cache_key = f"intelligence:bugs:ws:{workspace_id}:repo:{repo_id or 'all'}"

    async def calculate():
        return await compute_bug_intelligence(db, workspace_id, repo_id)

    report = await intelligence_cache.get_or_calculate(
        cache_key, calculate, ttl_seconds=300, bypass_cache=bypass_cache
    )
    return report


@router.get("/tech-debt/{repo_id}", summary="Get Repository Technical Debt Report")
async def get_technical_debt(
    repo_id: int,
    current_user: CurrentUser,
    db: DB,
    bypass_cache: bool = Query(False, description="Bypass cache and force recalculation"),
    _: None = Depends(verify_repository_access),
):
    """
    Aggregates code smells, TODO comments, large PRs, and branch ages to report Technical Debt details.
    """
    repo_stmt = select(Repository).where(Repository.id == repo_id)
    repo = (await db.execute(repo_stmt)).scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    cache_key = f"intelligence:debt:{repo_id}"

    async def calculate():
        return await compute_technical_debt(db, repo_id)

    report = await intelligence_cache.get_or_calculate(
        cache_key, calculate, ttl_seconds=300, bypass_cache=bypass_cache
    )
    return report


@router.get("/recommendations", summary="Get Engineering Recommendations Feed")
async def get_recommendations(
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    bypass_cache: bool = Query(False, description="Bypass cache and force recalculation"),
    _: None = Depends(verify_workspace_access),
):
    """
    Queries all workspace repository findings and scores to return prioritized developer recommendations.
    """
    cache_key = f"intelligence:recommendations:ws:{workspace_id}"

    async def calculate():
        return await generate_recommendations(db, workspace_id)

    report = await intelligence_cache.get_or_calculate(
        cache_key, calculate, ttl_seconds=300, bypass_cache=bypass_cache
    )
    return report


@router.get("/trends", summary="Get Snapshot Trends and Regression Detection")
async def get_snapshot_trends(
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_workspace_access),
):
    """
    Fetches historical metrics from snaps to check engineering growth and check for repository regressions.
    """
    repo_stmt = select(Repository).where(Repository.workspace_id == workspace_id)
    repos = (await db.execute(repo_stmt)).scalars().all()

    regressions = []
    from app.services.intelligence.historical import detect_repository_regressions

    for repo in repos:
        reg = await detect_repository_regressions(db, repo.id)
        if reg:
            regressions.append(reg)

    return {
        "workspace_id": workspace_id,
        "regression_alerts_count": len(regressions),
        "regressions": regressions,
    }

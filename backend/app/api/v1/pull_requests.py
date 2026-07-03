"""Pull Requests API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DB, verify_pr_access, verify_workspace_access
from app.models.pull_request import PullRequest, PullRequestFinding
from app.models.repository import Repository
from app.schemas.pull_request import PRFindingFeedbackRequest, PullRequestRead

router = APIRouter(prefix="/pull-requests", tags=["Pull Requests"])


@router.get("", response_model=list[PullRequestRead], summary="List pull requests")
async def list_pull_requests(
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    repository_id: int | None = None,
    status_filter: str | None = None,
    limit: int = 50,
    offset: int = 0,
    _: None = Depends(verify_workspace_access),
):
    """List PRs across all workspace repositories (or filtered by repo)."""
    # Get repos for this workspace
    repo_stmt = select(Repository.id).where(Repository.workspace_id == workspace_id)
    repo_result = await db.execute(repo_stmt)
    repo_ids = [row[0] for row in repo_result.all()]

    stmt = (
        select(PullRequest)
        .options(selectinload(PullRequest.findings), selectinload(PullRequest.repository))
        .where(PullRequest.repository_id.in_(repo_ids))
        .order_by(PullRequest.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    if repository_id:
        stmt = stmt.where(PullRequest.repository_id == repository_id)
    if status_filter:
        stmt = stmt.where(PullRequest.review_status == status_filter)

    result = await db.execute(stmt)
    prs = result.scalars().all()
    return prs


@router.get("/{pr_id}", response_model=PullRequestRead, summary="Get PR detail with findings")
async def get_pull_request(
    pr_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_pr_access),
):
    """Get a single PR with all AI findings."""
    stmt = (
        select(PullRequest)
        .options(selectinload(PullRequest.findings), selectinload(PullRequest.repository))
        .where(PullRequest.id == pr_id)
    )
    result = await db.execute(stmt)
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Pull request not found")
    return pr


@router.post("/{pr_id}/findings/{finding_id}/feedback", summary="Submit finding feedback")
async def submit_finding_feedback(
    pr_id: int,
    finding_id: int,
    body: PRFindingFeedbackRequest,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_pr_access),
):
    """Developer feedback on a finding — accept, ignore, or mark as false positive."""
    stmt = select(PullRequestFinding).where(
        PullRequestFinding.id == finding_id,
        PullRequestFinding.pull_request_id == pr_id,
    )
    result = await db.execute(stmt)
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    finding.status = body.status
    await db.commit()
    return {"message": f"Finding marked as '{body.status}'", "finding_id": finding_id}

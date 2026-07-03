"""Bugs API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DB, verify_bug_access, verify_workspace_access
from app.models.bug import Bug
from app.models.repository import Repository
from app.schemas.bug import BugRead, BugStatusUpdate

router = APIRouter(prefix="/bugs", tags=["Bug Intelligence"])


@router.get("", response_model=list[BugRead], summary="List bugs across workspace")
async def list_bugs(
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    priority: str | None = None,
    status_filter: str | None = None,
    limit: int = 50,
    offset: int = 0,
    _: None = Depends(verify_workspace_access),
):
    """List all AI-classified bugs across the workspace repositories."""
    repo_stmt = select(Repository.id).where(Repository.workspace_id == workspace_id)
    repo_ids = [row[0] for row in (await db.execute(repo_stmt)).all()]

    stmt = (
        select(Bug)
        .options(selectinload(Bug.root_cause), selectinload(Bug.repository))
        .where(Bug.repository_id.in_(repo_ids))
        .order_by(Bug.github_created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if priority:
        stmt = stmt.where(Bug.priority == priority)
    if status_filter:
        stmt = stmt.where(Bug.status == status_filter)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{bug_id}", response_model=BugRead, summary="Get bug detail")
async def get_bug(
    bug_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_bug_access),
):
    """Get a single bug with root cause analysis."""
    stmt = (
        select(Bug)
        .options(selectinload(Bug.root_cause), selectinload(Bug.repository))
        .where(Bug.id == bug_id)
    )
    result = await db.execute(stmt)
    bug = result.scalar_one_or_none()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    return bug


@router.patch("/{bug_id}/status", summary="Update bug triage status")
async def update_bug_status(
    bug_id: int,
    body: BugStatusUpdate,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_bug_access),
):
    """Move a bug through the triage pipeline."""
    stmt = select(Bug).where(Bug.id == bug_id)
    result = await db.execute(stmt)
    bug = result.scalar_one_or_none()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    bug.status = body.status
    await db.commit()
    return {"message": f"Bug status updated to '{body.status}'", "bug_id": bug_id}

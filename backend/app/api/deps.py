"""
Shared FastAPI dependencies.

These are injected via Depends() into route handlers.
Centralizing them here prevents duplication and makes testing easy
(swap the dependency in test fixtures).
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_token
from app.database.session import get_db
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency that extracts and validates the JWT Bearer token,
    then loads and returns the authenticated User from the database.

    Raises 401 if token is missing, invalid, or expired.
    Raises 404 if the user no longer exists.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = verify_token(credentials.credentials, token_type="access")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from sqlalchemy import select
    stmt = select(User).where(User.id == int(user_id))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


# Type alias for clean route handler signatures
CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]


async def verify_workspace_access(
    workspace_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Ensures the authenticated user has access (is a member) of the workspace."""
    from sqlalchemy import select
    from app.models.workspace import WorkspaceMember

    stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    result = await db.execute(stmt)
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not a member of this workspace"
        )


async def verify_repository_access(
    repo_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Ensures the repo exists and belongs to a workspace the user has access to."""
    from sqlalchemy import select
    from app.models.repository import Repository
    from app.models.workspace import WorkspaceMember

    stmt = select(Repository).where(Repository.id == repo_id)
    result = await db.execute(stmt)
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )

    member_stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == repo.workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    member_result = await db.execute(member_stmt)
    membership = member_result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this repository"
        )


async def verify_pr_access(
    pr_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Ensures the PR exists and belongs to a workspace the user has access to."""
    from sqlalchemy import select
    from app.models.pull_request import PullRequest
    from app.models.repository import Repository
    from app.models.workspace import WorkspaceMember

    stmt = select(PullRequest).where(PullRequest.id == pr_id)
    result = await db.execute(stmt)
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pull request not found"
        )

    repo_stmt = select(Repository).where(Repository.id == pr.repository_id)
    repo_result = await db.execute(repo_stmt)
    repo = repo_result.scalar_one_or_none()
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent repository not found"
        )

    member_stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == repo.workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    member_result = await db.execute(member_stmt)
    membership = member_result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this pull request"
        )


async def verify_bug_access(
    bug_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Ensures the bug exists and belongs to a workspace the user has access to."""
    from sqlalchemy import select
    from app.models.bug import Bug
    from app.models.repository import Repository
    from app.models.workspace import WorkspaceMember

    stmt = select(Bug).where(Bug.id == bug_id)
    result = await db.execute(stmt)
    bug = result.scalar_one_or_none()
    if not bug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bug not found"
        )

    repo_stmt = select(Repository).where(Repository.id == bug.repository_id)
    repo_result = await db.execute(repo_stmt)
    repo = repo_result.scalar_one_or_none()
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent repository not found"
        )

    member_stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == repo.workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    member_result = await db.execute(member_stmt)
    membership = member_result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this bug issue"
        )


async def verify_document_access(
    document_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Ensures the knowledge document exists and belongs to a workspace the user has access to."""
    from sqlalchemy import select
    from app.models.knowledge import KnowledgeDocument
    from app.models.workspace import WorkspaceMember

    stmt = select(KnowledgeDocument).where(KnowledgeDocument.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found"
        )

    member_stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == doc.workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    member_result = await db.execute(member_stmt)
    membership = member_result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this knowledge document"
        )

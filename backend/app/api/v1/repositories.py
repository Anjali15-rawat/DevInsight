"""Repositories API endpoints."""

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.api.deps import (
    CurrentUser,
    DB,
    verify_repository_access,
    verify_workspace_access,
)
from app.models.repository import Repository, RepositoryHealth
from app.schemas.repository import (
    GitHubRepositoryRead,
    RepositoryConnectRequest,
    RepositoryHealthRead,
    RepositoryRead,
)


router = APIRouter(prefix="/repositories", tags=["Repositories"])


# ---------------------------------------------------------------------
# List Repositories
# ---------------------------------------------------------------------

@router.get(
    "",
    response_model=list[RepositoryRead],
    summary="List workspace repositories",
)
async def list_repositories(
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_workspace_access),
):
    """Return all repositories connected to the current workspace."""

    stmt = select(Repository).where(
        Repository.workspace_id == workspace_id
    )

    result = await db.execute(stmt)

    return result.scalars().all()


# ---------------------------------------------------------------------
# Repository Detail
# ---------------------------------------------------------------------

@router.get(
    "/{repo_id}",
    response_model=RepositoryRead,
    summary="Get repository details",
)
async def get_repository(
    repo_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_repository_access),
):
    stmt = select(Repository).where(
        Repository.id == repo_id
    )

    result = await db.execute(stmt)

    repo = result.scalar_one_or_none()

    if repo is None:
        raise HTTPException(
            status_code=404,
            detail="Repository not found",
        )

    return repo


# ---------------------------------------------------------------------
# Repository Health History
# ---------------------------------------------------------------------

@router.get(
    "/{repo_id}/health-history",
    response_model=list[RepositoryHealthRead],
)
async def get_health_history(
    repo_id: int,
    current_user: CurrentUser,
    db: DB,
    limit: int = 30,
    _: None = Depends(verify_repository_access),
):
    stmt = (
        select(RepositoryHealth)
        .where(RepositoryHealth.repository_id == repo_id)
        .order_by(RepositoryHealth.recorded_at.desc())
        .limit(limit)
    )

    result = await db.execute(stmt)

    return result.scalars().all()


# ---------------------------------------------------------------------
# Connect Repository
# ---------------------------------------------------------------------

@router.post(
    "/connect",
    response_model=RepositoryRead,
    status_code=status.HTTP_201_CREATED,
)
async def connect_repository(
    body: RepositoryConnectRequest,
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_workspace_access),
):
    """
    Connect a GitHub repository to a workspace.
    """

    existing_stmt = select(Repository).where(
        Repository.workspace_id == workspace_id,
        Repository.full_name == body.github_full_name,
    )

    existing = (
        await db.execute(existing_stmt)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Repository already connected.",
        )

    if not current_user.github_access_token:
        raise HTTPException(
            status_code=400,
            detail="GitHub account is not connected.",
        )

    from app.core.security import decrypt_token
    from app.github.client import GitHubClient

    token = decrypt_token(
        current_user.github_access_token
    )

    if not token:
        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub token.",
        )

    try:

        async with GitHubClient(token) as gh:

            gh_repo = await gh.get(
                f"/repos/{body.github_full_name}"
            )

        repo = Repository(
            workspace_id=workspace_id,
            github_repo_id=gh_repo["id"],
            name=gh_repo["name"],
            full_name=gh_repo["full_name"],
            owner=gh_repo["owner"]["login"],
            description=gh_repo.get("description"),
            html_url=gh_repo["html_url"],
            is_private=gh_repo.get("private", False),
            language=gh_repo.get("language"),
            stars=gh_repo.get("stargazers_count", 0),
            forks=gh_repo.get("forks_count", 0),
            open_issues_count=gh_repo.get(
                "open_issues_count",
                0,
            ),
        )

        db.add(repo)

        await db.commit()

        await db.refresh(repo)

        # Queue initial repository sync here.
        from arq import create_pool
        from arq.connections import RedisSettings
        from app.core.config import settings
        import structlog
        
        try:
            redis_pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
            await redis_pool.enqueue_job("run_initial_repo_sync", repo_id=repo.id)
            await redis_pool.aclose()
        except Exception as e:
            logger = structlog.get_logger(__name__)
            logger.error("failed_to_queue_initial_sync", repo_id=repo.id, error=str(e))

        return repo

    except httpx.HTTPStatusError as e:

        await db.rollback()

        raise HTTPException(
            status_code=e.response.status_code,
            detail="GitHub API request failed.",
        )

    except httpx.TimeoutException:

        await db.rollback()

        raise HTTPException(
            status_code=504,
            detail="GitHub request timed out.",
        )

    except SQLAlchemyError:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Database error.",
        )

    except Exception as e:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ---------------------------------------------------------------------
# Discover GitHub Repositories
# ---------------------------------------------------------------------

@router.get(
    "/github-discover",
    response_model=list[GitHubRepositoryRead],
    summary="Discover GitHub repositories",
)
async def discover_repositories(
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_workspace_access),
):
    """
    Returns all GitHub repositories
    and flags repositories already
    connected to the current workspace.
    """

    if not current_user.github_access_token:
        raise HTTPException(
            status_code=400,
            detail="GitHub account not connected.",
        )

    from app.core.security import decrypt_token
    from app.github.client import GitHubClient

    token = decrypt_token(
        current_user.github_access_token
    )

    if not token:
        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub token.",
        )

    try:

        async with GitHubClient(token) as gh:

            gh_repos = await gh.get(
                "/user/repos?per_page=100&sort=updated"
            )

    except httpx.HTTPStatusError as e:

        raise HTTPException(
            status_code=e.response.status_code,
            detail="Unable to fetch repositories.",
        )

    except httpx.TimeoutException:

        raise HTTPException(
            status_code=504,
            detail="GitHub timeout.",
        )

    connected_stmt = select(
        Repository.github_repo_id
    ).where(
        Repository.workspace_id == workspace_id
    )

    connected_result = await db.execute(
        connected_stmt
    )

    connected_ids = {
        row[0]
        for row in connected_result.all()
    }

    repositories = []

    for repo in gh_repos:

        repositories.append(
    GitHubRepositoryRead(
        github_repo_id=repo["id"],
        name=repo["name"],
        full_name=repo["full_name"],
        owner=repo["owner"]["login"],
        description=repo.get("description"),
        is_private=repo.get("private", False),
        html_url=repo["html_url"],
        language=repo.get("language"),
        stars=repo.get("stargazers_count", 0),
        forks=repo.get("forks_count", 0),
        is_connected=repo["id"] in connected_ids,
    )
)

    return repositories
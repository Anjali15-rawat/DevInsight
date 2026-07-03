"""
Fetches Pull Request data from GitHub API.

Fetches: PR metadata, diff, changed files list, commit list,
and existing review comments. All data is returned as typed dicts
that the PR service uses to upsert into PostgreSQL.
"""
from typing import Any

from app.github.client import GitHubClient
import structlog

logger = structlog.get_logger(__name__)


async def fetch_pr_details(
    client: GitHubClient,
    owner: str,
    repo: str,
    pr_number: int,
) -> dict[str, Any]:
    """Fetch full PR metadata from GitHub."""
    return await client.get(f"/repos/{owner}/{repo}/pulls/{pr_number}")


async def fetch_pr_diff(
    client: GitHubClient,
    owner: str,
    repo: str,
    pr_number: int,
) -> str:
    """
    Fetch the unified diff for a PR.
    Returns the raw diff string (text/x-patch format).
    """
    import httpx
    from app.core.config import settings

    # The diff endpoint requires a different Accept header
    async with httpx.AsyncClient(
        headers={
            "Authorization": f"Bearer {client._token}",
            "Accept": "application/vnd.github.diff",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        timeout=60.0,
    ) as raw_client:
        response = await raw_client.get(
            f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"
        )
        response.raise_for_status()
        return response.text


async def fetch_pr_files(
    client: GitHubClient,
    owner: str,
    repo: str,
    pr_number: int,
) -> list[dict[str, Any]]:
    """
    Fetch the list of changed files in a PR.
    Each file includes: filename, status, additions, deletions, patch (diff).
    """
    return await client.get(f"/repos/{owner}/{repo}/pulls/{pr_number}/files")


async def fetch_pr_commits(
    client: GitHubClient,
    owner: str,
    repo: str,
    pr_number: int,
) -> list[dict[str, Any]]:
    """Fetch all commits in a PR."""
    return await client.get(f"/repos/{owner}/{repo}/pulls/{pr_number}/commits")

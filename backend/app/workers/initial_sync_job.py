"""
Initial Repository Sync background job.

Runs immediately when a new repository is connected to load existing open pull requests
and issues, then runs initial analysis runs.
"""
import structlog
from typing import Any
from datetime import datetime, UTC
from sqlalchemy import select

from arq import create_pool
from arq.connections import RedisSettings

from app.core.config import settings
from app.database.session import AsyncSessionLocal
from app.models.repository import Repository
from app.github.client import GitHubClient
from app.github.webhook_parser import parse_pr_event, parse_issue_event

logger = structlog.get_logger(__name__)


async def run_initial_repo_sync(ctx: dict[str, Any], *, repo_id: int) -> None:
    """
    ARQ job function to download open PRs and issues for a newly connected repository.
    """
    async with AsyncSessionLocal() as db:
        # ── Step 1: Find the repository record ─────────────────────────────
        repo_stmt = select(Repository).where(Repository.id == repo_id)
        repo = (await db.execute(repo_stmt)).scalar_one_or_none()

        if not repo:
            logger.warning("initial_sync_repository_not_found", repo_id=repo_id)
            return

        logger.info("initial_sync_started", repo=repo.full_name)

        # ── Step 2: Retrieve workspace member's GitHub access token ────────
        from app.models.workspace import WorkspaceMember
        from app.models.user import User

        user_token_stmt = (
            select(User.github_access_token)
            .join(WorkspaceMember)
            .where(
                WorkspaceMember.workspace_id == repo.workspace_id,
                User.github_access_token.is_not(None)
            )
            .limit(1)
        )
        github_token = (await db.execute(user_token_stmt)).scalar()
        
        from app.core.security import decrypt_token
        github_token = decrypt_token(github_token)

        if not github_token:
            github_token = settings.GITHUB_CLIENT_SECRET or ctx.get("github_token", "")

        if not github_token or github_token.startswith("mock_") or github_token == "your-github-oauth-client-secret":
            logger.warning("initial_sync_no_valid_token_found_using_fallback", repo_id=repo_id)
            # Log placeholder run
            repo.last_synced_at = datetime.now(UTC)
            await db.commit()
            return

        # ── Step 3: Fetch Open PRs and enqeue analysis ─────────────────────
        redis_pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
        try:
            async with GitHubClient(github_token) as gh:
                logger.info("initial_sync_fetching_open_prs", repo=repo.full_name)
                try:
                    open_prs = await gh.get(f"/repos/{repo.full_name}/pulls?state=open&per_page=10")
                    for pr in open_prs:
                        webhook_payload = {
                            "action": "opened",
                            "pull_request": pr,
                            "repository": {
                                "id": repo.github_repo_id,
                                "name": repo.name,
                                "full_name": repo.full_name,
                                "owner": {"login": repo.owner},
                                "html_url": repo.html_url,
                                "private": repo.is_private
                            }
                        }
                        pr_data = parse_pr_event(webhook_payload)
                        await redis_pool.enqueue_job(
                            "run_pr_analysis",
                            pr_data=pr_data,
                            github_token=github_token
                        )
                        logger.info("initial_sync_pr_queued", repo=repo.name, pr_number=pr_data.get("pr_number"))
                except Exception as e:
                    logger.error("initial_sync_prs_api_failed", repo=repo.full_name, error=str(e))

                # ── Step 4: Fetch Open Issues and enqueue triage ─────────────────
                logger.info("initial_sync_fetching_open_issues", repo=repo.full_name)
                try:
                    open_issues = await gh.get(f"/repos/{repo.full_name}/issues?state=open&per_page=15")
                    for issue in open_issues:
                        # Exclude pull requests (GitHub returned PRs inside the issues list)
                        if "pull_request" in issue:
                            continue

                        webhook_payload = {
                            "action": "opened",
                            "issue": issue,
                            "repository": {
                                "id": repo.github_repo_id,
                                "name": repo.name,
                                "full_name": repo.full_name,
                                "owner": {"login": repo.owner}
                            }
                        }
                        issue_data = parse_issue_event(webhook_payload)
                        await redis_pool.enqueue_job(
                            "run_bug_triage",
                            issue_data=issue_data
                        )
                        logger.info("initial_sync_issue_queued", repo=repo.name, issue_number=issue_data.get("issue_number"))
                except Exception as e:
                    logger.error("initial_sync_issues_api_failed", repo=repo.full_name, error=str(e))

            # Update sync status
            repo.last_synced_at = datetime.now(UTC)
            logger.info("initial_sync_completed", repo_id=repo.id)
        finally:
            await db.commit()
            await redis_pool.aclose()

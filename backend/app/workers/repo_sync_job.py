"""
Repository Synchronization background job.

Triggered by: GitHub webhook → push event
"""
import structlog
from typing import Any
from datetime import datetime, UTC
from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.repository import Repository, RepositoryHealth
from app.services.intelligence.repository import compute_repository_intelligence

logger = structlog.get_logger(__name__)


async def run_repo_sync(ctx: dict[str, Any], *, push_data: dict[str, Any]) -> None:
    """
    ARQ job function triggered by push event to sync repository intelligence.
    """
    async with AsyncSessionLocal() as db:
        # ── Step 1: Find the repository record ─────────────────────────────
        repo_stmt = select(Repository).where(
            Repository.github_repo_id == push_data.get("repo_id")
        )
        repo_result = await db.execute(repo_stmt)
        repo = repo_result.scalar_one_or_none()

        if not repo:
            logger.warning("push_sync_repository_not_found", repo_id=push_data.get("repo_id"))
            return

        # ── Step 2: Update timestamps ──────────────────────────────────────
        repo.updated_at = datetime.now(UTC)
        repo.last_synced_at = datetime.now(UTC)

        # ── Step 3: Recompute Intelligence & Health Snapshot ───────────────
        try:
            health_report = await compute_repository_intelligence(db, repo.id)
            
            # Save historical snapshot
            health_record = RepositoryHealth(
                repository_id=repo.id,
                health_score=health_report.get("health_score", repo.health_score or 90.0),
                security_grade=health_report.get("security_grade", repo.security_grade or "A"),
                open_prs=health_report.get("open_prs_count", repo.open_prs_count or 0),
                open_issues=health_report.get("open_issues_count", repo.open_issues_count or 0),
                security_alerts=health_report.get("security_alerts_count", repo.security_alerts_count or 0),
                code_coverage=repo.code_coverage,
            )
            db.add(health_record)
            
            # Update base repo scores
            repo.health_score = health_record.health_score
            repo.security_grade = health_record.security_grade
            repo.open_prs_count = health_record.open_prs
            repo.security_alerts_count = health_record.security_alerts
            repo.last_analyzed_at = datetime.now(UTC)

            logger.info(
                "repo_sync_health_completed",
                repo_id=repo.id,
                score=repo.health_score,
                grade=repo.security_grade
            )
        except Exception as e:
            logger.error("repo_sync_intelligence_failed", repo_id=repo.id, error=str(e))

        await db.commit()

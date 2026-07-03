"""
ARQ Worker Settings.

Defines which functions are available as background jobs and
how the ARQ worker connects to Redis.
"""
from arq import cron
from arq.connections import RedisSettings

from app.core.config import settings
from app.workers.pr_analysis_job import run_pr_analysis
from app.workers.knowledge_index_job import run_knowledge_index_job
from app.workers.bug_triage_job import run_bug_triage
from app.workers.repo_sync_job import run_repo_sync
from app.workers.initial_sync_job import run_initial_repo_sync


async def startup(ctx: dict) -> None:
    """Called when the ARQ worker process starts."""
    import structlog
    from app.core.logging import configure_logging
    configure_logging()
    logger = structlog.get_logger(__name__)
    logger.info("arq_worker_started")


async def shutdown(ctx: dict) -> None:
    """Called when the ARQ worker process shuts down."""
    import structlog
    logger = structlog.get_logger(__name__)
    logger.info("arq_worker_stopped")


class WorkerSettings:
    """
    ARQ worker configuration.

    All background job functions must be listed in `functions`.
    The worker polls Redis for jobs using the queue name.
    """
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)

    functions = [
        run_pr_analysis,
        run_knowledge_index_job,
        run_bug_triage,
        run_repo_sync,
        run_initial_repo_sync,
    ]

    on_startup = startup
    on_shutdown = shutdown

    # Maximum concurrent jobs per worker process
    max_jobs = 10

    # Job timeout — matches AGENT_TIMEOUT_SECONDS + buffer
    job_timeout = settings.AGENT_TIMEOUT_SECONDS + 60

    # Retry failed jobs up to 3 times with exponential backoff
    max_tries = 3

    # Keep job results in Redis for 24 hours (for status polling)
    keep_result = 86400

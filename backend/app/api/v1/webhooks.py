"""
GitHub Webhook endpoint.

Receives all GitHub webhook events for connected repositories.
IMPORTANT: Returns 200 OK immediately, then dispatches all work
asynchronously to ARQ background workers. This prevents GitHub
from retrying (which happens if we take > 10 seconds to respond).
"""
from fastapi import APIRouter, Header, HTTPException, Request, status
import structlog
from arq import create_pool
from arq.connections import RedisSettings

from app.core.config import settings
from app.github.webhook_parser import (
    parse_issue_event,
    parse_pr_event,
    parse_push_event,
    verify_webhook_signature,
)
from app.core.exceptions import WebhookSignatureError

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/github", status_code=status.HTTP_200_OK, summary="Receive GitHub webhook events")
async def github_webhook(
    request: Request,
    x_github_event: str = Header(None),
    x_hub_signature_256: str = Header(None),
):
    """
    Receives GitHub webhook payloads.

    Security: Verifies HMAC-SHA256 signature before processing.
    Async: Returns 200 immediately; dispatches jobs to ARQ workers.
    """
    payload_bytes = await request.body()

    # ── 1. Verify HMAC Signature ───────────────────────────────────────────────
    try:
        verify_webhook_signature(payload_bytes, x_hub_signature_256)
    except WebhookSignatureError:
        logger.warning("webhook_invalid_signature", event=x_github_event)
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = await request.json()
    action = payload.get("action", "")

    logger.info("webhook_received", event=x_github_event, action=action)

    # ── 2. Route to appropriate job ────────────────────────────────────────────
    redis_pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))

    try:
        if x_github_event == "pull_request" and action in ("opened", "synchronize", "reopened"):
            pr_data = parse_pr_event(payload)
            await redis_pool.enqueue_job(
                "run_pr_analysis",
                pr_data=pr_data,
                github_token=settings.GITHUB_CLIENT_SECRET,  # Use app token in production
            )
            logger.info("webhook_pr_analysis_queued", pr_number=pr_data.get("pr_number"))

        elif x_github_event == "issues" and action in ("opened", "reopened"):
            issue_data = parse_issue_event(payload)
            await redis_pool.enqueue_job("run_bug_triage", issue_data=issue_data)
            logger.info("webhook_bug_triage_queued", issue_number=issue_data.get("issue_number"))

        elif x_github_event == "push":
            push_data = parse_push_event(payload)
            await redis_pool.enqueue_job("run_repo_sync", push_data=push_data)

        else:
            logger.debug("webhook_event_ignored", event=x_github_event, action=action)

    finally:
        await redis_pool.aclose()

    return {"status": "accepted", "event": x_github_event}

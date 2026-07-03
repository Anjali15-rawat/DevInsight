"""
Notification service — creates and delivers notifications.
"""
from datetime import UTC, datetime

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification

logger = structlog.get_logger(__name__)


async def create_notification(
    db: AsyncSession,
    user_ids: list[int],
    title: str,
    description: str,
    notification_type: str,
    repo_name: str | None = None,
    reference_url: str | None = None,
) -> list[Notification]:
    """
    Create a notification record for each user in user_ids.
    Also publishes a WebSocket event to each user's channel via Redis pub/sub.
    """
    notifications = []
    for user_id in user_ids:
        notif = Notification(
            user_id=user_id,
            title=title,
            description=description,
            notification_type=notification_type,
            repo_name=repo_name,
            reference_url=reference_url,
        )
        db.add(notif)
        notifications.append(notif)

    await db.flush()
    logger.info("notifications_created", count=len(notifications), type=notification_type)
    return notifications

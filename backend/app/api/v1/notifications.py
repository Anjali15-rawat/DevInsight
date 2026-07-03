"""Notifications API endpoints."""
from fastapi import APIRouter
from sqlalchemy import select, update

from app.api.deps import CurrentUser, DB
from app.models.notification import Notification
from app.schemas.notification import NotificationMarkReadRequest, NotificationRead

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationRead], summary="List user notifications")
async def list_notifications(
    current_user: CurrentUser,
    db: DB,
    unread_only: bool = False,
    limit: int = 50,
):
    """Return notifications for the current user, newest first."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    if unread_only:
        stmt = stmt.where(Notification.is_read == False)  # noqa: E712
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/mark-read", summary="Mark notifications as read")
async def mark_notifications_read(
    body: NotificationMarkReadRequest,
    current_user: CurrentUser,
    db: DB,
):
    """Mark one or more notifications as read."""
    stmt = (
        update(Notification)
        .where(
            Notification.id.in_(body.notification_ids),
            Notification.user_id == current_user.id,
        )
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()
    return {"marked_read": len(body.notification_ids)}


@router.post("/mark-all-read", summary="Mark all notifications as read")
async def mark_all_read(current_user: CurrentUser, db: DB):
    """Mark every unread notification for the current user as read."""
    stmt = (
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()
    return {"message": "All notifications marked as read"}

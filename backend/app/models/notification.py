"""
Notification ORM model.

Notifications are created by the system on key events:
security alerts, PR review completions, build failures, billing changes.
They are delivered to users via WebSocket and stored for the notification panel.
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # ─── Content ──────────────────────────────────────────────────────────────
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(
        Enum("security", "pr_review", "build", "general", name="notification_type"),
        nullable=False,
        index=True,
    )

    # ─── Context ──────────────────────────────────────────────────────────────
    repo_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reference_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # ─── State ────────────────────────────────────────────────────────────────
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ─── Relationships ────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship(back_populates="notifications")  # noqa: F821

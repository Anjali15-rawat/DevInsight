"""
User and UserSession ORM models.

Users authenticate via GitHub OAuth. The GitHub user ID is the
authoritative identity — no passwords are stored.
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ─── GitHub Identity ──────────────────────────────────────────────────────
    github_id: Mapped[int] = mapped_column(unique=True, nullable=False, index=True)
    github_login: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    github_access_token: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    # ─── Profile ──────────────────────────────────────────────────────────────
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ─── Settings ─────────────────────────────────────────────────────────────
    notify_security_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_pr_reviews: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_build_failures: Mapped[bool] = mapped_column(Boolean, default=True)

    # ─── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ─── Relationships ────────────────────────────────────────────────────────
    sessions: Mapped[list["UserSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    workspace_memberships: Mapped[list["WorkspaceMember"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} github_login={self.github_login!r}>"


class UserSession(Base):
    """
    Tracks active refresh tokens per user.
    Allows logout (token invalidation) without requiring stateful JWT.
    """
    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    refresh_token_hash: Mapped[str] = mapped_column(String(512), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # ─── Relationships ────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship(back_populates="sessions")

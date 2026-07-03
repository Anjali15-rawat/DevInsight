"""
Workspace and WorkspaceMember ORM models.

A Workspace represents a company or team. Each user can belong
to multiple workspaces with different roles.
"""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.repository import Repository


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    logo_color: Mapped[str] = mapped_column(String(100), default="bg-indigo-600")

    # ─── Plan & Billing ───────────────────────────────────────────────────────
    plan: Mapped[str] = mapped_column(
        Enum("Free", "Pro", "Enterprise", name="workspace_plan"),
        default="Free",
    )

    # ─── GitHub Org Integration ───────────────────────────────────────────────
    github_org_login: Mapped[str | None] = mapped_column(String(255), nullable=True)
    github_installation_id: Mapped[int | None] = mapped_column(nullable=True)

    # ─── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ─── Relationships ────────────────────────────────────────────────────────
    members: Mapped[list["WorkspaceMember"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    repositories: Mapped[list["Repository"]] = relationship(  # noqa: F821
        back_populates="workspace", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Workspace id={self.id} slug={self.slug!r}>"


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uq_workspace_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(
        Enum("Owner", "Admin", "Member", name="member_role"),
        default="Member",
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # ─── Relationships ────────────────────────────────────────────────────────
    workspace: Mapped["Workspace"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="workspace_memberships")

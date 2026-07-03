"""
Bug and BugRootCause ORM models.

Bugs are created from GitHub Issues that are classified as bugs
by the Bug Triage Agent. The BugRootCause stores the AI's analysis
of the likely cause and fix recommendation.
"""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.repository import Repository


class Bug(Base):
    __tablename__ = "bugs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ─── Repository Association ───────────────────────────────────────────────
    repository_id: Mapped[int] = mapped_column(
        ForeignKey("repositories.id", ondelete="CASCADE"), index=True
    )

    # ─── GitHub Issue Data ────────────────────────────────────────────────────
    github_issue_id: Mapped[int] = mapped_column(unique=True, nullable=False, index=True)
    issue_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    html_url: Mapped[str] = mapped_column(String(1024), nullable=False)

    # ─── AI Classification ────────────────────────────────────────────────────
    priority: Mapped[str] = mapped_column(
        Enum("P0", "P1", "P2", "P3", name="bug_priority"),
        default="P2",
    )
    category: Mapped[str] = mapped_column(
        Enum(
            "Database", "Hydration", "Security", "Performance", "Auth", "Network", "UI", "Other",
            name="bug_category",
        ),
        default="Other",
    )
    status: Mapped[str] = mapped_column(
        Enum("Triage", "Backlog", "In Progress", "Resolved", name="bug_status"),
        default="Triage",
    )

    # ─── Assignment ───────────────────────────────────────────────────────────
    assignee_github_login: Mapped[str | None] = mapped_column(String(255), nullable=True)
    assignee_avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # ─── Timestamps ───────────────────────────────────────────────────────────
    github_created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    github_closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ─── Relationships ────────────────────────────────────────────────────────
    repository: Mapped["Repository"] = relationship()
    root_cause: Mapped["BugRootCause | None"] = relationship(
        back_populates="bug", cascade="all, delete-orphan", uselist=False
    )


class BugRootCause(Base):
    """
    Root Cause Agent's analysis of a bug.
    Stores the AI's determination of likely cause, affected file/function,
    and suggested fix for displaying in the bug detail view.
    """
    __tablename__ = "bug_root_causes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    bug_id: Mapped[int] = mapped_column(
        ForeignKey("bugs.id", ondelete="CASCADE"), unique=True, index=True
    )

    likely_cause: Mapped[str] = mapped_column(Text, nullable=False)
    affected_file: Mapped[str | None] = mapped_column(String(512), nullable=True)
    affected_function: Mapped[str | None] = mapped_column(String(255), nullable=True)
    suggested_fix: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[str] = mapped_column(String(10), default="medium")

    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    bug: Mapped["Bug"] = relationship(back_populates="root_cause")

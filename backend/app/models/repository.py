"""
Repository and RepositoryHealth ORM models.

A Repository is a GitHub repository connected to a workspace.
RepositoryHealth records a snapshot of health metrics at a point in time
(used for trend charts in the analytics dashboard).
"""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.workspace import Workspace
    from app.models.pull_request import PullRequest


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ─── Workspace Association ────────────────────────────────────────────────
    workspace_id: Mapped[int] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )

    # ─── GitHub Identity ──────────────────────────────────────────────────────
    github_repo_id: Mapped[int] = mapped_column(unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(512), nullable=False)  # owner/name
    owner: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    html_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    is_private: Mapped[bool] = mapped_column(default=False)

    # ─── GitHub Metadata ──────────────────────────────────────────────────────
    language: Mapped[str | None] = mapped_column(String(100), nullable=True)
    language_color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    stars: Mapped[int] = mapped_column(Integer, default=0)
    forks: Mapped[int] = mapped_column(Integer, default=0)
    open_issues_count: Mapped[int] = mapped_column(Integer, default=0)

    # ─── DevInsight Metrics ───────────────────────────────────────────────────
    health_score: Mapped[float] = mapped_column(Float, default=0.0)
    security_grade: Mapped[str] = mapped_column(String(2), default="C")  # A/B/C/D/F
    code_coverage: Mapped[float | None] = mapped_column(Float, nullable=True)
    analyzed_lines: Mapped[int] = mapped_column(Integer, default=0)
    open_prs_count: Mapped[int] = mapped_column(Integer, default=0)
    security_alerts_count: Mapped[int] = mapped_column(Integer, default=0)

    # ─── Webhook ──────────────────────────────────────────────────────────────
    webhook_id: Mapped[int | None] = mapped_column(nullable=True)

    # ─── Sync Timestamps ──────────────────────────────────────────────────────
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_analyzed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ─── Relationships ────────────────────────────────────────────────────────
    workspace: Mapped["Workspace"] = relationship(back_populates="repositories")
    pull_requests: Mapped[list["PullRequest"]] = relationship(  # noqa: F821
        back_populates="repository", cascade="all, delete-orphan"
    )
    health_history: Mapped[list["RepositoryHealth"]] = relationship(
        back_populates="repository", cascade="all, delete-orphan", order_by="RepositoryHealth.recorded_at.desc()"
    )

    def __repr__(self) -> str:
        return f"<Repository id={self.id} full_name={self.full_name!r}>"


class RepositoryHealth(Base):
    """
    Time-series snapshot of repository health metrics.
    One record written after each full AI analysis run.
    Powers the health trend chart in the analytics dashboard.
    """
    __tablename__ = "repository_health"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    repository_id: Mapped[int] = mapped_column(
        ForeignKey("repositories.id", ondelete="CASCADE"), index=True
    )

    health_score: Mapped[float] = mapped_column(Float, nullable=False)
    security_grade: Mapped[str] = mapped_column(String(2), nullable=False)
    open_prs: Mapped[int] = mapped_column(Integer, default=0)
    open_issues: Mapped[int] = mapped_column(Integer, default=0)
    security_alerts: Mapped[int] = mapped_column(Integer, default=0)
    code_coverage: Mapped[float | None] = mapped_column(Float, nullable=True)

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    # ─── Relationships ────────────────────────────────────────────────────────
    repository: Mapped["Repository"] = relationship(back_populates="health_history")

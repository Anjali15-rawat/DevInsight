"""
PullRequest and PullRequestFinding ORM models.

PullRequest mirrors GitHub PR data. PullRequestFinding represents a single
AI-generated finding (a bug, security risk, performance issue, etc.)
attached to a specific file and line number.
"""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.repository import Repository


class PullRequest(Base):
    __tablename__ = "pull_requests"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ─── Repository Association ───────────────────────────────────────────────
    repository_id: Mapped[int] = mapped_column(
        ForeignKey("repositories.id", ondelete="CASCADE"), index=True
    )

    # ─── GitHub PR Data ───────────────────────────────────────────────────────
    github_pr_id: Mapped[int] = mapped_column(unique=True, nullable=False, index=True)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    html_url: Mapped[str] = mapped_column(String(1024), nullable=False)

    # ─── Author ───────────────────────────────────────────────────────────────
    author_github_login: Mapped[str] = mapped_column(String(255), nullable=False)
    author_avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    author_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ─── Branches ─────────────────────────────────────────────────────────────
    head_branch: Mapped[str] = mapped_column(String(255), nullable=False)
    base_branch: Mapped[str] = mapped_column(String(255), nullable=False)
    head_sha: Mapped[str] = mapped_column(String(40), nullable=False)

    # ─── Stats ────────────────────────────────────────────────────────────────
    additions: Mapped[int] = mapped_column(Integer, default=0)
    deletions: Mapped[int] = mapped_column(Integer, default=0)
    changed_files: Mapped[int] = mapped_column(Integer, default=0)

    # ─── Status ───────────────────────────────────────────────────────────────
    github_state: Mapped[str] = mapped_column(String(20), default="open")  # open/closed/merged
    review_status: Mapped[str] = mapped_column(
        Enum(
            "AI Analyzing",
            "Review Required",
            "Changes Requested",
            "Approved",
            "Merged",
            name="pr_review_status",
        ),
        default="AI Analyzing",
    )
    build_status: Mapped[str] = mapped_column(
        Enum("pending", "success", "warning", "error", name="pr_build_status"),
        default="pending",
    )

    # ─── AI Summary ───────────────────────────────────────────────────────────
    ai_insights_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_review_posted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ─── Timestamps ───────────────────────────────────────────────────────────
    github_created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    github_merged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ─── Relationships ────────────────────────────────────────────────────────
    repository: Mapped["Repository"] = relationship(back_populates="pull_requests")
    findings: Mapped[list["PullRequestFinding"]] = relationship(
        back_populates="pull_request", cascade="all, delete-orphan"
    )


class PullRequestFinding(Base):
    """
    A single AI-generated finding attached to a PR.

    Each finding maps to one specific issue: a security vulnerability,
    code smell, performance problem, or optimization opportunity.
    Developers can accept or mark it as a false positive.
    """
    __tablename__ = "pull_request_findings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    pull_request_id: Mapped[int] = mapped_column(
        ForeignKey("pull_requests.id", ondelete="CASCADE"), index=True
    )
    agent_type: Mapped[str] = mapped_column(String(50), nullable=False)  # security/code_quality/etc

    # ─── Location ─────────────────────────────────────────────────────────────
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    line_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    code_snippet: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ─── Finding Details ──────────────────────────────────────────────────────
    severity: Mapped[str] = mapped_column(
        Enum("critical", "warning", "optimization", name="finding_severity"),
        nullable=False,
    )
    confidence: Mapped[str] = mapped_column(
        Enum("high", "medium", "low", name="finding_confidence"),
        default="medium",
    )
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_fix: Mapped[str | None] = mapped_column(Text, nullable=True)
    estimated_impact: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ─── Related Documentation ────────────────────────────────────────────────
    related_doc: Mapped[str | None] = mapped_column(String(512), nullable=True)
    doc_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # ─── Feedback ─────────────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        Enum("pending", "accepted", "ignored", "false_positive", name="finding_status"),
        default="pending",
    )

    # ─── GitHub Review Comment ────────────────────────────────────────────────
    github_comment_id: Mapped[int | None] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # ─── Relationships ────────────────────────────────────────────────────────
    pull_request: Mapped["PullRequest"] = relationship(back_populates="findings")

    @property
    def confidence_score(self) -> float:
        return {"high": 0.9, "medium": 0.65, "low": 0.35}.get(self.confidence, 0.5)

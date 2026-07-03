"""
AgentRun and AgentLog ORM models.

AgentRun records each execution of an AI agent: what it did,
how long it took, how many tokens it consumed, and whether it succeeded.
AgentLog stores the console-like log lines displayed in the AI Workspace.
"""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ─── Agent Identity ───────────────────────────────────────────────────────
    agent_type: Mapped[str] = mapped_column(
        Enum(
            "code_quality",
            "security",
            "performance",
            "bug_triage",
            "root_cause",
            "knowledge",
            name="agent_type",
        ),
        nullable=False,
        index=True,
    )

    # ─── Job Context ──────────────────────────────────────────────────────────
    # What triggered this run — a PR ID, a bug ID, a knowledge query, etc.
    job_type: Mapped[str] = mapped_column(String(50), nullable=False)
    reference_id: Mapped[str | None] = mapped_column(String(100), nullable=True)  # pr_id, bug_id

    # ─── Execution Metrics ────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        Enum("queued", "running", "completed", "failed", name="agent_run_status"),
        default="queued",
        index=True,
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ─── LLM Telemetry ───────────────────────────────────────────────────────
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    prompt_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    findings_count: Mapped[int] = mapped_column(Integer, default=0)

    # ─── Error Tracking ───────────────────────────────────────────────────────
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # ─── Relationships ────────────────────────────────────────────────────────
    logs: Mapped[list["AgentLog"]] = relationship(
        back_populates="agent_run", cascade="all, delete-orphan", order_by="AgentLog.logged_at"
    )

    @property
    def latency_ms(self) -> int | None:
        return self.duration_ms


class AgentLog(Base):
    """
    Individual log line from an agent execution.
    These power the 'console' view in the AI Workspace page.
    """
    __tablename__ = "agent_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    agent_run_id: Mapped[int] = mapped_column(
        ForeignKey("agent_runs.id", ondelete="CASCADE"), index=True
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    level: Mapped[str] = mapped_column(String(10), default="info")  # info/warning/error
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    agent_run: Mapped["AgentRun"] = relationship(back_populates="logs")

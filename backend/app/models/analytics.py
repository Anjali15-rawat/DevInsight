"""
AnalyticsSnapshot and DeveloperMetric ORM models.

AnalyticsSnapshot stores workspace-level aggregated KPIs per time period.
DeveloperMetric stores per-developer contribution metrics per repository per period.
Both are written by the analytics background job and read by the analytics API.
"""
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class AnalyticsSnapshot(Base):
    """
    Aggregated workspace-level engineering metrics, computed per sprint/week.
    Powers the main analytics dashboard charts.
    """
    __tablename__ = "analytics_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )

    # ─── Period ───────────────────────────────────────────────────────────────
    period_label: Mapped[str] = mapped_column(String(50), nullable=False)  # "Sprint 24" / "2026-W25"
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # ─── PR Metrics ───────────────────────────────────────────────────────────
    total_prs_merged: Mapped[int] = mapped_column(Integer, default=0)
    avg_pr_review_time_hours: Mapped[float] = mapped_column(Float, default=0.0)
    avg_time_to_first_review_hours: Mapped[float] = mapped_column(Float, default=0.0)
    pr_merge_rate: Mapped[float] = mapped_column(Float, default=0.0)  # 0.0–1.0

    # ─── Quality Metrics ──────────────────────────────────────────────────────
    total_findings: Mapped[int] = mapped_column(Integer, default=0)
    critical_findings: Mapped[int] = mapped_column(Integer, default=0)
    avg_health_score: Mapped[float] = mapped_column(Float, default=0.0)
    total_vulnerabilities: Mapped[int] = mapped_column(Integer, default=0)

    # ─── AI Efficiency ────────────────────────────────────────────────────────
    ai_reviews_performed: Mapped[int] = mapped_column(Integer, default=0)
    estimated_hours_saved: Mapped[float] = mapped_column(Float, default=0.0)
    agent_accuracy_pct: Mapped[float] = mapped_column(Float, default=0.0)  # Findings accepted/(accepted+false_positive)

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class DeveloperMetric(Base):
    """
    Per-developer contribution metrics for the analytics leaderboard.
    """
    __tablename__ = "developer_metrics"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )

    # ─── Developer Identity ───────────────────────────────────────────────────
    github_login: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # ─── Period ───────────────────────────────────────────────────────────────
    period_label: Mapped[str] = mapped_column(String(50), nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # ─── Metrics ──────────────────────────────────────────────────────────────
    commits_count: Mapped[int] = mapped_column(Integer, default=0)
    prs_opened: Mapped[int] = mapped_column(Integer, default=0)
    prs_merged: Mapped[int] = mapped_column(Integer, default=0)
    reviews_given: Mapped[int] = mapped_column(Integer, default=0)
    avg_response_time_minutes: Mapped[float] = mapped_column(Float, default=0.0)
    lines_added: Mapped[int] = mapped_column(Integer, default=0)
    lines_deleted: Mapped[int] = mapped_column(Integer, default=0)
    engagement_score: Mapped[float] = mapped_column(Float, default=0.0)  # 0–100

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

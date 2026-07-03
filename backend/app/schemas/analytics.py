"""Analytics Pydantic schemas — matching chart data shapes expected by the frontend analytics.tsx."""
from datetime import datetime
from pydantic import BaseModel


class PRMetricsPoint(BaseModel):
    """One data point for the PR metrics line chart."""
    period_label: str
    avg_review_time_hours: float
    total_prs: int
    merge_rate: float


class QualityHistoryPoint(BaseModel):
    """One data point for the quality trend chart — matches mockQualityHistory."""
    period_label: str
    total_findings: int
    critical_findings: int
    avg_health_score: float
    total_vulnerabilities: int
    ai_reviews: int


class DeveloperKPIRead(BaseModel):
    """Per-developer leaderboard entry — matches mockDeveloperMetrics."""
    github_login: str
    display_name: str | None
    avatar_url: str | None
    commits_count: int
    reviews_given: int
    avg_response_time_minutes: float
    engagement_score: float
    period_label: str

    model_config = {"from_attributes": True}


class OverviewKPIs(BaseModel):
    """
    Top-level KPI cards shown on the dashboard.
    Matches the stat cards in dashboard.tsx.
    """
    total_repositories: int
    total_open_prs: int
    critical_findings_unresolved: int
    avg_health_score: float
    ai_reviews_this_month: int
    estimated_hours_saved_this_month: float
    total_security_alerts_unresolved: int


class AnalyticsResponse(BaseModel):
    overview: OverviewKPIs
    pr_metrics_history: list[PRMetricsPoint]
    quality_history: list[QualityHistoryPoint]
    developer_kpis: list[DeveloperKPIRead]

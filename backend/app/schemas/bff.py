"""
Backend-for-Frontend (BFF) response schemas.
Aggregates multiple underlying models into optimized single-payload responses for frontend views.
"""
from typing import Any
from pydantic import BaseModel

from app.schemas.analytics import OverviewKPIs, DeveloperKPIRead
from app.schemas.repository import RepositoryRead, RepositoryHealthRead
from app.schemas.pull_request import PullRequestRead
from app.schemas.bug import BugRead
from app.schemas.notification import NotificationRead


class DashboardBFFResponse(BaseModel):
    """Aggregated payload for the primary Dashboard view."""
    overview: OverviewKPIs
    health_map: list[RepositoryRead]
    ai_recommendations: list[dict[str, Any]]
    recent_prs: list[PullRequestRead]
    recent_bugs: list[BugRead]
    notifications: list[NotificationRead]
    developer_activity: list[DeveloperKPIRead]
    trend_data: list[dict[str, Any]]


class RepositoryBFFResponse(BaseModel):
    """Aggregated payload for the Repository detail view."""
    repository: RepositoryRead
    health_history: list[RepositoryHealthRead]
    intelligence_report: dict[str, Any] | None
    tech_debt_report: dict[str, Any] | None
    pull_requests: list[PullRequestRead]
    bugs: list[BugRead]


class PullRequestBFFResponse(BaseModel):
    """Aggregated payload for the Pull Request detail view."""
    pull_request: PullRequestRead
    intelligence_report: dict[str, Any] | None

"""Repository Pydantic schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, HttpUrl, Field


class RepositoryInsights(BaseModel):
    """Computed analytics insights shown in the repository card."""

    pr_review_time: str = Field(..., examples=["1.2h avg"])
    code_coverage: str = Field(..., examples=["88.4%"])
    security_grade: Literal["A", "B", "C", "D", "F"]
    ai_savings: str = Field(..., examples=["32 hrs/mo"])


class RepositoryRead(BaseModel):
    """Repository returned by the API."""

    id: int
    github_repo_id: int

    name: str
    full_name: str
    owner: str

    description: str | None = None

    html_url: HttpUrl

    health_score: float
    security_grade: str

    open_prs_count: int
    open_issues_count: int
    security_alerts_count: int

    language: str | None = None
    language_color: str | None = None

    stars: int
    forks: int

    analyzed_lines: int

    insights: RepositoryInsights | None = None

    last_synced_at: datetime | None = None
    last_analyzed_at: datetime | None = None

    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RepositoryConnectRequest(BaseModel):
    """Request body for connecting a GitHub repository."""

    github_full_name: str = Field(
        ...,
        min_length=3,
        max_length=200,
        examples=["microsoft/vscode"],
    )


class RepositoryHealthRead(BaseModel):
    """Repository health history."""

    health_score: float
    security_grade: str

    open_prs: int
    open_issues: int
    security_alerts: int

    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GitHubRepositoryRead(BaseModel):
    """
    Repository returned from GitHub discovery.

    Used when browsing repositories available
    to connect to a workspace.
    """

    github_repo_id: int

    name: str
    full_name: str
    owner: str

    description: str | None = None

    is_private: bool

    html_url: HttpUrl

    language: str | None = None

    stars: int
    forks: int

    is_connected: bool

    model_config = ConfigDict(
        from_attributes=True,
        extra="ignore",
    )
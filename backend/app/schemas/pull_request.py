"""Pull Request and Finding Pydantic schemas."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class PRAuthor(BaseModel):
    name: str | None
    username: str
    avatar_url: str | None


class PRFindingRead(BaseModel):
    """A single AI finding — matches the AiFinding interface in the frontend."""
    id: int
    agent_type: str
    file_path: str
    line_number: int | None
    code_snippet: str | None
    severity: Literal["critical", "warning", "optimization"]
    confidence: Literal["high", "medium", "low"]
    explanation: str
    suggested_fix: str | None
    estimated_impact: str | None
    related_doc: str | None
    doc_url: str | None
    status: Literal["pending", "accepted", "ignored", "false_positive"]
    created_at: datetime

    model_config = {"from_attributes": True}


class PullRequestRead(BaseModel):
    """Full PR object — matches the PullRequest interface in frontend mock-data."""
    id: int
    github_pr_id: int
    number: int
    title: str
    author: PRAuthor
    repository: str         # repository name
    head_branch: str
    base_branch: str
    additions: int
    deletions: int
    changed_files: int
    review_status: str
    build_status: str
    ai_insights_summary: str | None
    findings: list[PRFindingRead] = []
    github_created_at: datetime | None
    github_merged_at: datetime | None

    model_config = {"from_attributes": True}


class PRFindingFeedbackRequest(BaseModel):
    """Developer feedback on a single finding."""
    status: Literal["accepted", "ignored", "false_positive"]
    comment: str | None = None

"""Bug Pydantic schemas."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class BugAssignee(BaseModel):
    name: str | None
    avatar_url: str | None


class BugRootCauseRead(BaseModel):
    likely_cause: str
    affected_file: str | None
    affected_function: str | None
    suggested_fix: str | None
    confidence: str
    analyzed_at: datetime

    model_config = {"from_attributes": True}


class BugRead(BaseModel):
    """Matches the MockBug interface in the frontend bugs.tsx."""
    id: int
    github_issue_id: int
    issue_number: int
    title: str
    body: str | None
    html_url: str
    priority: Literal["P0", "P1", "P2", "P3"]
    status: Literal["Triage", "Backlog", "In Progress", "Resolved"]
    category: str
    repository: str    # repository name
    assignee: BugAssignee | None
    root_cause: BugRootCauseRead | None = None
    github_created_at: datetime | None
    github_closed_at: datetime | None

    model_config = {"from_attributes": True}


class BugStatusUpdate(BaseModel):
    """Update bug triage status."""
    status: Literal["Triage", "Backlog", "In Progress", "Resolved"]

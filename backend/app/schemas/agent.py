"""Agent Pydantic schemas — matches the Agent interface in ai-workspace.tsx."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class AgentLogRead(BaseModel):
    message: str
    level: str
    logged_at: datetime

    model_config = {"from_attributes": True}


class AgentRunRead(BaseModel):
    """A single agent execution record."""
    id: int
    agent_type: str
    job_type: str
    reference_id: str | None
    status: Literal["queued", "running", "completed", "failed"]
    duration_ms: int | None
    model_used: str | None
    prompt_tokens: int | None
    completion_tokens: int | None
    total_tokens: int | None
    findings_count: int
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    logs: list[AgentLogRead] = []

    model_config = {"from_attributes": True}


class AgentStatusRead(BaseModel):
    """
    Summary view of an agent shown in the AI Workspace agent list.
    Matches the Agent interface in ai-workspace.tsx.
    """
    id: str           # e.g. "ag-code"
    name: str
    type: str
    status: Literal["idle", "active", "error"]
    current_task: str
    confidence: float
    jobs_today: int
    success_rate: float
    latency: str       # formatted: "450ms", "1.2s"
    description: str


class AgentTriggerRequest(BaseModel):
    """Manually trigger an agent run from the AI Workspace."""
    agent_type: Literal["code_quality", "security", "performance", "bug_triage", "root_cause", "knowledge"]
    reference_id: str | None = None   # PR ID, bug ID, etc.


class AgentTriggerResponse(BaseModel):
    job_id: str
    agent_type: str
    status: str = "queued"
    message: str

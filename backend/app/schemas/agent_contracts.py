from typing import Any
from pydantic import BaseModel, Field


class AgentInput(BaseModel):
    """Standardized input contract for all AI Agents."""
    task_id: str = Field(..., description="Unique identifier for this execution task")
    target_type: str = Field(..., description="Type of target: 'pull_request', 'issue', 'query', etc.")
    target_content: str = Field(..., description="The main content to analyze (e.g., diff, body, query)")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional context (repo, author, etc.)")
    rag_context: str | None = Field(default=None, description="Optional retrieved context from knowledge base")


class AgentFinding(BaseModel):
    """A single finding/insight returned by an AI Agent."""
    title: str = Field(..., description="Short descriptive title of the finding")
    description: str = Field(..., description="Detailed explanation of the finding")
    severity: str = Field(..., description="'critical', 'high', 'medium', 'low', 'info'")
    recommendation: str | None = Field(default=None, description="Suggested action to resolve the finding")
    file_path: str | None = Field(default=None, description="Path to the file if applicable")
    line_number: int | None = Field(default=None, description="Line number in the file if applicable")


class AgentOutput(BaseModel):
    """Standardized output contract for all AI Agents."""
    status: str = Field(..., description="'success', 'partial_failure', 'failure'")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Agent's confidence in its findings (0.0 to 1.0)")
    summary: str = Field(..., description="A brief summary of the overall analysis")
    findings: list[AgentFinding] = Field(default_factory=list, description="List of specific findings")
    execution_duration_ms: int = Field(..., description="Time taken to execute in milliseconds")
    token_usage: dict[str, int] = Field(default_factory=dict, description="Tokens used (prompt, completion, total)")
    provider_used: str = Field(..., description="The AI provider used (e.g., 'gemini-2.5-flash')")

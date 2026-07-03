"""Notification Pydantic schemas."""
from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class NotificationRead(BaseModel):
    """Matches the Notification interface in frontend mock-data.ts."""
    id: int
    title: str
    description: str
    notification_type: Literal["security", "pr_review", "build", "general"]
    is_read: bool
    repo_name: str | None
    reference_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationMarkReadRequest(BaseModel):
    notification_ids: list[int]

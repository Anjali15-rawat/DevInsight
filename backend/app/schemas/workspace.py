"""Workspace Pydantic schemas."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator


class WorkspaceCreate(BaseModel):
    name: str
    slug: str
    logo_color: str = "bg-indigo-600"
    github_org_login: str | None = None

    @field_validator("slug")
    @classmethod
    def slug_must_be_valid(cls, v: str) -> str:
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Slug must contain only letters, numbers, hyphens, and underscores")
        return v.lower()


class WorkspaceRead(BaseModel):
    id: int
    name: str
    slug: str
    logo_color: str
    plan: str
    github_org_login: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceMemberRead(BaseModel):
    user_id: int
    github_login: str
    name: str | None
    avatar_url: str | None
    role: Literal["Owner", "Admin", "Member"]
    joined_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceInviteRequest(BaseModel):
    github_login: str
    role: Literal["Admin", "Member"] = "Member"

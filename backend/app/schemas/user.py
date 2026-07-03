"""User Pydantic schemas."""
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    """Public user profile returned by the API."""
    id: int
    github_login: str
    name: str | None
    email: str | None
    avatar_url: str | None
    bio: str | None
    notify_security_alerts: bool
    notify_pr_reviews: bool
    notify_build_failures: bool
    created_at: datetime
    last_active_at: datetime | None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Fields a user can update on their own profile."""
    name: str | None = None
    bio: str | None = None
    notify_security_alerts: bool | None = None
    notify_pr_reviews: bool | None = None
    notify_build_failures: bool | None = None

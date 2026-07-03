"""
Authentication Pydantic schemas.

These define the exact JSON shapes for auth-related API requests and responses.
The frontend TanStack Router auth routes map directly to these contracts.
"""
from pydantic import BaseModel, HttpUrl


class GitHubOAuthCallbackRequest(BaseModel):
    """Query params returned by GitHub after OAuth authorization."""
    code: str
    state: str | None = None


class TokenResponse(BaseModel):
    """
    Returned on successful login or token refresh.
    The frontend stores access_token in memory and refresh_token in HttpOnly cookie.
    """
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int  # seconds


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AuthStatusResponse(BaseModel):
    """Quick check to see if a token is valid — used for frontend auth guard."""
    authenticated: bool
    user_id: int | None = None
    github_login: str | None = None
    name: str | None = None
    email: str | None = None
    avatar_url: str | None = None

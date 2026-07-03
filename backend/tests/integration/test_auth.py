"""Integration test for authentication endpoints."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


@pytest.mark.asyncio
async def test_auth_me_without_token_returns_401(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_auth_me_with_invalid_token_returns_401(client):
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_auth_github_redirects(client):
    """The /auth/github endpoint should return a redirect to GitHub."""
    response = await client.get("/api/v1/auth/github", follow_redirects=False)
    assert response.status_code in (302, 307)
    assert "github.com/login/oauth/authorize" in response.headers.get("location", "")

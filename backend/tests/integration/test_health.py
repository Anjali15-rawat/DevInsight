"""Integration test for the health check endpoint."""
import pytest


@pytest.mark.asyncio
async def test_health_check_returns_200(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


@pytest.mark.asyncio
async def test_health_check_returns_correct_schema(client):
    response = await client.get("/health")
    data = response.json()
    assert set(data.keys()) >= {"status", "env", "version"}

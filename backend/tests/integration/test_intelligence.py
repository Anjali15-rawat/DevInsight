"""
Integration tests for the Engineering Intelligence API endpoints.
"""
import pytest
import random
from datetime import datetime, UTC
from fastapi import status

from app.main import app
from app.api.deps import get_current_user
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.repository import Repository
from app.models.pull_request import PullRequest, PullRequestFinding
from app.models.bug import Bug
from app.services.intelligence.cache import intelligence_cache


@pytest.fixture
async def setup_test_data(db_session):
    """
    Sets up a workspace, repository, PR, bug, and user in the test database.
    """
    # Use randomized IDs to avoid UNIQUE constraint failures across test runs
    uid = random.randint(100000, 999999)

    # Create mock User
    user = User(
        github_id=uid,
        github_login=f"testuser_{uid}",
        email=f"test_{uid}@devinsight.io",
        avatar_url="https://avatar.url/u",
        github_access_token="mock-token",
    )
    db_session.add(user)
    await db_session.flush()

    # Create mock Workspace (slug is required, no owner_id field)
    workspace = Workspace(
        name="Test Workspace",
        slug=f"test-workspace-{uid}",
    )
    db_session.add(workspace)
    await db_session.flush()

    # Link user to workspace
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role="Admin",
    )
    db_session.add(member)

    # Create mock Repository
    repo = Repository(
        workspace_id=workspace.id,
        github_repo_id=uid * 1000,
        name="test-repo",
        full_name=f"testowner/test-repo-{uid}",
        owner="testowner",
        html_url=f"https://github.com/testowner/test-repo-{uid}",
        language="Python",
        stars=10,
        forks=2,
        analyzed_lines=2500,
        code_coverage=82.5,
    )
    db_session.add(repo)
    await db_session.flush()

    # Create mock PR
    pr = PullRequest(
        repository_id=repo.id,
        github_pr_id=uid * 10,
        number=42,
        title="feat: add cache layer",
        author_github_login="testuser",
        head_branch="feature/cache",
        base_branch="main",
        head_sha="abcdef1234567890abcdef1234567890abcdef12",
        additions=220,
        deletions=15,
        changed_files=3,
        review_status="Approved",
        build_status="success",
        html_url=f"https://github.com/testowner/test-repo/pull/{uid}",
    )
    db_session.add(pr)
    await db_session.flush()

    # Create mock PR findings
    finding = PullRequestFinding(
        pull_request_id=pr.id,
        agent_type="code_quality",
        file_path="app/cache.py",
        line_number=10,
        code_snippet="def get_cache(): pass",
        severity="warning",
        confidence="high",
        explanation="Consider adding logging for cache misses.",
        status="pending",
    )
    db_session.add(finding)

    # Create mock Bug
    bug = Bug(
        repository_id=repo.id,
        github_issue_id=uid * 100,
        issue_number=101,
        title="bug: cache returns None unexpectedly",
        html_url=f"https://github.com/testowner/test-repo/issues/{uid}",
        priority="P1",
        category="Other",
        status="Triage",
        github_created_at=datetime.now(UTC),
    )
    db_session.add(bug)
    await db_session.flush()

    return {
        "user": user,
        "workspace": workspace,
        "repo": repo,
        "pr": pr,
        "bug": bug,
    }


@pytest.mark.asyncio
async def test_get_repository_intelligence_api(client, setup_test_data):
    """Test GET /api/v1/intelligence/repository/{repo_id}"""
    test_data = setup_test_data
    user = test_data["user"]
    repo = test_data["repo"]

    app.dependency_overrides[get_current_user] = lambda: user

    response = await client.get(f"/api/v1/intelligence/repository/{repo.id}")
    app.dependency_overrides.clear()

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["repository_id"] == repo.id
    assert data["name"] == repo.name
    assert "health_score" in data
    assert "activity_score" in data
    assert "metrics" in data


@pytest.mark.asyncio
async def test_get_pull_request_intelligence_api(client, setup_test_data):
    """Test GET /api/v1/intelligence/pull-requests/{pr_id}"""
    test_data = setup_test_data
    user = test_data["user"]
    pr = test_data["pr"]

    app.dependency_overrides[get_current_user] = lambda: user

    response = await client.get(f"/api/v1/intelligence/pull-requests/{pr.id}")
    app.dependency_overrides.clear()

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["pr_id"] == pr.id
    assert data["complexity"] in ("high", "medium", "low")
    assert "estimated_review_time_minutes" in data
    assert "risks" in data


@pytest.mark.asyncio
async def test_get_bug_intelligence_api(client, setup_test_data):
    """Test GET /api/v1/intelligence/bugs"""
    test_data = setup_test_data
    user = test_data["user"]
    workspace = test_data["workspace"]

    app.dependency_overrides[get_current_user] = lambda: user

    response = await client.get(f"/api/v1/intelligence/bugs?workspace_id={workspace.id}")
    app.dependency_overrides.clear()

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "bug_health_score" in data
    assert "hotspots" in data
    assert data["metrics"]["total_bugs_reported"] == 1


@pytest.mark.asyncio
async def test_get_technical_debt_api(client, setup_test_data):
    """Test GET /api/v1/intelligence/tech-debt/{repo_id}"""
    test_data = setup_test_data
    user = test_data["user"]
    repo = test_data["repo"]

    app.dependency_overrides[get_current_user] = lambda: user

    response = await client.get(f"/api/v1/intelligence/tech-debt/{repo.id}")
    app.dependency_overrides.clear()

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "technical_debt_score" in data
    assert "components" in data
    assert "high_risk_areas" in data


@pytest.mark.asyncio
async def test_get_recommendations_api(client, setup_test_data):
    """Test GET /api/v1/intelligence/recommendations"""
    test_data = setup_test_data
    user = test_data["user"]
    workspace = test_data["workspace"]

    app.dependency_overrides[get_current_user] = lambda: user

    response = await client.get(f"/api/v1/intelligence/recommendations?workspace_id={workspace.id}")
    app.dependency_overrides.clear()

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "title" in data[0]
        assert "priority" in data[0]
        assert "expected_impact" in data[0]

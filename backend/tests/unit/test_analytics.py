"""
Unit tests for the Analytics Service.
"""
import pytest
import random
from datetime import datetime, UTC

from app.models.repository import Repository
from app.models.pull_request import PullRequest, PullRequestFinding
from app.services.analytics import get_overview_kpis


@pytest.mark.asyncio
async def test_get_overview_kpis_empty_db(db_session):
    """
    Ensure get_overview_kpis returns safe zeroed values when no records exist.
    """
    workspace_id = random.randint(1000, 9999)
    overview = await get_overview_kpis(db_session, workspace_id)
    assert overview.total_repositories == 0
    assert overview.total_open_prs == 0
    assert overview.critical_findings_unresolved == 0
    assert overview.avg_health_score == 0.0
    assert overview.ai_reviews_this_month == 0
    assert overview.estimated_hours_saved_this_month == 0.0
    assert overview.total_security_alerts_unresolved == 0


@pytest.mark.asyncio
async def test_get_overview_kpis_calculations(db_session):
    """
    Test that get_overview_kpis aggregates repository, PR, and finding stats correctly.
    """
    uid = random.randint(10000, 99999)
    workspace_id = uid

    # Create repositories
    repo1 = Repository(
        workspace_id=workspace_id,
        github_repo_id=uid * 10,
        name="api-service",
        full_name=f"test/api-service-{uid}",
        owner="test",
        html_url="https://github.com/test/api",
        health_score=92.5,
        security_alerts_count=3,
    )
    repo2 = Repository(
        workspace_id=workspace_id,
        github_repo_id=uid * 20,
        name="web-frontend",
        full_name=f"test/web-frontend-{uid}",
        owner="test",
        html_url="https://github.com/test/web",
        health_score=84.0,
        security_alerts_count=1,
    )
    db_session.add(repo1)
    db_session.add(repo2)
    await db_session.flush()

    # Create pull requests
    pr1 = PullRequest(
        repository_id=repo1.id,
        github_pr_id=uid * 100,
        number=1,
        title="feat: database indexes",
        author_github_login="developer",
        head_branch="db-idx",
        base_branch="main",
        head_sha="sha1",
        github_state="open",
        html_url="https://github.com/test/api/pull/1",
        ai_review_posted_at=datetime.now(UTC),
    )
    pr2 = PullRequest(
        repository_id=repo2.id,
        github_pr_id=uid * 200,
        number=2,
        title="fix: frontend layout",
        author_github_login="developer",
        head_branch="layout",
        base_branch="main",
        head_sha="sha2",
        github_state="closed",  # closed is not open
        html_url="https://github.com/test/web/pull/2",
    )
    db_session.add(pr1)
    db_session.add(pr2)
    await db_session.flush()

    # Create findings
    finding1 = PullRequestFinding(
        pull_request_id=pr1.id,
        agent_type="security",
        file_path="db.py",
        line_number=15,
        severity="critical",
        confidence="high",
        explanation="SQL injection warning",
        status="pending",
    )
    finding2 = PullRequestFinding(
        pull_request_id=pr1.id,
        agent_type="code_quality",
        file_path="query.py",
        line_number=20,
        severity="warning",  # not critical
        confidence="medium",
        explanation="Consider refactoring",
        status="pending",
    )
    db_session.add(finding1)
    db_session.add(finding2)
    await db_session.flush()

    # Calculate overview stats
    overview = await get_overview_kpis(db_session, workspace_id)

    assert overview.total_repositories == 2
    assert overview.total_open_prs == 1  # only pr1 is open
    assert overview.critical_findings_unresolved == 1  # only finding1 is critical + pending
    assert overview.avg_health_score == 88.2  # (92.5 + 84.0) / 2 = 88.25 -> 88.2 (banker's rounding)
    assert overview.ai_reviews_this_month == 1  # only pr1 has review posted this month
    assert overview.estimated_hours_saved_this_month == 1.5
    assert overview.total_security_alerts_unresolved == 4  # 3 + 1

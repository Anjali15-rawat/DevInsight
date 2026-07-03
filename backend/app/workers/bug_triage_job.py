"""
Bug Triage and Root Cause Analysis background job.

Triggered by: GitHub webhook → issues event (opened/reopened)
"""
import structlog
from typing import Any
from datetime import datetime, UTC
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database.session import AsyncSessionLocal
from app.models.repository import Repository
from app.models.bug import Bug, BugRootCause
from app.models.workspace import WorkspaceMember
from app.agents.base_agent import agent_registry
from app.schemas.agent_contracts import AgentInput
from app.services.notification_service import create_notification

logger = structlog.get_logger(__name__)


def _priority_to_severity(priority: str) -> str:
    """Map P0-P3 to AgentFinding severity levels."""
    mapping = {"P0": "critical", "P1": "high", "P2": "medium", "P3": "low"}
    return mapping.get(priority, "medium")


async def run_bug_triage(ctx: dict[str, Any], *, issue_data: dict[str, Any]) -> None:
    """
    ARQ job function for issue triage and root cause analysis.
    """
    async with AsyncSessionLocal() as db:
        # ── Step 1: Find the repository record ─────────────────────────────
        repo_stmt = select(Repository).where(
            Repository.github_repo_id == issue_data.get("repo_id")
        )
        repo_result = await db.execute(repo_stmt)
        repo = repo_result.scalar_one_or_none()

        if not repo:
            logger.warning("triage_repository_not_found", repo_id=issue_data.get("repo_id"))
            return

        # ── Step 2: Determine if this issue is classified as a bug ──────────
        labels = [l.lower() for l in issue_data.get("labels", [])]
        is_bug = "bug" in labels or "error" in labels or "issue" in labels or any("bug" in lbl for lbl in labels)

        if not is_bug:
            title_lower = issue_data.get("title", "").lower()
            is_bug = any(keyword in title_lower for keyword in ["fix", "error", "bug", "crash", "fail", "broken", "issue"])

        if not is_bug:
            logger.info("issue_not_classified_as_bug", issue_number=issue_data.get("issue_number"))
            return

        # ── Step 3: Handle issue closing ────────────────────────────────────
        if issue_data.get("action") == "closed":
            bug_stmt = select(Bug).where(
                Bug.repository_id == repo.id,
                Bug.github_issue_id == issue_data.get("issue_id")
            )
            bug_result = await db.execute(bug_stmt)
            bug = bug_result.scalar_one_or_none()
            if bug:
                bug.status = "Resolved"
                if issue_data.get("closed_at"):
                    try:
                        bug.github_closed_at = datetime.fromisoformat(issue_data["closed_at"].replace("Z", "+00:00"))
                    except Exception:
                        bug.github_closed_at = datetime.now(UTC)
                await db.commit()
                logger.info("bug_marked_resolved", bug_id=bug.id)
            return

        # ── Step 4: Create or Reopen Bug record ──────────────────────────────
        bug_stmt = select(Bug).options(selectinload(Bug.root_cause)).where(
            Bug.repository_id == repo.id,
            Bug.github_issue_id == issue_data.get("issue_id")
        )
        bug_result = await db.execute(bug_stmt)
        bug = bug_result.scalar_one_or_none()

        created_at_dt = None
        if issue_data.get("created_at"):
            try:
                created_at_dt = datetime.fromisoformat(issue_data["created_at"].replace("Z", "+00:00"))
            except Exception:
                created_at_dt = datetime.now(UTC)

        if not bug:
            bug = Bug(
                repository_id=repo.id,
                github_issue_id=issue_data.get("issue_id"),
                issue_number=issue_data.get("issue_number"),
                title=issue_data.get("title"),
                body=issue_data.get("body"),
                html_url=issue_data.get("html_url"),
                status="Triage",
                github_created_at=created_at_dt
            )
            db.add(bug)
            await db.flush()
        else:
            bug.title = issue_data.get("title")
            bug.body = issue_data.get("body")
            bug.html_url = issue_data.get("html_url")
            if bug.status == "Resolved":
                bug.status = "Triage"  # Reopened

        # ── Step 5: Run Bug Triage Agent ────────────────────────────────────
        triage_agent = agent_registry.get_agent("bug_triage")
        agent_input = AgentInput(
            task_id=f"bug_triage_{bug.id}",
            target_type="issue",
            target_content=bug.body or "",
            metadata={"title": bug.title, "repo": repo.full_name}
        )

        priority = "P2"
        category = "Other"

        try:
            triage_output = await triage_agent.run(agent_input)
            if triage_output.status == "success" and triage_output.findings:
                finding = triage_output.findings[0]
                # Finding title expected: "Bug Classification: <priority> — <category>"
                title_parts = finding.title.split(":")
                if len(title_parts) > 1:
                    classification = title_parts[1].split("—")
                    if len(classification) >= 1:
                        p_candidate = classification[0].strip().upper()
                        if p_candidate in ("P0", "P1", "P2", "P3"):
                            priority = p_candidate
                    if len(classification) >= 2:
                        c_candidate = classification[1].strip()
                        if c_candidate in ("Database", "Hydration", "Security", "Performance", "Auth", "Network", "UI", "Other"):
                            category = c_candidate
                
                bug.priority = priority
                bug.category = category
                logger.info("bug_triaged_by_agent", bug_id=bug.id, priority=priority, category=category)
        except Exception as e:
            logger.error("bug_triage_agent_failed", bug_id=bug.id, error=str(e))

        # ── Step 6: Run Root Cause Agent ────────────────────────────────────
        rc_agent = agent_registry.get_agent("root_cause")
        try:
            rc_output = await rc_agent.run(agent_input)
            if rc_output.status == "success" and rc_output.findings:
                finding = rc_output.findings[0]
                
                if not bug.root_cause:
                    rc_record = BugRootCause(
                        bug_id=bug.id,
                        likely_cause=finding.description,
                        affected_file=finding.file_path,
                        suggested_fix=finding.recommendation,
                        confidence=rc_output.confidence_score
                    )
                    db.add(rc_record)
                else:
                    bug.root_cause.likely_cause = finding.description
                    bug.root_cause.affected_file = finding.file_path
                    bug.root_cause.suggested_fix = finding.recommendation
                    bug.root_cause.confidence = rc_output.confidence_score
                logger.info("bug_root_cause_analyzed", bug_id=bug.id)
        except Exception as e:
            logger.error("root_cause_agent_failed", bug_id=bug.id, error=str(e))

        # ── Step 7: Push Notifications ──────────────────────────────────────
        try:
            user_ids_stmt = select(WorkspaceMember.user_id).where(WorkspaceMember.workspace_id == repo.workspace_id)
            user_ids_result = await db.execute(user_ids_stmt)
            user_ids = [row[0] for row in user_ids_result.all()]

            await create_notification(
                db=db,
                user_ids=user_ids,
                title=f"New bug triaged: #{bug.issue_number}",
                description=f"[{priority}] {bug.title[:60]} classified in area {category}.",
                notification_type="bug",
                repo_name=repo.name,
                reference_url=bug.html_url
            )
        except Exception as e:
            logger.error("triage_notifications_failed", error=str(e))

        await db.commit()

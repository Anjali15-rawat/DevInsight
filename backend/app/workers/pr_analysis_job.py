"""
PR Analysis background job.

Triggered by: GitHub webhook → pull_request event (opened/synchronize)

Flow:
  1. Create AgentRun record (status: running)
  2. Fetch PR diff from GitHub API
  3. Retrieve relevant RAG chunks for additional context
  4. Run Code Quality + Security + Performance agents concurrently
  5. Parse and persist all findings to PostgreSQL
  6. Post structured AI review to GitHub PR
  7. Send WebSocket notification to connected users
  8. Update AgentRun status to completed
"""
import asyncio
from datetime import UTC, datetime
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.orchestrator import orchestrator
from app.database.session import AsyncSessionLocal
from app.github.client import GitHubClient
from app.github.pr_fetcher import fetch_pr_diff, fetch_pr_files
from app.github.review_poster import post_pr_review
from app.models.agent import AgentLog, AgentRun
from app.models.pull_request import PullRequest, PullRequestFinding
from app.rag.retriever import retrieve_relevant_chunks, format_chunks_for_prompt
from app.services.notification_service import create_notification

logger = structlog.get_logger(__name__)


async def run_pr_analysis(ctx: dict[str, Any], *, pr_data: dict[str, Any]) -> None:
    """
    ARQ job function for full PR analysis.

    Args:
        ctx: ARQ context (contains redis connection)
        pr_data: Parsed PR webhook payload from webhook_parser.parse_pr_event()
    """
    async with AsyncSessionLocal() as db:
        agent_run = await _create_agent_run(db, pr_data)

        try:
            agent_run.started_at = datetime.now(UTC)
            agent_run.status = "running"
            await db.commit()

            await _log(db, agent_run.id, f"PR analysis starting for {pr_data.get('repo_full_name')} PR #{pr_data.get('pr_number')}")

            # ── Step 1: Find the repository record ─────────────────────────────
            from sqlalchemy import select
            from app.models.repository import Repository
            repo_stmt = select(Repository).where(
                Repository.github_repo_id == pr_data.get("repo_id")
            )
            repo_result = await db.execute(repo_stmt)
            repo = repo_result.scalar_one_or_none()

            if not repo:
                await _log(db, agent_run.id, f"Repository not found in DB: {pr_data.get('repo_full_name')}", "warning")
                agent_run.status = "failed"
                agent_run.error_message = "Repository not connected to DevInsight"
                await db.commit()
                return

            # ── Step 2: Upsert the PullRequest record ──────────────────────────
            pr = await _upsert_pull_request(db, repo.id, pr_data)
            await _log(db, agent_run.id, f"PR #{pr_data.get('pr_number')} record synced. Fetching diff...")

            # ── Step 3: Fetch diff from GitHub ────────────────────────────────
            from sqlalchemy import select
            from app.models.workspace import WorkspaceMember
            from app.models.user import User

            user_token_stmt = (
                select(User.github_access_token)
                .join(WorkspaceMember)
                .where(
                    WorkspaceMember.workspace_id == repo.workspace_id,
                    User.github_access_token.is_not(None)
                )
                .limit(1)
            )
            user_token_result = await db.execute(user_token_stmt)
            github_token = user_token_result.scalar()

            # Decrypt the token
            from app.core.security import decrypt_token
            github_token = decrypt_token(github_token)

            if not github_token:
                # Fall back to token passed in context or settings
                github_token = ctx.get("github_token", "") or settings.GITHUB_CLIENT_SECRET

            if not github_token:
                raise ValueError("No valid GitHub access token found for workspace or settings")

            async with GitHubClient(github_token) as gh:
                diff = await fetch_pr_diff(
                    gh,
                    pr_data.get("repo_owner"),
                    pr_data.get("repo_name"),
                    pr_data.get("pr_number"),
                )
                files = await fetch_pr_files(
                    gh,
                    pr_data.get("repo_owner"),
                    pr_data.get("repo_name"),
                    pr_data.get("pr_number"),
                )

            await _log(db, agent_run.id, f"Diff fetched: {len(diff)} chars, {len(files)} files changed")

            # ── Step 4: RAG retrieval ──────────────────────────────────────────
            await _log(db, agent_run.id, "Querying knowledge base for relevant documentation...")
            rag_chunks = await retrieve_relevant_chunks(
                db, pr_data.get("pr_title", ""), repo.workspace_id
            )
            rag_context = format_chunks_for_prompt(rag_chunks)
            if rag_chunks:
                await _log(db, agent_run.id, f"Retrieved {len(rag_chunks)} relevant knowledge chunks")

            # ── Step 5: Run agents ─────────────────────────────────────────────
            await _log(db, agent_run.id, "Running Code Quality, Security, and Performance agents concurrently...")
            context = {
                "diff": diff,
                "pr_title": pr_data.get("pr_title"),
                "repo": pr_data.get("repo_full_name"),
                "package_files": _extract_package_file_content(files),
            }

            analysis_result = await orchestrator.analyze_pull_request(
                task_id=str(agent_run.id),
                target_content=diff,
                metadata=context,
                rag_context=rag_context,
            )
            findings = analysis_result.get("findings", [])

            await _log(db, agent_run.id, f"Analysis complete. Found {len(findings)} findings.")

            # ── Step 6: Persist findings ───────────────────────────────────────
            db_findings = await _persist_findings(db, pr.id, findings)

            # ── Step 7: Post review to GitHub ─────────────────────────────────
            summary = _build_review_summary(findings)
            async with GitHubClient(github_token) as gh:
                await post_pr_review(
                    gh,
                    pr_data.get("repo_owner"),
                    pr_data.get("repo_name"),
                    pr_data.get("pr_number"),
                    db_findings,
                    summary,
                )
            await _log(db, agent_run.id, "AI review posted to GitHub PR")

            # ── Step 8: Update PR review status ───────────────────────────────
            has_critical = any(f.severity == "critical" for f in db_findings)
            pr.review_status = "Changes Requested" if has_critical else "Approved"
            pr.ai_insights_summary = summary
            pr.ai_review_posted_at = datetime.now(UTC)

            # ── Step 9: Complete the agent run ────────────────────────────────
            agent_run.status = "completed"
            agent_run.completed_at = datetime.now(UTC)
            agent_run.findings_count = len(db_findings)
            agent_run.total_tokens = analysis_result.get("total_tokens", 0)
            agent_run.model_used = "gemini-2.5-flash"

            await db.commit()

            # ── Step 10: Notify users ─────────────────────────────────────────
            await create_notification(
                db=db,
                user_ids=await _get_workspace_user_ids(db, repo.workspace_id),
                title="AI Review Completed",
                description=f"PR #{pr_data.get('pr_number')} has been reviewed. {len(db_findings)} findings.",
                notification_type="pr_review",
                repo_name=pr_data.get("repo_name"),
            )
            await db.commit()

        except Exception as e:
            logger.error("pr_analysis_job_failed", error=str(e), pr_data=pr_data)
            agent_run.status = "failed"
            agent_run.error_message = str(e)
            agent_run.completed_at = datetime.now(UTC)
            await db.commit()
            raise


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _create_agent_run(db: AsyncSession, pr_data: dict) -> AgentRun:
    run = AgentRun(
        agent_type="code_quality",  # represents the PR analysis composite job
        job_type="pr_analysis",
        reference_id=str(pr_data.get("pr_number")),
        status="queued",
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return run


async def _log(db: AsyncSession, run_id: int, message: str, level: str = "info") -> None:
    log = AgentLog(agent_run_id=run_id, message=message, level=level)
    db.add(log)
    await db.flush()


async def _upsert_pull_request(
    db: AsyncSession,
    repository_id: int,
    pr_data: dict,
) -> PullRequest:
    from sqlalchemy import select
    stmt = select(PullRequest).where(PullRequest.github_pr_id == pr_data.get("pr_id"))
    result = await db.execute(stmt)
    pr = result.scalar_one_or_none()

    if not pr:
        pr = PullRequest(repository_id=repository_id)
        db.add(pr)

    pr.github_pr_id = pr_data.get("pr_id")
    pr.number = pr_data.get("pr_number")
    pr.title = pr_data.get("pr_title", "")
    pr.body = pr_data.get("pr_body")
    pr.html_url = pr_data.get("pr_html_url", "")
    pr.author_github_login = pr_data.get("author_login", "")
    pr.author_avatar_url = pr_data.get("author_avatar")
    pr.head_branch = pr_data.get("head_branch", "")
    pr.base_branch = pr_data.get("base_branch", "")
    pr.head_sha = pr_data.get("head_sha", "")
    pr.additions = pr_data.get("additions", 0)
    pr.deletions = pr_data.get("deletions", 0)
    pr.changed_files = pr_data.get("changed_files", 0)
    pr.github_state = pr_data.get("state", "open")
    pr.review_status = "AI Analyzing"

    await db.flush()
    return pr


async def _persist_findings(
    db: AsyncSession,
    pr_id: int,
    findings: list[dict],
) -> list[PullRequestFinding]:
    db_findings = []
    for f in findings:
        finding = PullRequestFinding(
            pull_request_id=pr_id,
            agent_type=f.get("agent_type", "code_quality"),
            file_path=f.get("file_path", "unknown"),
            line_number=f.get("line_number"),
            code_snippet=f.get("code_snippet"),
            severity=f.get("severity", "warning"),
            confidence=f.get("confidence", "medium"),
            explanation=f.get("explanation", ""),
            suggested_fix=f.get("suggested_fix"),
            estimated_impact=f.get("estimated_impact"),
            related_doc=f.get("related_doc"),
            doc_url=f.get("doc_url"),
        )
        db.add(finding)
        db_findings.append(finding)
    await db.flush()
    return db_findings


def _extract_package_file_content(files: list[dict]) -> str:
    """Extract package file content (package.json, requirements.txt, go.mod) from file list."""
    package_files = ["package.json", "requirements.txt", "go.mod", "Pipfile", "pyproject.toml"]
    content_parts = []
    for f in files:
        if any(f.get("filename", "").endswith(pkg) for pkg in package_files):
            patch = f.get("patch", "")
            if patch:
                content_parts.append(f"# {f.get('filename')}\n{patch}")
    return "\n\n".join(content_parts)


def _build_review_summary(findings: list[dict]) -> str:
    if not findings:
        return "✅ No issues detected. This pull request looks clean."
    critical = sum(1 for f in findings if f.get("severity") == "critical")
    warning = sum(1 for f in findings if f.get("severity") == "warning")
    optimization = sum(1 for f in findings if f.get("severity") == "optimization")
    parts = []
    if critical:
        parts.append(f"🔴 {critical} critical issue(s)")
    if warning:
        parts.append(f"🟡 {warning} warning(s)")
    if optimization:
        parts.append(f"🟢 {optimization} optimization suggestion(s)")
    return f"DevInsight AI found: {', '.join(parts)}. Review the inline comments below."


async def _get_workspace_user_ids(db: AsyncSession, workspace_id: int) -> list[int]:
    from sqlalchemy import select
    from app.models.workspace import WorkspaceMember
    stmt = select(WorkspaceMember.user_id).where(WorkspaceMember.workspace_id == workspace_id)
    result = await db.execute(stmt)
    return [row[0] for row in result.all()]

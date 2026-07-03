"""
GitHub webhook payload parser.

Parses raw GitHub webhook JSON payloads into typed Python objects.
Validates the HMAC-SHA256 signature before any payload processing.
"""
import hashlib
import hmac
from typing import Any

from app.core.config import settings
from app.core.exceptions import WebhookSignatureError


def verify_webhook_signature(payload_bytes: bytes, signature_header: str | None) -> None:
    """
    Verify that the webhook came from GitHub using HMAC-SHA256.

    GitHub sends the signature in the X-Hub-Signature-256 header
    as "sha256=<hex_digest>".

    Raises:
        WebhookSignatureError: If the signature is missing or invalid.
    """
    import structlog
    if settings.APP_ENV == "development" and not signature_header:
        logger = structlog.get_logger(__name__)
        logger.warning("webhook_signature_verification_skipped_in_development")
        return

    if not signature_header:
        raise WebhookSignatureError()

    if not signature_header.startswith("sha256="):
        raise WebhookSignatureError()

    received_sig = signature_header[len("sha256="):]
    expected_sig = hmac.new(
        settings.GITHUB_WEBHOOK_SECRET.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()

    # Use constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(received_sig, expected_sig):
        raise WebhookSignatureError()


def parse_pr_event(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Extract relevant fields from a pull_request webhook event.
    Returns a normalized dict for the PR analysis job.
    """
    pr = payload.get("pull_request", {})
    repo = payload.get("repository", {})
    return {
        "action": payload.get("action"),
        "pr_number": pr.get("number"),
        "pr_id": pr.get("id"),
        "pr_title": pr.get("title"),
        "pr_body": pr.get("body"),
        "pr_html_url": pr.get("html_url"),
        "author_login": pr.get("user", {}).get("login"),
        "author_avatar": pr.get("user", {}).get("avatar_url"),
        "head_branch": pr.get("head", {}).get("ref"),
        "base_branch": pr.get("base", {}).get("ref"),
        "head_sha": pr.get("head", {}).get("sha"),
        "additions": pr.get("additions", 0),
        "deletions": pr.get("deletions", 0),
        "changed_files": pr.get("changed_files", 0),
        "state": pr.get("state"),
        "merged_at": pr.get("merged_at"),
        "repo_full_name": repo.get("full_name"),
        "repo_id": repo.get("id"),
        "repo_name": repo.get("name"),
        "repo_owner": repo.get("owner", {}).get("login"),
        "repo_html_url": repo.get("html_url"),
        "repo_private": repo.get("private", False),
    }


def parse_issue_event(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Extract relevant fields from an issues webhook event.
    Returns a normalized dict for the bug triage job.
    """
    issue = payload.get("issue", {})
    repo = payload.get("repository", {})
    return {
        "action": payload.get("action"),
        "issue_id": issue.get("id"),
        "issue_number": issue.get("number"),
        "title": issue.get("title"),
        "body": issue.get("body"),
        "html_url": issue.get("html_url"),
        "state": issue.get("state"),
        "author_login": issue.get("user", {}).get("login"),
        "assignee_login": (issue.get("assignee") or {}).get("login"),
        "labels": [label.get("name") for label in issue.get("labels", [])],
        "repo_full_name": repo.get("full_name"),
        "repo_id": repo.get("id"),
        "repo_owner": repo.get("owner", {}).get("login"),
        "repo_name": repo.get("name"),
        "created_at": issue.get("created_at"),
        "closed_at": issue.get("closed_at"),
    }


def parse_push_event(payload: dict[str, Any]) -> dict[str, Any]:
    """Extract relevant fields from a push webhook event."""
    repo = payload.get("repository", {})
    return {
        "ref": payload.get("ref"),
        "before_sha": payload.get("before"),
        "after_sha": payload.get("after"),
        "pusher_login": payload.get("pusher", {}).get("name"),
        "commits_count": len(payload.get("commits", [])),
        "repo_full_name": repo.get("full_name"),
        "repo_id": repo.get("id"),
        "repo_owner": repo.get("owner", {}).get("login"),
        "repo_name": repo.get("name"),
    }

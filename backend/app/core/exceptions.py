"""
Custom exception classes for DevInsight.

Centralizing exceptions here allows the global exception handler
in main.py to convert them to consistent JSON error responses,
regardless of where in the codebase they are raised.
"""
from fastapi import HTTPException, status


class DevInsightException(Exception):
    """Base exception for all DevInsight application errors."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


# ─── Authentication & Authorization ───────────────────────────────────────────

class AuthenticationError(DevInsightException):
    """Raised when a request cannot be authenticated (missing/invalid token)."""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class PermissionDeniedError(DevInsightException):
    """Raised when a user lacks permission to perform an action."""

    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


# ─── Resource Not Found ───────────────────────────────────────────────────────

class NotFoundError(DevInsightException):
    """Raised when a requested resource does not exist."""

    def __init__(self, resource: str = "Resource", resource_id: str | int | None = None):
        if resource_id is not None:
            message = f"{resource} with id '{resource_id}' not found"
        else:
            message = f"{resource} not found"
        super().__init__(message, status.HTTP_404_NOT_FOUND)


# ─── Validation & Conflict ────────────────────────────────────────────────────

class ValidationError(DevInsightException):
    """Raised when business-level validation fails (beyond Pydantic schema)."""

    def __init__(self, message: str):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


class ConflictError(DevInsightException):
    """Raised when a resource already exists and cannot be duplicated."""

    def __init__(self, message: str):
        super().__init__(message, status.HTTP_409_CONFLICT)


# ─── External Service Errors ──────────────────────────────────────────────────

class GitHubAPIError(DevInsightException):
    """Raised when the GitHub API returns an unexpected error or rate limit."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(f"GitHub API error: {message}", status_code)


class GitHubRateLimitError(GitHubAPIError):
    """Raised when GitHub API rate limit is exhausted."""

    def __init__(self):
        super().__init__("GitHub API rate limit exhausted. Retry after the reset window.", 429)


class GeminiAPIError(DevInsightException):
    """Raised when the Gemini API call fails."""

    def __init__(self, message: str):
        super().__init__(f"AI service error: {message}", 502)


# ─── Agent Errors ─────────────────────────────────────────────────────────────

class AgentTimeoutError(DevInsightException):
    """Raised when an AI agent exceeds its configured timeout."""

    def __init__(self, agent_name: str):
        super().__init__(f"Agent '{agent_name}' timed out", 504)


class AgentError(DevInsightException):
    """Generic error from an AI agent execution."""

    def __init__(self, agent_name: str, message: str):
        super().__init__(f"Agent '{agent_name}' error: {message}", 500)


# ─── Webhook ──────────────────────────────────────────────────────────────────

class WebhookSignatureError(DevInsightException):
    """Raised when a GitHub webhook HMAC signature is invalid."""

    def __init__(self):
        super().__init__("Invalid webhook signature", status.HTTP_401_UNAUTHORIZED)

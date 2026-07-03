"""
Models package — imports all models so Alembic can auto-detect them.

IMPORTANT: All model modules MUST be imported here.
Alembic's env.py imports from this module to discover all tables.
If a model is not imported here, Alembic will not generate migrations for it.
"""
from app.database.base import Base  # noqa: F401

# Import all models in dependency order
from app.models.user import User, UserSession  # noqa: F401
from app.models.workspace import Workspace, WorkspaceMember  # noqa: F401
from app.models.repository import Repository, RepositoryHealth  # noqa: F401
from app.models.pull_request import PullRequest, PullRequestFinding  # noqa: F401
from app.models.bug import Bug, BugRootCause  # noqa: F401
from app.models.agent import AgentRun, AgentLog  # noqa: F401
from app.models.knowledge import KnowledgeDocument, KnowledgeChunk  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.analytics import AnalyticsSnapshot, DeveloperMetric  # noqa: F401

__all__ = [
    "Base",
    "User", "UserSession",
    "Workspace", "WorkspaceMember",
    "Repository", "RepositoryHealth",
    "PullRequest", "PullRequestFinding",
    "Bug", "BugRootCause",
    "AgentRun", "AgentLog",
    "KnowledgeDocument", "KnowledgeChunk",
    "Notification",
    "AnalyticsSnapshot", "DeveloperMetric",
]

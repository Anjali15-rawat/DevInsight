"""
DevInsight Backend — FastAPI Application Entry Point

This module:
  1. Creates the FastAPI app instance
  2. Registers middleware (request ID, CORS)
  3. Registers global exception handlers
  4. Mounts all API routers
  5. Defines startup/shutdown lifecycle events
"""
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import DevInsightException
from app.core.logging import configure_logging
from app.core.middleware import RequestIDMiddleware

# Configure structured logging before anything else
configure_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan — startup and shutdown events.
    """
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info(
        "devinsight_starting",
        env=settings.APP_ENV,
        debug=settings.DEBUG,
    )

    # Validate database connection on startup
    from app.database.session import engine
    from sqlalchemy import text
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("database_connection_validated")
    except Exception as e:
        logger.critical("database_connection_failed", error=str(e))
        raise RuntimeError(f"Database connection check failed: {str(e)}") from e

    # Seed default workspace and user in development/local
    if settings.APP_ENV == "development":
        from app.database.session import AsyncSessionLocal
        from app.models.user import User
        from app.models.workspace import Workspace, WorkspaceMember
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            try:
                # 1. Ensure default User exists
                user_stmt = select(User).where(User.id == 1)
                user_result = await db.execute(user_stmt)
                user = user_result.scalar_one_or_none()

                if not user:
                    user = User(
                        id=1,
                        github_id=123456,
                        github_login="dev-user",
                        name="Dev User",
                        email="dev@devinsight.io",
                        github_access_token="dev-mock-token"
                    )
                    db.add(user)
                    await db.commit()
                    await db.refresh(user)
                    logger.info("seeded_default_user")

                # 2. Ensure default Workspace exists
                ws_stmt = select(Workspace).where(Workspace.id == 1)
                ws_result = await db.execute(ws_stmt)
                ws = ws_result.scalar_one_or_none()

                if not ws:
                    ws = Workspace(
                        id=1,
                        name="Default Workspace",
                        slug="default",
                        plan="Free"
                    )
                    db.add(ws)
                    await db.commit()
                    await db.refresh(ws)
                    logger.info("seeded_default_workspace")

                # 3. Ensure membership mapping exists
                member_stmt = select(WorkspaceMember).where(
                    WorkspaceMember.workspace_id == 1,
                    WorkspaceMember.user_id == 1
                )
                member_result = await db.execute(member_stmt)
                membership = member_result.scalar_one_or_none()

                if not membership:
                    membership = WorkspaceMember(
                        workspace_id=1,
                        user_id=1,
                        role="Owner"
                    )
                    db.add(membership)
                    await db.commit()
                    logger.info("seeded_default_workspace_membership")
            except Exception as e:
                logger.error("startup_seeding_failed", error=str(e))

    # Pre-load the FAISS index from disk (if it exists)
    from app.rag.indexer import faiss_manager
    logger.info("faiss_index_ready", total_vectors=faiss_manager.total_vectors)

    # Pre-warm the embedding model (downloads on first run)
    if settings.APP_ENV != "test":
        try:
            from app.rag.embedder import _get_model
            _get_model()
        except Exception as e:
            logger.warning("embedding_model_preload_failed", error=str(e))

    logger.info("devinsight_ready", frontend_url=settings.FRONTEND_URL)

    yield  # Application runs here

    # ── Shutdown ──────────────────────────────────────────────────────────────
    logger.info("devinsight_shutting_down")
    from app.database.session import engine
    await engine.dispose()


# ─── Create FastAPI App ────────────────────────────────────────────────────────
app = FastAPI(
    title="DevInsight API",
    description="AI-powered Engineering Intelligence Platform — Backend API",
    version="1.0.0",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    lifespan=lifespan,
)


# ─── Middleware ────────────────────────────────────────────────────────────────

# Request ID injection (must be added before CORS)
app.add_middleware(RequestIDMiddleware)

# CORS — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


# ─── Global Exception Handlers ────────────────────────────────────────────────

@app.exception_handler(DevInsightException)
async def devinsight_exception_handler(request: Request, exc: DevInsightException) -> JSONResponse:
    """
    Convert all custom DevInsightExceptions into consistent JSON error responses.
    The frontend can rely on this shape for all error states.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": type(exc).__name__,
            "message": exc.message,
            "request_id": request.headers.get("X-Request-ID"),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler for unexpected exceptions — prevents stack trace leaking."""
    logger.error("unhandled_exception", error=str(exc), path=request.url.path, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred. Our team has been notified.",
            "request_id": request.headers.get("X-Request-ID"),
        },
    )


# ─── Routes ───────────────────────────────────────────────────────────────────

# Health check — required by Render deployment health checks
@app.get("/health", tags=["System"])
async def health_check(db: Depends = Depends(lambda: None)):
    """
    Comprehensive operational health check endpoint.
    Verifies database, Redis, GitHub API connectivity, Gemini model configuration,
    and FAISS vector index status.
    """
    import httpx
    from sqlalchemy import text
    from redis.asyncio import Redis
    from app.rag.indexer import faiss_manager
    from app.database.session import AsyncSessionLocal

    db_status = "healthy"
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    redis_status = "healthy"
    try:
        redis_client = Redis.from_url(settings.REDIS_URL, socket_timeout=2.0)
        await redis_client.ping()
        await redis_client.close()
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"

    github_status = "healthy"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get("https://api.github.com")
            if res.status_code != 200:
                github_status = f"unhealthy: status {res.status_code}"
    except Exception as e:
        github_status = f"unhealthy: {str(e)}"

    gemini_status = "healthy" if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your_") else "unconfigured"

    vector_status = "healthy"
    try:
        vector_count = faiss_manager.total_vectors
        vector_status = f"healthy ({vector_count} vectors)"
    except Exception as e:
        vector_status = f"unhealthy: {str(e)}"

    overall_status = "healthy"
    # Note: gemini_status=unconfigured does not make overall unhealthy (is optional fallback for mock),
    # but database, redis, github are critical dependencies.
    if settings.APP_ENV != "test":
        if any("unhealthy" in status for status in [db_status, redis_status, github_status]):
            overall_status = "unhealthy"

    return {
        "status": overall_status,
        "env": settings.APP_ENV,
        "version": "1.0.0",
        "services": {
            "database": db_status,
            "redis": redis_status,
            "github_api": github_status,
            "gemini_ai": gemini_status,
            "vector_index": vector_status,
        }
    }


# Mount all API routes
app.include_router(api_router)


# WebSocket endpoint for real-time notifications
from fastapi import WebSocket, WebSocketDisconnect
import json

connected_clients: dict[int, list[WebSocket]] = {}  # user_id -> [websockets]


@app.websocket("/ws/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: int):
    """
    WebSocket endpoint for real-time notification delivery.

    The frontend connects once the user is authenticated:
    const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);

    The server pushes notification JSON objects as they are created.
    """
    await websocket.accept()

    if user_id not in connected_clients:
        connected_clients[user_id] = []
    connected_clients[user_id].append(websocket)

    logger.info("websocket_connected", user_id=user_id)

    try:
        while True:
            # Keep alive — wait for client ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        connected_clients[user_id].remove(websocket)
        if not connected_clients[user_id]:
            del connected_clients[user_id]
        logger.info("websocket_disconnected", user_id=user_id)

"""
Main API v1 router — aggregates all sub-routers.
"""
from fastapi import APIRouter

from app.api.v1 import auth, repositories, pull_requests, bugs, analytics, notifications, knowledge, webhooks, intelligence, bff

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(repositories.router)
api_router.include_router(pull_requests.router)
api_router.include_router(bugs.router)
api_router.include_router(analytics.router)
api_router.include_router(notifications.router)
api_router.include_router(knowledge.router)
api_router.include_router(webhooks.router)
api_router.include_router(intelligence.router)
api_router.include_router(bff.router)

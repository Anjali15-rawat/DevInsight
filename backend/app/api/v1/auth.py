"""
Auth API endpoints — GitHub OAuth flow.
"""
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import RedirectResponse

import httpx
import structlog

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, verify_token, encrypt_token
from app.database.session import get_db
from app.schemas.auth import AuthStatusResponse, RefreshTokenRequest, TokenResponse
from app.api.deps import CurrentUser, DB

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


@router.get("/github", summary="Initiate GitHub OAuth login")
async def github_login():
    """
    Redirects the user to GitHub's OAuth authorization page.
    After authorization, GitHub redirects back to /auth/callback.
    """
    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": settings.GITHUB_REDIRECT_URI,
        "scope": "read:user user:email repo",
        "state": "devinsight_oauth",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=f"{GITHUB_OAUTH_URL}?{query}")


@router.get("/callback", summary="GitHub OAuth callback")
async def github_callback(
    code: str = Query(...),
    state: str = Query(None),
    db: DB = None,
):
    """
    GitHub redirects here after user authorization.
    Exchanges the code for a GitHub access token, fetches user profile,
    creates/updates the User record, and returns JWT tokens.
    """
    # ── Exchange code for GitHub access token ─────────────────────────────────
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GITHUB_TOKEN_URL,
            json={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_response.json()

    github_access_token = token_data.get("access_token")
    if not github_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub did not return an access token. The code may have expired.",
        )

    # ── Fetch GitHub user profile ──────────────────────────────────────────────
    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            GITHUB_USER_URL,
            headers={
                "Authorization": f"Bearer {github_access_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        github_user = user_response.json()

    if "id" not in github_user:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch GitHub user profile",
        )

    # ── Upsert User record ────────────────────────────────────────────────────
    from sqlalchemy import select
    from app.models.user import User
    from datetime import UTC, datetime

    stmt = select(User).where(User.github_id == github_user["id"])
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(github_id=github_user["id"])
        db.add(user)

    user.github_login = github_user.get("login", "")
    user.github_access_token = encrypt_token(github_access_token)
    user.name = github_user.get("name")
    user.email = github_user.get("email")
    user.avatar_url = github_user.get("avatar_url")
    user.bio = github_user.get("bio")
    user.last_active_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(user)

    logger.info("user_authenticated", github_login=user.github_login, user_id=user.id)

    # ── Issue JWT tokens ───────────────────────────────────────────────────────
    access_token = create_access_token(user.id, extra={"github_login": user.github_login})
    refresh_token = create_refresh_token(user.id)

    redirect_url = f"{settings.FRONTEND_URL}/login?access_token={access_token}&refresh_token={refresh_token}"
    return RedirectResponse(url=redirect_url)


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh_token(body: RefreshTokenRequest):
    """Exchange a valid refresh token for a new access token."""
    user_id = verify_token(body.refresh_token, token_type="refresh")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    access_token = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=AuthStatusResponse, summary="Check auth status")
async def auth_status(current_user: CurrentUser):
    """Quick auth check — returns authenticated status and user info."""
    return AuthStatusResponse(
        authenticated=True,
        user_id=current_user.id,
        github_login=current_user.github_login,
        name=current_user.name,
        email=current_user.email,
        avatar_url=current_user.avatar_url,
    )


@router.get("/dev-bypass", summary="Bypass authentication in development mode")
async def dev_bypass(db: DB):
    """
    Directly logs in as the default seeded developer user.
    Only available in development mode (APP_ENV = development).
    """
    if settings.APP_ENV != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Development bypass is only available in development environment.",
        )

    from app.models.user import User
    from sqlalchemy import select
    from datetime import UTC, datetime

    stmt = select(User).where(User.id == 1)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=1,
            github_id=123456,
            github_login="dev-user",
            name="Dev User",
            email="dev@devinsight.io",
            github_access_token="dev-mock-token",
            last_active_at=datetime.now(UTC),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        user.last_active_at = datetime.now(UTC)
        await db.commit()

    access_token = create_access_token(user.id, extra={"github_login": user.github_login})
    refresh_token = create_refresh_token(user.id)

    redirect_url = f"{settings.FRONTEND_URL}/login?access_token={access_token}&refresh_token={refresh_token}"
    return RedirectResponse(url=redirect_url)


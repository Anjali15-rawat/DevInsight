"""
Security utilities: JWT creation/verification and password hashing.
"""
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# bcrypt password hashing context (used for webhook secrets etc.)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── JWT Tokens ───────────────────────────────────────────────────────────────

def create_access_token(subject: str | int, extra: dict[str, Any] | None = None) -> str:
    """
    Create a signed JWT access token.

    Args:
        subject: The user's ID (stored as `sub` claim).
        extra: Optional additional claims to embed in the token.

    Returns:
        Signed JWT string.
    """
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
        "type": "access",
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str | int) -> str:
    """
    Create a longer-lived refresh token for token renewal.
    """
    now = datetime.now(UTC)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and verify a JWT token.

    Raises:
        JWTError: If the token is invalid, expired, or tampered with.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def verify_token(token: str, token_type: str = "access") -> str | None:
    """
    Verify a JWT token and return the subject (user ID), or None if invalid.
    """
    try:
        payload = decode_token(token)
        if payload.get("type") != token_type:
            return None
        return payload.get("sub")
    except JWTError:
        return None


# ─── Password Hashing ─────────────────────────────────────────────────────────

def hash_secret(secret: str) -> str:
    """Hash a secret (e.g., webhook secret) using bcrypt."""
    return pwd_context.hash(secret)


def verify_secret(plain: str, hashed: str) -> bool:
    """Verify a plain secret against its bcrypt hash."""
    return pwd_context.verify(plain, hashed)


def encrypt_token(plain_token: str | None) -> str | None:
    """Encrypt a sensitive token (e.g., GitHub Access Token) using Fernet."""
    if not plain_token:
        return None
    import base64
    import hashlib
    from cryptography.fernet import Fernet
    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    f = Fernet(fernet_key)
    return f.encrypt(plain_token.encode()).decode()


def decrypt_token(encrypted_token: str | None) -> str | None:
    """Decrypt a sensitive token using Fernet, falling back to original if unencrypted."""
    if not encrypted_token:
        return None
    import base64
    import hashlib
    from cryptography.fernet import Fernet
    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    f = Fernet(fernet_key)
    try:
        return f.decrypt(encrypted_token.encode()).decode()
    except Exception:
        # Fallback for raw developer tokens seeded in dev app environments
        return encrypted_token

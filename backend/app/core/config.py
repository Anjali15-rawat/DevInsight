"""
Core configuration via Pydantic Settings.

All environment variables are typed and validated here.
A missing required variable raises a clear error at startup,
not silently at runtime.
"""
from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Application ──────────────────────────────────────────────────────────
    APP_ENV: Literal["development", "production", "test"] = "development"
    DEBUG: bool = False
    SECRET_KEY: str
    FRONTEND_URL: str = "http://localhost:5173"

    # ─── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str

    # ─── Redis ────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ─── GitHub OAuth ─────────────────────────────────────────────────────────
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/callback"
    GITHUB_WEBHOOK_SECRET: str = "dev-webhook-secret"

    # ─── GitHub App (optional for production scale) ───────────────────────────
    GITHUB_APP_ID: str = ""
    GITHUB_APP_PRIVATE_KEY_PATH: str = "./github_app_private_key.pem"

    # ─── Gemini AI ────────────────────────────────────────────────────────────
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # ─── JWT ──────────────────────────────────────────────────────────────────
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ─── RAG / FAISS ──────────────────────────────────────────────────────────
    FAISS_INDEX_PATH: str = "./faiss_index/devinsight.index"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    RAG_TOP_K: int = 5
    CHUNK_SIZE: int = 400
    CHUNK_OVERLAP: int = 50

    # ─── Supabase Storage (optional) ─────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET: str = "devinsight-knowledge"

    # ─── AI Agent ─────────────────────────────────────────────────────────────
    AGENT_MAX_DIFF_TOKENS: int = 50_000
    AGENT_TIMEOUT_SECONDS: int = 120

    # ─── Rate Limiting ────────────────────────────────────────────────────────
    GITHUB_API_RATE_LIMIT: int = 5000

    # ─── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str) -> str:
        return v

    def get_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @model_validator(mode="after")
    def validate_secrets(self) -> "Settings":
        if self.is_production and len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters in production.")
        return self


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings singleton.
    Use this everywhere instead of instantiating Settings() directly.
    """
    return Settings()


# Convenience alias for imports
settings = get_settings()

"""
Authenticated async GitHub API client.

Uses httpx for non-blocking HTTP requests. Handles:
  - Personal access token authentication (development)
  - GitHub App installation token authentication (production)
  - Automatic retry with exponential backoff on rate limit (429)
  - Logging of every outbound request
"""
import asyncio
from typing import Any

import httpx
import structlog

from app.core.config import settings
from app.core.exceptions import GitHubAPIError, GitHubRateLimitError

logger = structlog.get_logger(__name__)

GITHUB_API_BASE = "https://api.github.com"
GITHUB_ACCEPT_HEADER = "application/vnd.github+json"
GITHUB_API_VERSION = "2022-11-28"


class GitHubClient:
    """
    Async GitHub REST API client.

    Pass a GitHub token to authenticate. In development, use a personal
    access token (PAT). In production, use a GitHub App installation token.
    """

    def __init__(self, token: str):
        self._token = token
        self._client = httpx.AsyncClient(
            base_url=GITHUB_API_BASE,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": GITHUB_ACCEPT_HEADER,
                "X-GitHub-Api-Version": GITHUB_API_VERSION,
            },
            timeout=30.0,
        )

    async def _request(
        self,
        method: str,
        path: str,
        retries: int = 3,
        **kwargs: Any,
    ) -> dict[str, Any] | list[Any]:
        """
        Make an authenticated GitHub API request.
        Retries on rate limit with exponential backoff.
        """
        for attempt in range(retries):
            try:
                response = await self._client.request(method, path, **kwargs)
                logger.debug(
                    "github_api_request",
                    method=method,
                    path=path,
                    status=response.status_code,
                )

                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 60))
                    if attempt < retries - 1:
                        logger.warning("github_rate_limited", retry_after=retry_after)
                        await asyncio.sleep(retry_after)
                        continue
                    raise GitHubRateLimitError()

                if response.status_code == 404:
                    raise GitHubAPIError(f"Resource not found: {path}", 404)

                if response.status_code >= 400:
                    body = response.text
                    raise GitHubAPIError(
                        f"HTTP {response.status_code} from {path}: {body[:200]}",
                        response.status_code,
                    )

                return response.json()

            except httpx.TimeoutException as e:
                if attempt < retries - 1:
                    wait = 2 ** attempt
                    logger.warning("github_request_timeout", attempt=attempt, wait=wait)
                    await asyncio.sleep(wait)
                else:
                    raise GitHubAPIError(f"Request timed out: {path}") from e

        raise GitHubAPIError(f"Max retries exceeded for: {path}")

    async def get(self, path: str, **kwargs: Any) -> dict | list:
        return await self._request("GET", path, **kwargs)

    async def post(self, path: str, **kwargs: Any) -> dict | list:
        return await self._request("POST", path, **kwargs)

    async def patch(self, path: str, **kwargs: Any) -> dict | list:
        return await self._request("PATCH", path, **kwargs)

    async def delete(self, path: str, **kwargs: Any) -> None:
        await self._request("DELETE", path, **kwargs)

    async def close(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> "GitHubClient":
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()

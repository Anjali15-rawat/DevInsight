"""
Intelligence Cache — manages cache storage (Redis / In-memory fallback) and lazy evaluation for computed metrics.
"""
import json
import time
from typing import Any, Callable, Coroutine
import structlog
from redis.asyncio import Redis

from app.core.config import settings

logger = structlog.get_logger(__name__)

# Fallback in-memory cache storage
# Structure: {key: (value_json, expire_timestamp)}
_in_memory_cache: dict[str, tuple[str, float]] = {}


class IntelligenceCache:
    def __init__(self):
        self._redis_client: Redis | None = None
        self._initialized = False

    async def _init_redis(self):
        if self._initialized:
            return
        if settings.APP_ENV != "test" and settings.REDIS_URL:
            try:
                self._redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
                # Test connection
                await self._redis_client.ping()
                logger.info("redis_cache_connected", url=settings.REDIS_URL)
            except Exception as e:
                logger.warning("redis_cache_connection_failed", error=str(e), fallback="in_memory")
                self._redis_client = None
        self._initialized = True

    async def get(self, key: str) -> dict | None:
        """
        Retrieves a value from the cache. Returns None on cache miss.
        """
        await self._init_redis()

        if self._redis_client:
            try:
                data = await self._redis_client.get(key)
                if data:
                    return json.loads(data)
            except Exception as e:
                logger.warning("redis_cache_get_failed", error=str(e))
        else:
            # In-memory lookup
            item = _in_memory_cache.get(key)
            if item:
                val_json, expire_at = item
                if time.time() < expire_at:
                    return json.loads(val_json)
                else:
                    # Evict expired key
                    _in_memory_cache.pop(key, None)

        return None

    async def set(self, key: str, value: dict, ttl_seconds: int = 300) -> None:
        """
        Saves a dictionary value in the cache with a specified TTL.
        """
        await self._init_redis()
        val_json = json.dumps(value)

        if self._redis_client:
            try:
                await self._redis_client.set(key, val_json, ex=ttl_seconds)
            except Exception as e:
                logger.warning("redis_cache_set_failed", error=str(e))
        else:
            # In-memory write
            expire_at = time.time() + ttl_seconds
            _in_memory_cache[key] = (val_json, expire_at)

    async def delete(self, key: str) -> None:
        """
        Removes a key from the cache.
        """
        await self._init_redis()

        if self._redis_client:
            try:
                await self._redis_client.delete(key)
            except Exception as e:
                logger.warning("redis_cache_delete_failed", error=str(e))
        else:
            _in_memory_cache.pop(key, None)

    async def clear_all(self) -> None:
        """
        Clears all keys in the cache (useful for tests).
        """
        await self._init_redis()
        if self._redis_client:
            try:
                await self._redis_client.flushdb()
            except Exception as e:
                logger.warning("redis_cache_flush_failed", error=str(e))
        else:
            _in_memory_cache.clear()

    async def get_or_calculate(
        self,
        key: str,
        calculate_func: Callable[[], Coroutine[Any, Any, dict]],
        ttl_seconds: int = 300,
        bypass_cache: bool = False,
    ) -> dict:
        """
        Implements lazy evaluation. Checks cache first.
        If cache missed (or bypass_cache=True), evaluates the function and stores result in cache.
        """
        if not bypass_cache:
            cached_val = await self.get(key)
            if cached_val is not None:
                logger.debug("cache_hit", key=key)
                return cached_val

        logger.debug("cache_miss_or_bypass", key=key)
        # Calculate new value
        result = await calculate_func()
        # Save to cache
        await self.set(key, result, ttl_seconds)
        return result


# Global singleton instance
intelligence_cache = IntelligenceCache()

"""
RAG Cache — In-memory caching layer for embeddings and retrieval results.

Designed for easy migration to Redis. The interface uses string keys and
serializable values, so swapping the backend to Redis requires only
replacing the _store dict with a Redis client.

Caches:
  - Query embeddings (avoid re-embedding the same query)
  - Retrieval results (avoid re-searching FAISS for repeated queries)
"""
import hashlib
import threading
import time
from typing import Any

import structlog

logger = structlog.get_logger(__name__)

# Default TTL: 15 minutes for embeddings, 5 minutes for search results
DEFAULT_EMBEDDING_TTL = 900
DEFAULT_SEARCH_TTL = 300


class RAGCache:
    """
    Simple in-memory TTL cache with thread-safe lock protection.
    Keys are hashed query strings; values are cached results with expiry timestamps.
    """

    def __init__(self):
        self._store: dict[str, dict[str, Any]] = {}
        self._lock = threading.Lock()

    @staticmethod
    def _hash_key(prefix: str, value: str) -> str:
        """Create a deterministic cache key from a prefix and value."""
        content_hash = hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]
        return f"{prefix}:{content_hash}"

    def get(self, key: str) -> Any | None:
        """Retrieve a cached value if it exists and hasn't expired."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            if time.time() > entry["expires_at"]:
                # Expired — clean up lazily
                self._store.pop(key, None)
                return None
            return entry["value"]

    def set(self, key: str, value: Any, ttl: int = DEFAULT_SEARCH_TTL) -> None:
        """Store a value with a TTL (in seconds)."""
        with self._lock:
            self._store[key] = {
                "value": value,
                "expires_at": time.time() + ttl,
            }

    def invalidate(self, key: str) -> None:
        """Remove a specific cache entry."""
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        """Flush the entire cache."""
        with self._lock:
            self._store.clear()
        logger.info("rag_cache_cleared")

    def get_embedding(self, query: str) -> Any | None:
        """Get a cached query embedding."""
        key = self._hash_key("emb", query)
        return self.get(key)

    def set_embedding(self, query: str, embedding: Any) -> None:
        """Cache a query embedding."""
        key = self._hash_key("emb", query)
        self.set(key, embedding, ttl=DEFAULT_EMBEDDING_TTL)

    def get_search_results(self, query: str, workspace_id: int) -> Any | None:
        """Get cached search results for a query+workspace combo."""
        key = self._hash_key("search", f"{workspace_id}:{query}")
        return self.get(key)

    def set_search_results(self, query: str, workspace_id: int, results: Any) -> None:
        """Cache search results for a query+workspace combo."""
        key = self._hash_key("search", f"{workspace_id}:{query}")
        self.set(key, results, ttl=DEFAULT_SEARCH_TTL)


# Module-level singleton
rag_cache = RAGCache()

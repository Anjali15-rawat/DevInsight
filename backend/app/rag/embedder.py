"""
Embedder — generates vector embeddings for text chunks.

Abstracts the embedding provider to support:
  1. Local SentenceTransformers (all-MiniLM-L6-v2) - Free, local, fast.
  2. Google Gemini Embeddings (text-embedding-004) - Cloud, higher semantic accuracy.
"""
import asyncio
from abc import ABC, abstractmethod
from functools import lru_cache

import numpy as np
import structlog
import google.generativeai as genai
from sentence_transformers import SentenceTransformer

from app.core.config import settings

logger = structlog.get_logger(__name__)

# Configure Gemini once
genai.configure(api_key=settings.GEMINI_API_KEY)


class BaseEmbedder(ABC):
    """Abstract interface for Embedding models."""

    @property
    @abstractmethod
    def dimension(self) -> int:
        ...

    @abstractmethod
    def embed_texts(self, texts: list[str]) -> np.ndarray:
        ...

    async def embed_texts_async(self, texts: list[str]) -> np.ndarray:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self.embed_texts, texts)

    async def embed_query_async(self, query: str) -> np.ndarray:
        return await self.embed_texts_async([query])


class MiniLMEmbedder(BaseEmbedder):
    """Local SentenceTransformer Embedder (384 dimensions)."""
    
    def __init__(self):
        self._model = self._load_model()

    @property
    def dimension(self) -> int:
        return 384

    @staticmethod
    @lru_cache(maxsize=1)
    def _load_model() -> SentenceTransformer:
        logger.info("embedding_model_loading", model="all-MiniLM-L6-v2")
        return SentenceTransformer("all-MiniLM-L6-v2")

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        embeddings = self._model.encode(
            texts,
            batch_size=32,
            show_progress_bar=False,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        return embeddings.astype(np.float32)


class GeminiEmbedder(BaseEmbedder):
    """Google Gemini Embedder (768 dimensions by default for text-embedding-004)."""
    
    def __init__(self, model_name: str = "models/text-embedding-004"):
        self.model_name = model_name

    @property
    def dimension(self) -> int:
        return 768

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        # Gemini API supports batching
        result = genai.embed_content(
            model=self.model_name,
            content=texts,
            task_type="retrieval_document"
        )
        # Ensure L2 normalization for cosine similarity
        embeddings = np.array(result['embedding'], dtype=np.float32)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        # Prevent division by zero
        norms = np.where(norms == 0, 1e-10, norms)
        return embeddings / norms


def get_embedder() -> BaseEmbedder:
    """Factory to get the configured embedder."""
    # In reality this would be driven by settings (e.g. settings.EMBEDDING_PROVIDER)
    # Defaulting to Gemini for Phase 5 if available, else fallback to local.
    if settings.GEMINI_API_KEY:
        return GeminiEmbedder()
    return MiniLMEmbedder()

# Singleton instance
embedder = get_embedder()

# Legacy wrappers to maintain backward compatibility during migration
async def embed_texts_async(texts: list[str]) -> np.ndarray:
    return await embedder.embed_texts_async(texts)

async def embed_query_async(query: str) -> np.ndarray:
    return await embedder.embed_query_async(query)

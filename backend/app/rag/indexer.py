"""
FAISS Index manager (Enterprise RAG).

Handles:
  - Building the FAISS index from embeddings using IndexIDMap for deletion support.
  - Persisting the index to disk
  - Loading the index at startup
  - Adding new vectors incrementally
  - Deleting vectors by ID
  - Nearest-neighbor search
"""
import os
import threading
from pathlib import Path

import faiss
import numpy as np
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)

# Thread lock for safe concurrent writes to the FAISS index
_index_lock = threading.Lock()


class FAISSIndexManager:
    """
    Manages a single FAISS index for the entire workspace knowledge base.
    Uses IndexIDMap to support ID-based document deletion.
    """

    EMBEDDING_DIM = 384  # Default dimension, overridden by provider

    def __init__(self, index_path: str | None = None):
        self.index_path = Path(index_path or settings.FAISS_INDEX_PATH)
        self._index: faiss.IndexIDMap | None = None

    def _ensure_dir(self) -> None:
        self.index_path.parent.mkdir(parents=True, exist_ok=True)

    @property
    def index(self) -> faiss.IndexIDMap:
        if self._index is None:
            self._index = self._load_or_create()
        return self._index

    def _load_or_create(self) -> faiss.IndexIDMap:
        from app.rag.embedder import embedder
        self.EMBEDDING_DIM = embedder.dimension
        if self.index_path.exists():
            logger.info("faiss_index_loading", path=str(self.index_path))
            try:
                idx = faiss.read_index(str(self.index_path))
                logger.info("faiss_index_loaded", total_vectors=idx.ntotal)
                return idx
            except Exception as e:
                logger.error("faiss_index_load_failed_creating_new", error=str(e))
                flat_index = faiss.IndexFlatIP(self.EMBEDDING_DIM)
                return faiss.IndexIDMap(flat_index)
        else:
            logger.info("faiss_index_creating_new", dim=self.EMBEDDING_DIM)
            flat_index = faiss.IndexFlatIP(self.EMBEDDING_DIM)
            return faiss.IndexIDMap(flat_index)

    def add_embeddings(self, embeddings: np.ndarray, faiss_ids: np.ndarray) -> None:
        """
        Add embeddings to the FAISS index with specific IDs.

        Args:
            embeddings: float32 array of shape (N, dim)
            faiss_ids: int64 array of shape (N,) containing unique chunk IDs.
        """
        if len(embeddings) != len(faiss_ids):
            raise ValueError("Embeddings and faiss_ids must have the same length.")
            
        with _index_lock:
            self.index.add_with_ids(embeddings.astype(np.float32), faiss_ids.astype(np.int64))
            self._persist()

    def remove_ids(self, faiss_ids: list[int]) -> int:
        """
        Remove specific chunks from the index by their FAISS ID.
        Returns the number of vectors successfully removed.
        """
        if not faiss_ids:
            return 0
            
        with _index_lock:
            # FAISS remove_ids expects an IDSelector
            selector = faiss.IDSelectorBatch(faiss_ids)
            removed_count = self.index.remove_ids(selector)
            if removed_count > 0:
                self._persist()
                logger.info("faiss_vectors_removed", removed_count=removed_count)
            return removed_count

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> list[dict]:
        """
        Find the top-K nearest chunks to the query embedding.
        """
        if self.index.ntotal == 0:
            return []

        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(query_embedding.astype(np.float32), k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0:
                results.append({"faiss_id": int(idx), "score": float(score)})
        return results

    def _persist(self) -> None:
        try:
            self._ensure_dir()
            faiss.write_index(self.index, str(self.index_path))
        except Exception as e:
            logger.error("faiss_index_persist_failed", error=str(e))

    def reset(self) -> None:
        with _index_lock:
            flat_index = faiss.IndexFlatIP(self.EMBEDDING_DIM)
            self._index = faiss.IndexIDMap(flat_index)
            self._persist()
            logger.warning("faiss_index_reset")

    @property
    def total_vectors(self) -> int:
        return self.index.ntotal

faiss_manager = FAISSIndexManager()

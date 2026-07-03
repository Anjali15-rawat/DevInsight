"""
RAG Retriever — finds the most relevant knowledge chunks for a query.

Process:
  1. Check the query cache for a cached result
  2. Embed the query using the configured embedding provider
  3. Search FAISS for top-K nearest chunks
  4. Apply similarity threshold filtering
  5. Fetch chunk content from PostgreSQL (with workspace-scoped tenant isolation)
  6. Remove duplicate chunks
  7. Return chunks sorted by relevance score

The retrieved chunks are then passed to AI agents as additional prompt context.
"""
from typing import Any

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge import KnowledgeChunk, KnowledgeDocument
from app.rag.embedder import embed_query_async
from app.rag.indexer import faiss_manager
from app.rag.cache import rag_cache
from app.core.config import settings

logger = structlog.get_logger(__name__)

# Default similarity threshold — chunks below this score are discarded
DEFAULT_SIMILARITY_THRESHOLD = 0.35


async def retrieve_relevant_chunks(
    db: AsyncSession,
    query: str,
    workspace_id: int,
    top_k: int | None = None,
    similarity_threshold: float = DEFAULT_SIMILARITY_THRESHOLD,
    category_filter: str | None = None,
) -> list[dict[str, Any]]:
    """
    Retrieve the most relevant knowledge base chunks for a given query.

    Args:
        db: Database session
        query: The search query (free text)
        workspace_id: Scopes retrieval to this workspace's documents (tenant isolation)
        top_k: Number of chunks to retrieve (defaults to settings.RAG_TOP_K)
        similarity_threshold: Minimum relevance score to include a chunk
        category_filter: Optional file_type filter (e.g., 'md', 'py')

    Returns:
        List of chunk dicts sorted by relevance_score descending.
    """
    k = top_k or settings.RAG_TOP_K

    if faiss_manager.total_vectors == 0:
        logger.warning("faiss_index_empty_skip_retrieval")
        return []

    # Step 0: Check search cache
    cached = rag_cache.get_search_results(query, workspace_id)
    if cached is not None:
        logger.info("rag_cache_hit", query_len=len(query))
        return cached

    # Step 1: Embed the query (with embedding cache)
    cached_emb = rag_cache.get_embedding(query)
    if cached_emb is not None:
        query_embedding = cached_emb
    else:
        query_embedding = await embed_query_async(query)
        rag_cache.set_embedding(query, query_embedding)

    # Step 2: Search FAISS (over-fetch to compensate for filtering)
    faiss_results = faiss_manager.search(query_embedding, top_k=k * 3)
    if not faiss_results:
        return []

    # Step 3: Apply similarity threshold
    faiss_results = [r for r in faiss_results if r["score"] >= similarity_threshold]
    if not faiss_results:
        logger.info("rag_no_results_above_threshold", threshold=similarity_threshold)
        return []

    faiss_ids = [r["faiss_id"] for r in faiss_results]
    score_map = {r["faiss_id"]: r["score"] for r in faiss_results}

    # Step 4: Fetch chunk content from PostgreSQL with workspace scoping
    stmt = (
        select(KnowledgeChunk, KnowledgeDocument.name, KnowledgeDocument.file_type)
        .join(KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id)
        .where(
            KnowledgeChunk.faiss_index_id.in_(faiss_ids),
            KnowledgeDocument.workspace_id == workspace_id,
            KnowledgeDocument.status == "Indexed",
        )
    )

    # Optional category filter
    if category_filter:
        stmt = stmt.where(KnowledgeDocument.file_type == category_filter)

    rows = await db.execute(stmt)
    results_raw = rows.all()

    # Step 5: Build result dicts and deduplicate by content hash
    seen_content = set()
    chunks = []
    for chunk, doc_name, file_type in results_raw:
        # Deduplicate identical content from different index entries
        content_hash = hash(chunk.content[:200])
        if content_hash in seen_content:
            continue
        seen_content.add(content_hash)

        score = score_map.get(chunk.faiss_index_id, 0.0)
        chunks.append({
            "document_id": chunk.document_id,
            "document_name": doc_name,
            "file_type": file_type,
            "content": chunk.content,
            "chunk_index": chunk.chunk_index,
            "relevance_score": score,
        })

    # Step 6: Sort by relevance and limit to top_k
    chunks.sort(key=lambda x: x["relevance_score"], reverse=True)
    chunks = chunks[:k]

    # Cache the results for future identical queries
    rag_cache.set_search_results(query, workspace_id, chunks)

    logger.info(
        "rag_retrieval_complete",
        query_len=len(query),
        chunks_found=len(chunks),
        top_score=chunks[0]["relevance_score"] if chunks else 0.0,
    )
    return chunks


def format_chunks_for_prompt(chunks: list[dict[str, Any]]) -> str:
    """
    Format retrieved chunks as a readable context block for LLM injection.
    Includes source attribution for grounding.
    """
    if not chunks:
        return ""
    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(
            f"### Source {i}: {chunk['document_name']} "
            f"(relevance: {chunk['relevance_score']:.2f})\n"
            f"{chunk['content']}"
        )
    return "\n\n---\n\n".join(parts)

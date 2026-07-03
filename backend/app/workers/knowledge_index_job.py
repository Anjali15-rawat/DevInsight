"""
Knowledge indexing background job.

Triggered by: Document upload to /api/v1/knowledge/upload

Flow:
  1. Extract text from the uploaded file (PDF, Markdown, plain text, JSON)
  2. Chunk the text using the appropriate chunking strategy
  3. Generate embeddings for all chunks
  4. Add embeddings to the FAISS index
  5. Store KnowledgeChunk records in PostgreSQL with their FAISS IDs
  6. Update KnowledgeDocument status to "Indexed"
"""
import io
from datetime import UTC, datetime
from typing import Any

import structlog

from app.database.session import AsyncSessionLocal
from app.models.knowledge import KnowledgeChunk, KnowledgeDocument
from app.rag.chunker import chunk_document
from app.rag.embedder import embed_texts_async
from app.rag.indexer import faiss_manager

logger = structlog.get_logger(__name__)


async def run_knowledge_index_job(
    ctx: dict[str, Any],
    *,
    document_id: int,
    file_content: bytes,
    file_type: str,
) -> None:
    """
    ARQ job function to index a knowledge document.

    Args:
        ctx: ARQ context
        document_id: The KnowledgeDocument.id to process
        file_content: Raw file bytes
        file_type: File extension (pdf, markdown, json, text)
    """
    async with AsyncSessionLocal() as db:
        from sqlalchemy import func, select

        stmt = select(KnowledgeDocument).where(KnowledgeDocument.id == document_id)
        result = await db.execute(stmt)
        doc = result.scalar_one_or_none()

        if not doc:
            logger.error("knowledge_index_doc_not_found", document_id=document_id)
            return

        try:
            doc.status = "Indexing"
            await db.commit()

            # ── Step 1: Extract text ───────────────────────────────────────────
            text = _extract_text(file_content, file_type)
            logger.info("knowledge_text_extracted", doc_id=document_id, chars=len(text))

            # ── Step 2: Chunk the text ─────────────────────────────────────────
            chunks = chunk_document(text, file_type)
            logger.info("knowledge_chunked", doc_id=document_id, chunks=len(chunks))

            if not chunks:
                raise ValueError("Document produced no text chunks after extraction")

            # ── Step 3: Generate embeddings ────────────────────────────────────
            chunk_texts = [c.content for c in chunks]
            embeddings = await embed_texts_async(chunk_texts)

            # ── Step 4: Add to FAISS ───────────────────────────────────────────
            max_id_stmt = select(func.coalesce(func.max(KnowledgeChunk.faiss_index_id), 0))
            max_id_result = await db.execute(max_id_stmt)
            max_id = max_id_result.scalar() or 0

            import numpy as np
            faiss_ids = np.arange(max_id + 1, max_id + 1 + len(chunks), dtype=np.int64)
            faiss_manager.add_embeddings(embeddings, faiss_ids)

            # ── Step 5: Persist chunks to PostgreSQL ───────────────────────────
            for chunk, faiss_id in zip(chunks, faiss_ids):
                db_chunk = KnowledgeChunk(
                    document_id=document_id,
                    content=chunk.content,
                    chunk_index=chunk.chunk_index,
                    faiss_index_id=int(faiss_id),
                )
                db.add(db_chunk)

            # ── Step 6: Mark document as indexed ──────────────────────────────
            doc.status = "Indexed"
            doc.chunk_count = len(chunks)
            doc.indexed_at = datetime.now(UTC)
            await db.commit()

            logger.info(
                "knowledge_index_complete",
                doc_id=document_id,
                doc_name=doc.name,
                chunks=len(chunks),
                faiss_total=faiss_manager.total_vectors,
            )

        except Exception as e:
            logger.error("knowledge_index_failed", doc_id=document_id, error=str(e))
            doc.status = "Error"
            doc.error_message = str(e)
            await db.commit()
            raise


def _extract_text(content: bytes, file_type: str) -> str:
    """Extract plain text from file bytes based on type."""
    if file_type in ("pdf",):
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages)

    elif file_type in ("json",):
        import json
        try:
            data = json.loads(content.decode("utf-8"))
            return json.dumps(data, indent=2)
        except Exception:
            return content.decode("utf-8", errors="ignore")

    else:
        # markdown, text, or any other format — decode as UTF-8
        return content.decode("utf-8", errors="ignore")

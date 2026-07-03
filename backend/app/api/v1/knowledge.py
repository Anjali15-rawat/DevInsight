"""Knowledge Base API endpoints."""
import os
import re
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from arq import create_pool

from app.api.deps import verify_document_access, verify_workspace_access
from arq.connections import RedisSettings

from app.api.deps import CurrentUser, DB
from app.core.config import settings
from app.models.knowledge import KnowledgeChunk, KnowledgeDocument
from app.rag.retriever import retrieve_relevant_chunks
from app.rag.indexer import faiss_manager
from app.schemas.knowledge import (
    KnowledgeDocRead,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
    KnowledgeChunkResult,
)

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

# ─── Security Constants ───────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {"pdf", "md", "markdown", "txt", "json", "docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/markdown",
    "text/plain",
    "application/json",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE_MB = 10  # Stricter limit to prevent DoS via chunking
FILENAME_PATTERN = re.compile(r"^[a-zA-Z0-9_\-. ]+\.[a-zA-Z0-9]+$")


def _sanitize_filename(filename: str | None) -> str:
    """Sanitize filename to prevent path traversal and injection attacks."""
    if not filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    # Strip directory separators (path traversal prevention)
    filename = filename.replace("\\", "/")
    filename = filename.split("/")[-1]

    # Strip null bytes
    filename = filename.replace("\x00", "")

    if not FILENAME_PATTERN.match(filename):
        raise HTTPException(
            status_code=400,
            detail="Invalid filename. Use only alphanumeric characters, hyphens, underscores, and dots.",
        )

    return filename


def _validate_file_type(filename: str, content_type: str | None) -> str:
    """Validate file extension and MIME type. Returns the validated extension."""
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # MIME type validation (if browser provided one)
    if content_type and content_type not in ALLOWED_MIME_TYPES and content_type != "application/octet-stream":
        # Log suspicious but don't hard-block — some browsers send incorrect MIME types
        pass

    return ext


@router.get("", response_model=list[KnowledgeDocRead], summary="List knowledge documents")
async def list_documents(
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_workspace_access),
):
    """List all uploaded knowledge base documents for a workspace."""
    stmt = (
        select(KnowledgeDocument)
        .where(KnowledgeDocument.workspace_id == workspace_id)
        .order_by(KnowledgeDocument.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/upload", status_code=status.HTTP_202_ACCEPTED, summary="Upload a knowledge document")
async def upload_document(
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    file: UploadFile = File(...),
    _: None = Depends(verify_workspace_access),
):
    """
    Upload a document (PDF, Markdown, DOCX, JSON, TXT) to the knowledge base.
    Processing (text extraction + embedding + FAISS indexing) happens asynchronously.
    Returns a document record with status="Pending".
    """
    # ─── Security: Sanitize filename ──────────────────────────────────────────
    safe_filename = _sanitize_filename(file.filename)

    # ─── Security: Validate file type ─────────────────────────────────────────
    file_ext = _validate_file_type(safe_filename, file.content_type)

    # ─── Security: Read and validate file size ────────────────────────────────
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_FILE_SIZE_MB}MB limit.")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    # ─── Quality: Check for duplicate uploads ─────────────────────────────────
    existing = await db.execute(
        select(KnowledgeDocument).where(
            KnowledgeDocument.workspace_id == workspace_id,
            KnowledgeDocument.name == safe_filename,
            KnowledgeDocument.file_size_bytes == len(content),
            KnowledgeDocument.status == "Indexed",
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"A document named '{safe_filename}' with the same size already exists. Delete it first to re-upload.",
        )

    # ─── Save file locally (or to Supabase in production) ─────────────────────
    storage_path = f"knowledge/{workspace_id}/{safe_filename}"
    os.makedirs(os.path.dirname(f"./uploads/{storage_path}"), exist_ok=True)
    with open(f"./uploads/{storage_path}", "wb") as f_out:
        f_out.write(content)

    # ─── Create document record ───────────────────────────────────────────────
    doc = KnowledgeDocument(
        workspace_id=workspace_id,
        uploaded_by_user_id=current_user.id,
        name=safe_filename,
        file_type=file_ext,
        file_size_bytes=len(content),
        storage_path=storage_path,
        status="Pending",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # ─── Dispatch indexing job to ARQ ─────────────────────────────────────────
    redis_pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    try:
        await redis_pool.enqueue_job(
            "run_knowledge_index_job",
            document_id=doc.id,
            file_content=content,
            file_type=file_ext,
        )
    finally:
        await redis_pool.aclose()

    return {"document_id": doc.id, "status": "Pending", "message": "Document queued for indexing"}


@router.post("/search", response_model=KnowledgeSearchResponse, summary="Semantic knowledge search")
async def search_knowledge(
    body: KnowledgeSearchRequest,
    workspace_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_workspace_access),
):
    """
    Perform semantic search over the workspace knowledge base.
    Optionally synthesizes an AI answer using the Knowledge Agent.
    """
    chunks = await retrieve_relevant_chunks(
        db, body.query, workspace_id, top_k=body.top_k
    )

    chunk_results = [
        KnowledgeChunkResult(
            document_id=c["document_id"],
            document_name=c["document_name"],
            content=c["content"],
            chunk_index=c["chunk_index"],
            relevance_score=c["relevance_score"],
        )
        for c in chunks
    ]

    # Synthesize answer via Knowledge Agent if chunks were found
    synthesized = None
    if chunks:
        from app.agents.orchestrator import orchestrator
        from app.schemas.agent_contracts import AgentInput
        agent_input = AgentInput(
            task_id=f"knowledge-search-{workspace_id}",
            target_type="query",
            target_content=body.query,
            metadata={"workspace_id": workspace_id},
            rag_context="\n\n".join(c["content"] for c in chunks),
        )
        result = await orchestrator.run_single_agent("knowledge", agent_input)
        synthesized = result.summary if result.status == "success" else None

    return KnowledgeSearchResponse(
        query=body.query,
        results=chunk_results,
        synthesized_answer=synthesized,
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(verify_document_access),
):
    """Remove a document and its FAISS vectors from the knowledge base."""
    stmt = select(KnowledgeDocument).where(KnowledgeDocument.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # ─── Clean up FAISS vectors before deleting from DB ───────────────────────
    chunk_stmt = select(KnowledgeChunk.faiss_index_id).where(
        KnowledgeChunk.document_id == document_id,
        KnowledgeChunk.faiss_index_id.isnot(None),
    )
    chunk_rows = await db.execute(chunk_stmt)
    faiss_ids = [row[0] for row in chunk_rows.all()]

    if faiss_ids:
        removed = faiss_manager.remove_ids(faiss_ids)
        import structlog
        structlog.get_logger(__name__).info(
            "faiss_vectors_cleaned_on_delete",
            document_id=document_id,
            removed_count=removed,
        )

    # ─── Clean up local file ──────────────────────────────────────────────────
    local_path = f"./uploads/{doc.storage_path}"
    if os.path.exists(local_path):
        os.remove(local_path)

    await db.delete(doc)
    await db.commit()

"""
KnowledgeDocument and KnowledgeChunk ORM models.

KnowledgeDocument tracks uploaded files. KnowledgeChunk stores
each text segment extracted from a document, along with its position
in the FAISS index for retrieval.
"""
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    uploaded_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # ─── File Metadata ────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)  # pdf/markdown/json/text
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)  # Supabase or local

    # ─── Indexing Status ──────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        Enum("Pending", "Indexing", "Indexed", "Error", name="knowledge_doc_status"),
        default="Pending",
        index=True,
    )
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ─── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    indexed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ─── Relationships ────────────────────────────────────────────────────────
    chunks: Mapped[list["KnowledgeChunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class KnowledgeChunk(Base):
    """
    One chunk of text extracted from a KnowledgeDocument.
    The faiss_index_id links this chunk to its position in the FAISS index.
    """
    __tablename__ = "knowledge_chunks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("knowledge_documents.id", ondelete="CASCADE"), index=True
    )

    # ─── Content ──────────────────────────────────────────────────────────────
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)  # Order within document

    # ─── FAISS Reference ──────────────────────────────────────────────────────
    # The row number in the FAISS index that corresponds to this chunk.
    faiss_index_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # ─── Relationships ────────────────────────────────────────────────────────
    document: Mapped["KnowledgeDocument"] = relationship(back_populates="chunks")

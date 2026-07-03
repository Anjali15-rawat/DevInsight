"""Knowledge Base Pydantic schemas."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class KnowledgeDocRead(BaseModel):
    """Matches the mockKnowledgeFiles shape in ai-workspace.tsx."""
    id: int
    name: str
    file_type: str
    file_size_bytes: int
    status: Literal["Pending", "Indexing", "Indexed", "Error"]
    chunk_count: int
    created_at: datetime
    indexed_at: datetime | None

    model_config = {"from_attributes": True}


class KnowledgeSearchRequest(BaseModel):
    query: str
    top_k: int = 5


class KnowledgeChunkResult(BaseModel):
    """A single retrieved chunk from the knowledge base."""
    document_id: int
    document_name: str
    content: str
    chunk_index: int
    relevance_score: float


class KnowledgeSearchResponse(BaseModel):
    query: str
    results: list[KnowledgeChunkResult]
    synthesized_answer: str | None = None  # Agent's synthesized response

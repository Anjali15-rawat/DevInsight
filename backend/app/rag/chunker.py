"""
Document chunker for the RAG pipeline.

Splits documents into overlapping text chunks that fit within
the embedding model's context window.

Supports:
  - Markdown-aware splitting
  - Code-aware splitting (basic structural chunking)
  - Plain text fallback
  - Hierarchical tracking (parent chunks)
"""
import re
from dataclasses import dataclass
from typing import Optional

from app.core.config import settings


@dataclass
class TextChunk:
    content: str
    chunk_index: int
    char_start: int
    char_end: int
    parent_index: Optional[int] = None


def chunk_markdown(text: str) -> list[TextChunk]:
    """Split a Markdown document into chunks, preserving header hierarchy where possible."""
    sections = re.split(r"\n(?=#{1,3} )", text)
    chunks: list[TextChunk] = []
    char_pos = 0
    max_chars = settings.CHUNK_SIZE * 4

    for i, section in enumerate(sections):
        if not section.strip():
            char_pos += len(section)
            continue
            
        parent_idx = max(0, i - 1) if i > 0 else None

        if len(section) <= max_chars:
            chunks.append(TextChunk(
                content=section.strip(),
                chunk_index=len(chunks),
                char_start=char_pos,
                char_end=char_pos + len(section),
                parent_index=parent_idx
            ))
        else:
            paragraphs = section.split("\n\n")
            buffer = ""
            buf_start = char_pos
            for para in paragraphs:
                if len(buffer) + len(para) <= max_chars:
                    buffer += para + "\n\n"
                else:
                    if buffer.strip():
                        chunks.append(TextChunk(
                            content=buffer.strip(),
                            chunk_index=len(chunks),
                            char_start=buf_start,
                            char_end=buf_start + len(buffer),
                            parent_index=parent_idx
                        ))
                    buffer = para + "\n\n"
                    buf_start = char_pos + text.find(para)
            if buffer.strip():
                chunks.append(TextChunk(
                    content=buffer.strip(),
                    chunk_index=len(chunks),
                    char_start=buf_start,
                    char_end=buf_start + len(buffer),
                    parent_index=parent_idx
                ))
        char_pos += len(section)

    return chunks


def chunk_code(text: str) -> list[TextChunk]:
    """
    Code-aware splitting: Split by classes or functions primarily.
    Fallback to plain text overlap if too large.
    """
    # Simplistic regex to match Python/JS/TS functions and classes
    sections = re.split(r"\n(?=class |def |function |const \w+ = \()", text)
    chunks: list[TextChunk] = []
    char_pos = 0
    max_chars = settings.CHUNK_SIZE * 4

    for i, section in enumerate(sections):
        if not section.strip():
            char_pos += len(section)
            continue
            
        if len(section) <= max_chars:
            chunks.append(TextChunk(
                content=section.strip(),
                chunk_index=len(chunks),
                char_start=char_pos,
                char_end=char_pos + len(section)
            ))
        else:
            # Fallback to plain text splitting if a single function/class is massive
            sub_chunks = chunk_plain_text(section)
            for sc in sub_chunks:
                sc.chunk_index = len(chunks)
                sc.char_start += char_pos
                sc.char_end += char_pos
                chunks.append(sc)
                
        char_pos += len(section)
        
    return chunks


def chunk_plain_text(text: str) -> list[TextChunk]:
    """Split plain text into fixed-size chunks with overlap."""
    max_chars = settings.CHUNK_SIZE * 4
    overlap_chars = settings.CHUNK_OVERLAP * 4
    chunks: list[TextChunk] = []
    start = 0

    while start < len(text):
        end = start + max_chars
        if end < len(text):
            nearest_period = text.rfind(".", start, end)
            if nearest_period > start + (max_chars // 2):
                end = nearest_period + 1

        chunk_text = text[start:end].strip()
        if chunk_text:
            chunks.append(TextChunk(
                content=chunk_text,
                chunk_index=len(chunks),
                char_start=start,
                char_end=end,
            ))
        start = max(start + 1, end - overlap_chars)

    return chunks


def chunk_document(text: str, file_type: str) -> list[TextChunk]:
    """Main entry point: selects chunking strategy based on file type."""
    if file_type in ("markdown", "md"):
        return chunk_markdown(text)
    elif file_type in ("py", "js", "ts", "go", "java"):
        return chunk_code(text)
    else:
        return chunk_plain_text(text)

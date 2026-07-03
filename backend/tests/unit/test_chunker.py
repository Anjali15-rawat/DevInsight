"""Unit tests for the RAG chunker."""
import pytest
from app.rag.chunker import chunk_markdown, chunk_plain_text, chunk_document


MARKDOWN_DOC = """# Architecture Overview

This document describes the system architecture.

## Database Layer

We use PostgreSQL with async SQLAlchemy. All queries are written using the ORM.

### Connection Pooling

Pool size is set to 10 with max overflow 20. The `pre_ping=True` setting ensures
stale connections are recycled automatically.

## API Layer

FastAPI with Pydantic v2 for request validation.
"""

PLAIN_TEXT = "The quick brown fox jumps over the lazy dog. " * 200  # Long plain text


def test_markdown_chunks_not_empty():
    chunks = chunk_markdown(MARKDOWN_DOC)
    assert len(chunks) > 0


def test_markdown_chunks_have_content():
    chunks = chunk_markdown(MARKDOWN_DOC)
    for chunk in chunks:
        assert chunk.content.strip() != ""


def test_markdown_chunk_indices_are_sequential():
    chunks = chunk_markdown(MARKDOWN_DOC)
    for i, chunk in enumerate(chunks):
        assert chunk.chunk_index == i


def test_plain_text_chunks_long_document():
    chunks = chunk_plain_text(PLAIN_TEXT)
    assert len(chunks) > 1  # Should split a long doc


def test_chunk_document_routes_markdown():
    chunks = chunk_document(MARKDOWN_DOC, "markdown")
    assert len(chunks) > 0


def test_chunk_document_routes_plain():
    chunks = chunk_document(PLAIN_TEXT, "txt")
    assert len(chunks) > 0


def test_short_document_single_chunk():
    short = "This is a short document."
    chunks = chunk_plain_text(short)
    assert len(chunks) == 1
    assert chunks[0].content == short

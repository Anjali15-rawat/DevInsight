"""
Declarative base for all SQLAlchemy ORM models.

All models must inherit from Base. Alembic uses this metadata
to detect and generate schema migration files.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Common base class for all ORM models.
    Provides the metadata registry that Alembic uses for migrations.
    """
    pass

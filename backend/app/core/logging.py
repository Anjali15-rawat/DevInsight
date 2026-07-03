"""
Structured logging configuration using structlog.

Produces JSON log lines in production and human-readable colored output
in development. Every log record includes:
  - request_id (injected by middleware)
  - timestamp
  - level
  - logger name
  - event message
  - any extra kwargs passed to the log call
"""
import logging
import sys

import structlog

from app.core.config import settings


def configure_logging() -> None:
    """
    Call once at application startup to configure structlog.
    """
    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if settings.is_production:
        # JSON output for log aggregators (Datadog, Grafana Loki, etc.)
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]
    else:
        # Human-readable colored output for local development
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Also configure stdlib logging to route through structlog
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """Get a named structlog logger for use in any module."""
    return structlog.get_logger(name)

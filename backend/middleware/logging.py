"""
Logging middleware using structlog for structured logging

Provides:
- HTTP request/response logging
- Structured log output (JSON in production, pretty-print in dev)
- Request ID tracking for tracing
- Performance metrics (request duration)
- Error context capturing
"""
import time
import uuid
from typing import Callable
import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from fastapi import FastAPI


def configure_logging(debug: bool = False) -> None:
    """
    Configure structlog for the application

    Args:
        debug: If True, use console-friendly output. If False, use JSON output.

    Benefits:
    - JSON logs are machine-parseable (great for log aggregators like ELK, Datadog)
    - Console logs are human-readable during development
    - Structured data makes debugging easier
    """
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
    ]

    if debug:
        # Development: Pretty console output
        processors.append(structlog.dev.ConsoleRenderer())
    else:
        # Production: JSON output for log aggregators
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.BoundLogger,
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for logging HTTP requests and responses

    Logs:
    - Request method, path, client IP
    - Response status code
    - Request duration (ms)
    - Request ID for tracing
    - User information (if authenticated)
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process HTTP request and log details

        Args:
            request: Incoming HTTP request
            call_next: Next middleware/route handler

        Returns:
            HTTP response
        """
        # Generate unique request ID for tracing
        request_id = str(uuid.uuid4())

        # Get logger with request context
        logger = structlog.get_logger()

        # Extract client IP (handles proxy headers)
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        # Extract user info if authenticated (from JWT token)
        user_id = None
        user_email = None
        if hasattr(request.state, "user"):
            user = request.state.user
            user_id = getattr(user, "id", None)
            user_email = getattr(user, "email", None)

        # Log incoming request
        logger.info(
            "http_request_started",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            query_params=str(request.query_params) if request.query_params else None,
            client_ip=client_ip,
            user_agent=request.headers.get("user-agent"),
            user_id=user_id,
            user_email=user_email,
        )

        # Track request duration
        start_time = time.time()

        try:
            # Process request
            response = await call_next(request)

            # Calculate duration
            duration_ms = round((time.time() - start_time) * 1000, 2)

            # Log successful response
            logger.info(
                "http_request_completed",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=duration_ms,
                user_id=user_id,
            )

            # Add request ID to response headers for client-side tracing
            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as exc:
            # Calculate duration even for failed requests
            duration_ms = round((time.time() - start_time) * 1000, 2)

            # Log error with full context
            logger.error(
                "http_request_failed",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                duration_ms=duration_ms,
                error_type=type(exc).__name__,
                error_message=str(exc),
                user_id=user_id,
                exc_info=True,  # Include full traceback
            )

            # Re-raise exception for FastAPI exception handlers
            raise


def get_logger(name: str = None) -> structlog.BoundLogger:
    """
    Get a structlog logger instance

    Args:
        name: Logger name (typically module name)

    Returns:
        Configured structlog logger

    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("user_created", user_id="USR-001", email="user@example.com")
    """
    return structlog.get_logger(name)

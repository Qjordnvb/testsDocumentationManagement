"""
Logger utility for easy access to structlog throughout the application

Provides a simple interface to get structured loggers for services, endpoints, etc.
"""
from backend.middleware.logging import get_logger as _get_logger


def get_logger(name: str = None):
    """
    Get a structured logger instance

    Args:
        name: Logger name (typically __name__ of the module)

    Returns:
        Configured structlog logger

    Example:
        >>> from backend.utils.logger import get_logger
        >>> logger = get_logger(__name__)
        >>> logger.info("user_created", user_id="USR-001", email="user@example.com")
        >>> logger.error("database_error", error="Connection timeout", retry_count=3)

    Best Practices:
    - Use descriptive event names (e.g., "user_created", not "created user")
    - Add structured data as keyword arguments (not in message string)
    - Use snake_case for event names and field names
    - Include relevant IDs for tracing (user_id, project_id, etc.)
    - Log at appropriate levels:
      * debug: Detailed diagnostic info
      * info: General informational messages
      * warning: Warning messages for degraded functionality
      * error: Error messages for failures
      * critical: Critical messages for system failures
    """
    return _get_logger(name)

"""
FastAPI main application
"""
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from backend.config import settings
from backend.api.routes2 import router
from backend.database import init_db
from backend.middleware.logging import LoggingMiddleware, configure_logging, get_logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Configure structured logging
    configure_logging(debug=settings.debug)
    logger = get_logger(__name__)

    # Startup
    logger.info(
        "application_starting",
        app_name=settings.app_name,
        version=settings.app_version,
        debug_mode=settings.debug,
    )

    settings.ensure_directories()
    logger.debug("directories_ensured")

    init_db()
    logger.info("database_initialized")

    logger.info(
        "application_ready",
        mode="DEBUG" if settings.debug else "PRODUCTION",
    )

    yield

    # Shutdown
    logger.info("application_shutting_down")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Automated QA documentation generation from user stories",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging middleware (logs all HTTP requests/responses)
app.add_middleware(LoggingMiddleware)

# Include API routes
app.include_router(router, prefix="/api/v1", tags=["QA Automation"])

# Serve static files (frontend)
try:
    app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
except RuntimeError:
    # Frontend directory doesn't exist yet, that's okay
    pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )

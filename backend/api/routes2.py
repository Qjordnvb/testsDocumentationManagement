"""
FastAPI routes for QA Documentation Automation
Main router aggregator
"""
from fastapi import APIRouter
from datetime import datetime
from backend.config import settings

# Import routers
from backend.api.endpoints import (
    auth,
    users,
    projects,
    stories,
    test_cases,
    bugs,
    bug_comments,
    reports,
    stats,
    executions
)

router = APIRouter()

# ==================== Health Check ====================
@router.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "running"
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# ==================== Include Routers ====================
# Authentication & Users (NEW)
router.include_router(auth.router, tags=["Authentication"])
router.include_router(users.router, tags=["User Management"])

# Existing Routers
router.include_router(projects.router, tags=["Projects"])
router.include_router(stories.router, tags=["User Stories"])
router.include_router(test_cases.router, tags=["Test Cases"])
router.include_router(bugs.router, tags=["Bug Reports"])
router.include_router(bug_comments.router, tags=["Bug Comments"])
router.include_router(reports.router, tags=["Reports & Downloads"])
router.include_router(stats.router, tags=["Statistics"])
router.include_router(executions.router, tags=["Test Execution"]) # Sprint 1

"""
Statistics endpoints

Handles global statistics operations.

Refactored to use StatsService following SOLID principles:
- Thin controllers: Only handle HTTP concerns (requests, responses, status codes)
- Business logic delegated to StatsService
- Testability: Service layer can be unit tested independently
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.stats_service import StatsService

router = APIRouter()


def get_stats_service_dependency(db: Session = Depends(get_db)) -> StatsService:
    """Dependency injection for StatsService"""
    return StatsService(db)


@router.get("/stats")
async def get_statistics(
    service: StatsService = Depends(get_stats_service_dependency)
):
    """
    Get global project statistics

    Args:
        service: Injected StatsService instance

    Returns:
        Statistics dictionary
    """
    return service.get_global_statistics()

"""
Statistics Service Layer

Handles business logic for statistics operations following SOLID principles:
- Single Responsibility: Only handles stats-related business logic
- Dependency Inversion: Depends on Session abstraction
- Open/Closed: Easy to extend with new statistics
"""

from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime

from backend.database import UserStoryDB, TestCaseDB, BugReportDB


class StatsService:
    """Service class for statistics business logic"""

    def __init__(self, db: Session):
        """Initialize service with database session"""
        self.db = db

    def get_global_statistics(self) -> Dict[str, Any]:
        """
        Get global project statistics

        Returns:
            Dictionary with statistics
        """
        total_stories = self.db.query(UserStoryDB).count()
        total_test_cases = self.db.query(TestCaseDB).count()
        total_bugs = self.db.query(BugReportDB).count()

        # Stories by status
        stories_by_status = {}
        for status in ["Backlog", "To Do", "In Progress", "Testing", "Done"]:
            count = self.db.query(UserStoryDB).filter(UserStoryDB.status == status).count()
            stories_by_status[status] = count

        return {
            "total_user_stories": total_stories,
            "total_test_cases": total_test_cases,
            "total_bugs": total_bugs,
            "stories_by_status": stories_by_status,
            "timestamp": datetime.now().isoformat()
        }


def get_stats_service(db: Session) -> StatsService:
    """Dependency injection helper for FastAPI"""
    return StatsService(db)

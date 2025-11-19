from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db, UserStoryDB, TestCaseDB, BugReportDB

router = APIRouter()

@router.get("/stats")
async def get_statistics(db: Session = Depends(get_db)):
    """Get project statistics"""
    total_stories = db.query(UserStoryDB).count()
    total_test_cases = db.query(TestCaseDB).count()
    total_bugs = db.query(BugReportDB).count()

    # Stories by status
    stories_by_status = {}
    for status in ["Backlog", "To Do", "In Progress", "Testing", "Done"]:
        count = db.query(UserStoryDB).filter(UserStoryDB.status == status).count()
        stories_by_status[status] = count

    return {
        "total_user_stories": total_stories,
        "total_test_cases": total_test_cases,
        "total_bugs": total_bugs,
        "stories_by_status": stories_by_status,
        "timestamp": datetime.now().isoformat()
    }

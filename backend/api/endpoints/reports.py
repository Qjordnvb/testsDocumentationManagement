from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
import os

from backend.database import get_db, ProjectDB, UserStoryDB, TestCaseDB
from backend.models import UserStory, TestCase
from backend.generators import TestPlanGenerator
from backend.config import settings

router = APIRouter()

@router.post("/generate-test-plan")
async def generate_test_plan(
    project_id: str = Query(..., description="Project ID to generate test plan for"),
    format: str = Query(default="both", description="Format: pdf, docx, or both"),
    db: Session = Depends(get_db)
):
    """
    Generate test plan document for a specific project
    """
    # Validate project exists
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Get user stories and test cases for this project only
    user_stories_db = db.query(UserStoryDB).filter(UserStoryDB.project_id == project_id).all()
    test_cases_db = db.query(TestCaseDB).filter(TestCaseDB.project_id == project_id).all()

    # Convert to models (simplified)
    user_stories = [
        UserStory(
            id=s.id,
            title=s.title,
            description=s.description,
            priority=s.priority,
            status=s.status
        )
        for s in user_stories_db
    ]

    test_cases = [
        TestCase(
            id=tc.id,
            title=tc.title,
            description=tc.description,
            user_story_id=tc.user_story_id,
            test_type=tc.test_type,
            priority=tc.priority,
            status=tc.status
        )
        for tc in test_cases_db
    ]

    # Generate test plan
    settings.ensure_directories()
    test_plan_gen = TestPlanGenerator()
    files = test_plan_gen.generate_test_plan(
        user_stories=user_stories,
        test_cases=test_cases,
        output_dir=settings.output_dir,
        project_name=project.name,  # Use project name from database
        format=format
    )

    return {
        "message": "Test plan generated successfully",
        "files": files
    }

@router.get("/download/{filename}")
async def download_file(filename: str):
    """Download generated file"""
    file_path = Path(settings.output_dir) / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )

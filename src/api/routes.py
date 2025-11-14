"""
FastAPI routes for QA Documentation Automation
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List, Optional
from pathlib import Path
import shutil
from datetime import datetime

from src.models import UserStory, TestCase, BugReport
from src.parsers import FileParser
from src.generators import GherkinGenerator, TestPlanGenerator, BugReportGenerator
from src.integrations import GeminiClient
from src.database import get_db, init_db, UserStoryDB, TestCaseDB, BugReportDB
from src.config import settings
from .dependencies import get_gemini_client
from sqlalchemy.orm import Session

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


# ==================== File Upload & Parsing ====================
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and parse XLSX/CSV file with user stories
    """
    # Validate file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in [".xlsx", ".xls", ".csv"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_extension}. Please upload .xlsx or .csv file"
        )

    # Save uploaded file
    settings.ensure_directories()
    file_path = Path(settings.upload_dir) / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Parse file
    parser = FileParser()
    result = parser.parse(str(file_path))

    if not result.success:
        raise HTTPException(status_code=400, detail=f"Parse errors: {result.errors}")

    # Save to database
    saved_stories = []
    for user_story in result.user_stories:
        db_story = UserStoryDB(
            id=user_story.id,
            title=user_story.title,
            description=user_story.description,
            priority=user_story.priority,
            status=user_story.status,
            epic=user_story.epic,
            sprint=user_story.sprint,
            story_points=user_story.story_points,
            assigned_to=user_story.assigned_to,
            total_criteria=len(user_story.acceptance_criteria),
            completed_criteria=sum(1 for ac in user_story.acceptance_criteria if ac.completed),
            completion_percentage=user_story.get_completion_percentage()
        )
        db.add(db_story)
        saved_stories.append(user_story.id)

    db.commit()

    return {
        "message": f"Successfully parsed {len(result.user_stories)} user stories",
        "user_stories": saved_stories,
        "file_path": str(file_path),
        "detected_columns": parser.get_detected_columns_info()
    }


@router.get("/user-stories", response_model=List[dict])
async def get_user_stories(db: Session = Depends(get_db)):
    """Get all user stories from database"""
    stories = db.query(UserStoryDB).all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "description": s.description,
            "priority": s.priority.value if s.priority else None,
            "status": s.status.value if s.status else None,
            "completion_percentage": s.completion_percentage
        }
        for s in stories
    ]


@router.get("/user-stories/{story_id}")
async def get_user_story(story_id: str, db: Session = Depends(get_db)):
    """Get specific user story"""
    story = db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="User story not found")

    return {
        "id": story.id,
        "title": story.title,
        "description": story.description,
        "priority": story.priority.value if story.priority else None,
        "status": story.status.value if story.status else None,
        "epic": story.epic,
        "sprint": story.sprint,
        "story_points": story.story_points,
        "completion_percentage": story.completion_percentage
    }


# ==================== Test Case Generation ====================
@router.post("/generate-test-cases/{story_id}")
async def generate_test_cases(
    story_id: str,
    use_ai: bool = True,
    num_scenarios: int = 3,
    db: Session = Depends(get_db),
    gemini_client: GeminiClient = Depends(get_gemini_client)
):
    """
    Generate test cases with Gherkin scenarios for a user story
    """
    # Get user story from database
    story_db = db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
    if not story_db:
        raise HTTPException(status_code=404, detail="User story not found")

    # Convert to UserStory model (simplified, you may want to fetch full data)
    user_story = UserStory(
        id=story_db.id,
        title=story_db.title,
        description=story_db.description,
        priority=story_db.priority,
        status=story_db.status
    )

    # Generate scenarios
    gherkin_gen = GherkinGenerator(gemini_client if use_ai else None)

    settings.ensure_directories()
    gherkin_file = gherkin_gen.generate_from_user_story(
        user_story=user_story,
        output_dir=settings.output_dir,
        use_ai=use_ai,
        num_scenarios=num_scenarios
    )

    # Create test case record in database
    test_case_id = f"TC-{story_id}-001"
    db_test_case = TestCaseDB(
        id=test_case_id,
        title=f"Test for {user_story.title}",
        description=f"Automated test scenarios for {user_story.id}",
        user_story_id=story_id,
        gherkin_file_path=gherkin_file,
        created_date=datetime.now()
    )
    db.add(db_test_case)
    db.commit()

    return {
        "message": "Test cases generated successfully",
        "test_case_id": test_case_id,
        "gherkin_file": gherkin_file,
        "user_story_id": story_id
    }


@router.get("/test-cases")
async def get_test_cases(db: Session = Depends(get_db)):
    """Get all test cases"""
    test_cases = db.query(TestCaseDB).all()
    return [
        {
            "id": tc.id,
            "title": tc.title,
            "user_story_id": tc.user_story_id,
            "test_type": tc.test_type.value,
            "status": tc.status.value,
            "gherkin_file": tc.gherkin_file_path
        }
        for tc in test_cases
    ]


# ==================== Test Plan Generation ====================
@router.post("/generate-test-plan")
async def generate_test_plan(
    project_name: str,
    format: str = "both",
    db: Session = Depends(get_db)
):
    """
    Generate test plan document
    """
    # Get all user stories and test cases
    user_stories_db = db.query(UserStoryDB).all()
    test_cases_db = db.query(TestCaseDB).all()

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
        project_name=project_name,
        format=format
    )

    return {
        "message": "Test plan generated successfully",
        "files": files
    }


# ==================== Bug Report Generation ====================
@router.post("/generate-bug-template")
async def generate_bug_template():
    """Generate bug report template"""
    settings.ensure_directories()
    bug_gen = BugReportGenerator()
    template_path = bug_gen.generate_template(settings.output_dir)

    return {
        "message": "Bug report template generated",
        "file": template_path
    }


@router.post("/create-bug-report")
async def create_bug_report(
    bug: BugReport,
    db: Session = Depends(get_db)
):
    """Create and save a bug report"""
    # Generate bug ID if not provided
    if not bug.id:
        bug.id = f"BUG-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # Generate document
    settings.ensure_directories()
    bug_gen = BugReportGenerator()
    doc_path = bug_gen.generate_bug_report(bug, settings.output_dir)

    # Save to database
    db_bug = BugReportDB(
        id=bug.id,
        title=bug.title,
        description=bug.description,
        severity=bug.severity,
        priority=bug.priority,
        bug_type=bug.bug_type,
        status=bug.status,
        environment=bug.environment,
        browser=bug.browser,
        os=bug.os,
        version=bug.version,
        user_story_id=bug.user_story_id,
        test_case_id=bug.test_case_id,
        reported_by=bug.reported_by,
        assigned_to=bug.assigned_to,
        reported_date=bug.reported_date or datetime.now(),
        document_path=doc_path
    )
    db.add(db_bug)
    db.commit()

    return {
        "message": "Bug report created successfully",
        "bug_id": bug.id,
        "document": doc_path
    }


# ==================== File Download ====================
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


# ==================== Statistics ====================
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

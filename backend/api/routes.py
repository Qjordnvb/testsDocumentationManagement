"""
FastAPI routes for QA Documentation Automation
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse
from typing import List, Optional
from pathlib import Path
import shutil
import os
from datetime import datetime
from backend.models.test_case import TestExecutionCreate
from backend.models import (
    Project, CreateProjectDTO, UpdateProjectDTO, ProjectStatus,
    UserStory, AcceptanceCriteria, TestCase, BugReport, TestType, TestPriority, TestStatus
)
from backend.api.endpoints import executions
from backend.parsers import FileParser
from backend.generators import GherkinGenerator, TestPlanGenerator, BugReportGenerator
from backend.integrations import GeminiClient
from backend.database import get_db, init_db, ProjectDB, UserStoryDB, TestCaseDB, BugReportDB
from backend.config import settings
from .dependencies import get_gemini_client
from sqlalchemy.orm import Session
import json

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


# ==================== Projects ====================
@router.get("/projects")
async def get_projects(db: Session = Depends(get_db)):
    """Get all projects"""
    projects = db.query(ProjectDB).all()

    # Calculate metrics for each project
    result = []
    for project in projects:
        total_stories = db.query(UserStoryDB).filter(UserStoryDB.project_id == project.id).count()
        total_tests = db.query(TestCaseDB).filter(TestCaseDB.project_id == project.id).count()
        total_bugs = db.query(BugReportDB).filter(BugReportDB.project_id == project.id).count()

        coverage = min((total_tests / total_stories * 100), 100.0) if total_stories > 0 else 0.0

        result.append({
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "client": project.client,
            "team_members": json.loads(project.team_members) if project.team_members else [],
            "status": project.status.value,
            "default_test_types": json.loads(project.default_test_types) if project.default_test_types else [],
            "start_date": project.start_date.isoformat() if project.start_date else None,
            "end_date": project.end_date.isoformat() if project.end_date else None,
            "created_date": project.created_date.isoformat(),
            "updated_date": project.updated_date.isoformat(),
            "total_user_stories": total_stories,
            "total_test_cases": total_tests,
            "total_bugs": total_bugs,
            "test_coverage": round(coverage, 2)
        })

    return {"projects": result}


@router.get("/projects/{project_id}")
async def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get project by ID"""
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Calculate metrics
    total_stories = db.query(UserStoryDB).filter(UserStoryDB.project_id == project.id).count()
    total_tests = db.query(TestCaseDB).filter(TestCaseDB.project_id == project.id).count()
    total_bugs = db.query(BugReportDB).filter(BugReportDB.project_id == project.id).count()
    coverage = min((total_tests / total_stories * 100), 100.0) if total_stories > 0 else 0.0

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "client": project.client,
        "team_members": json.loads(project.team_members) if project.team_members else [],
        "status": project.status.value,
        "default_test_types": json.loads(project.default_test_types) if project.default_test_types else [],
        "start_date": project.start_date.isoformat() if project.start_date else None,
        "end_date": project.end_date.isoformat() if project.end_date else None,
        "created_date": project.created_date.isoformat(),
        "updated_date": project.updated_date.isoformat(),
        "total_user_stories": total_stories,
        "total_test_cases": total_tests,
        "total_bugs": total_bugs,
        "test_coverage": round(coverage, 2)
    }


@router.post("/projects")
async def create_project(project_data: CreateProjectDTO, db: Session = Depends(get_db)):
    """Create new project"""
    # Generate project ID
    project_count = db.query(ProjectDB).count()
    project_id = f"PROJ-{str(project_count + 1).zfill(3)}"

    # Check if ID already exists
    while db.query(ProjectDB).filter(ProjectDB.id == project_id).first():
        project_count += 1
        project_id = f"PROJ-{str(project_count + 1).zfill(3)}"

    # Create project
    new_project = ProjectDB(
        id=project_id,
        name=project_data.name,
        description=project_data.description,
        client=project_data.client,
        team_members=json.dumps(project_data.team_members) if project_data.team_members else None,
        default_test_types=json.dumps(project_data.default_test_types) if project_data.default_test_types else None,
        start_date=project_data.start_date,
        end_date=project_data.end_date,
        status=ProjectStatus.ACTIVE,
        created_date=datetime.now(),
        updated_date=datetime.now()
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return {
        "id": new_project.id,
        "name": new_project.name,
        "description": new_project.description,
        "client": new_project.client,
        "team_members": json.loads(new_project.team_members) if new_project.team_members else [],
        "status": new_project.status.value,
        "default_test_types": json.loads(new_project.default_test_types) if new_project.default_test_types else [],
        "start_date": new_project.start_date.isoformat() if new_project.start_date else None,
        "end_date": new_project.end_date.isoformat() if new_project.end_date else None,
        "created_date": new_project.created_date.isoformat(),
        "updated_date": new_project.updated_date.isoformat(),
        "total_user_stories": 0,
        "total_test_cases": 0,
        "total_bugs": 0,
        "test_coverage": 0.0
    }


@router.put("/projects/{project_id}")
async def update_project(
    project_id: str,
    updates: UpdateProjectDTO,
    db: Session = Depends(get_db)
):
    """Update project"""
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Update fields
    if updates.name is not None:
        project.name = updates.name
    if updates.description is not None:
        project.description = updates.description
    if updates.client is not None:
        project.client = updates.client
    if updates.team_members is not None:
        project.team_members = json.dumps(updates.team_members)
    if updates.status is not None:
        project.status = updates.status
    if updates.default_test_types is not None:
        project.default_test_types = json.dumps(updates.default_test_types)
    if updates.start_date is not None:
        project.start_date = updates.start_date
    if updates.end_date is not None:
        project.end_date = updates.end_date

    project.updated_date = datetime.now()

    db.commit()
    db.refresh(project)

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "client": project.client,
        "team_members": json.loads(project.team_members) if project.team_members else [],
        "status": project.status.value,
        "message": "Project updated successfully"
    }


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Delete project and all related data"""
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Delete project (cascade will delete user stories, test cases, bugs)
    db.delete(project)
    db.commit()

    return {"message": f"Project {project_id} deleted successfully"}


@router.get("/projects/{project_id}/stats")
async def get_project_stats(project_id: str, db: Session = Depends(get_db)):
    """Get project statistics"""
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    total_stories = db.query(UserStoryDB).filter(UserStoryDB.project_id == project_id).count()
    total_test_cases = db.query(TestCaseDB).filter(TestCaseDB.project_id == project_id).count()
    total_bugs = db.query(BugReportDB).filter(BugReportDB.project_id == project_id).count()

    # Stories by status
    stories_by_status = {}
    for status in ["Backlog", "To Do", "In Progress", "Testing", "Done"]:
        count = db.query(UserStoryDB).filter(
            UserStoryDB.project_id == project_id,
            UserStoryDB.status == status
        ).count()
        stories_by_status[status] = count

    return {
        "project_id": project_id,
        "project_name": project.name,
        "total_user_stories": total_stories,
        "total_test_cases": total_test_cases,
        "total_bugs": total_bugs,
        "stories_by_status": stories_by_status,
        "timestamp": datetime.now().isoformat()
    }


# ==================== File Upload & Parsing ====================
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    project_id: str = Query(..., description="Project ID to associate user stories with"),
    db: Session = Depends(get_db),
    gemini_client: GeminiClient = Depends(get_gemini_client)
):
    """
    Upload and parse XLSX/CSV file with user stories
    """
    try:
        # Validate that project exists
        project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=404,
                detail=f"Project {project_id} not found. Please create the project first."
            )

        print(f"\n=== UPLOAD DEBUG ===")
        print(f"Project: {project_id} - {project.name}")
        print(f"Received file: {file.filename}")
        print(f"Content type: {file.content_type}")

        # Validate file extension
        file_extension = Path(file.filename).suffix.lower()
        print(f"File extension: {file_extension}")

        if file_extension not in [".xlsx", ".xls", ".csv"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_extension}. Please upload .xlsx or .csv file"
            )

        # Save uploaded file
        settings.ensure_directories()
        file_path = Path(settings.upload_dir) / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        print(f"Saving to: {file_path}")

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"File saved successfully. Size: {file_path.stat().st_size} bytes")

        # Parse file with AI support for acceptance criteria
        print("Starting file parsing with AI support...")
        parser = FileParser(gemini_client=gemini_client)
        result = parser.parse(str(file_path))

        print(f"Parse result: success={result.success}, stories={len(result.user_stories)}, errors={result.errors}")

        if not result.success:
            raise HTTPException(status_code=400, detail=f"Parse errors: {result.errors}")

        # Save to database (UPSERT: update if exists, insert if new)
        print(f"Saving {len(result.user_stories)} stories to database...")
        saved_stories = []
        updated_stories = []

        for user_story in result.user_stories:
            # Check if story already exists
            existing_story = db.query(UserStoryDB).filter(UserStoryDB.id == user_story.id).first()

            if existing_story:
                # Update existing story
                print(f"  Updating story: {user_story.id} - {user_story.title}")
                existing_story.title = user_story.title
                existing_story.description = user_story.description
                existing_story.priority = user_story.priority
                existing_story.status = user_story.status
                existing_story.epic = user_story.epic
                existing_story.sprint = user_story.sprint
                existing_story.story_points = user_story.story_points
                existing_story.assigned_to = user_story.assigned_to
                # Save acceptance criteria as JSON
                existing_story.acceptance_criteria = json.dumps(
                    [ac.dict() for ac in user_story.acceptance_criteria]
                ) if user_story.acceptance_criteria else None
                existing_story.total_criteria = len(user_story.acceptance_criteria)
                existing_story.completed_criteria = sum(1 for ac in user_story.acceptance_criteria if ac.completed)
                existing_story.completion_percentage = user_story.get_completion_percentage()
                existing_story.updated_date = datetime.now()
                updated_stories.append(user_story.id)
            else:
                # Insert new story
                print(f"  Inserting new story: {user_story.id} - {user_story.title}")
                db_story = UserStoryDB(
                    id=user_story.id,
                    project_id=project_id,  # Associate with project
                    title=user_story.title,
                    description=user_story.description,
                    priority=user_story.priority,
                    status=user_story.status,
                    epic=user_story.epic,
                    sprint=user_story.sprint,
                    story_points=user_story.story_points,
                    assigned_to=user_story.assigned_to,
                    # Save acceptance criteria as JSON
                    acceptance_criteria=json.dumps(
                        [ac.dict() for ac in user_story.acceptance_criteria]
                    ) if user_story.acceptance_criteria else None,
                    total_criteria=len(user_story.acceptance_criteria),
                    completed_criteria=sum(1 for ac in user_story.acceptance_criteria if ac.completed),
                    completion_percentage=user_story.get_completion_percentage()
                )
                db.add(db_story)
                saved_stories.append(user_story.id)

        db.commit()
        print(f"Database commit successful! Inserted: {len(saved_stories)}, Updated: {len(updated_stories)}")

        # Fetch the saved stories with all data
        all_story_ids = [s.id for s in result.user_stories]
        db_stories = db.query(UserStoryDB).filter(UserStoryDB.id.in_(all_story_ids)).all()

        # Format stories with acceptance criteria
        formatted_stories = []
        for story in db_stories:
            formatted_stories.append({
                "id": story.id,
                "title": story.title,
                "description": story.description,
                "acceptance_criteria": json.loads(story.acceptance_criteria) if story.acceptance_criteria else [],
                "total_criteria": story.total_criteria,
                "completed_criteria": story.completed_criteria,
                "completion_percentage": story.completion_percentage,
                "priority": story.priority,
                "status": story.status
            })

        print(f"Returning {len(formatted_stories)} stories with criteria")
        print("=== UPLOAD COMPLETE ===\n")

        return {
            "message": f"Successfully processed {len(result.user_stories)} user stories ({len(saved_stories)} new, {len(updated_stories)} updated)",
            "file_name": file.filename,
            "stories_count": len(formatted_stories),
            "user_stories": formatted_stories,
            "inserted": len(saved_stories),
            "updated": len(updated_stories),
            "total": len(result.user_stories),
            "file_path": str(file_path),
            "detected_columns": parser.get_detected_columns_info()
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"\n!!! UPLOAD ERROR !!!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        import traceback
        print(f"Traceback:\n{traceback.format_exc()}")
        print("===================\n")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )


@router.get("/user-stories")
async def get_user_stories(
    project_id: str = Query(..., description="Filter user stories by project ID"),
    db: Session = Depends(get_db)
):
    """Get all user stories for a specific project"""
    # Validate project exists
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Filter stories by project
    stories = db.query(UserStoryDB).filter(UserStoryDB.project_id == project_id).all()
    user_stories_list = [
        {
            "id": s.id,
            "title": s.title,
            "description": s.description,
            "priority": s.priority.value if s.priority else None,
            "status": s.status.value if s.status else None,
            "epic": s.epic,
            "sprint": s.sprint,
            "story_points": s.story_points,
            "assigned_to": s.assigned_to,
            "acceptance_criteria": json.loads(s.acceptance_criteria) if s.acceptance_criteria else [],
            "created_at": s.created_date.isoformat() if s.created_date else None,
            "updated_at": s.updated_date.isoformat() if s.updated_date else None,
            "completion_percentage": s.completion_percentage,
            "test_case_ids": []  # TODO: Fetch from relationship
        }
        for s in stories
    ]
    return {"user_stories": user_stories_list}


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
        "acceptance_criteria": json.loads(story.acceptance_criteria) if story.acceptance_criteria else [],
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

    # Validate user story has project_id
    if not story_db.project_id:
        raise HTTPException(
            status_code=400,
            detail=f"User story {story_id} is not associated with a project. Please re-import user stories with project_id."
        )

    # Parse acceptance criteria from JSON
    acceptance_criteria = []
    if story_db.acceptance_criteria:
        try:
            criteria_data = json.loads(story_db.acceptance_criteria)
            acceptance_criteria = [AcceptanceCriteria(**ac) for ac in criteria_data]
        except Exception as e:
            print(f"Warning: Failed to parse acceptance criteria for {story_id}: {e}")

    # Convert to UserStory model with full data including acceptance criteria
    user_story = UserStory(
        id=story_db.id,
        title=story_db.title,
        description=story_db.description,
        acceptance_criteria=acceptance_criteria,
        priority=story_db.priority,
        status=story_db.status,
        epic=story_db.epic,
        sprint=story_db.sprint,
        story_points=story_db.story_points,
        assigned_to=story_db.assigned_to
    )

    # Generate scenarios
    gherkin_gen = GherkinGenerator(gemini_client if use_ai else None)

    settings.ensure_directories()

    try:
        gherkin_file = gherkin_gen.generate_from_user_story(
            user_story=user_story,
            output_dir=settings.output_dir,
            use_ai=use_ai,
            num_scenarios=num_scenarios
        )
    except Exception as e:
        # Handle API errors (e.g., API key issues)
        error_msg = str(e)
        if "403" in error_msg or "API key" in error_msg:
            raise HTTPException(
                status_code=403,
                detail="Gemini API error: Invalid or leaked API key. Please update your GEMINI_API_KEY in .env file. Get a new key at https://aistudio.google.com/app/apikey"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Error generating test scenarios: {error_msg}"
            )

    # UPSERT: Create or update test case record in database
    test_case_id = f"TC-{story_id}-001"

    # Check if test case already exists
    existing_test_case = db.query(TestCaseDB).filter(TestCaseDB.id == test_case_id).first()

    if existing_test_case:
        # Update existing test case
        print(f"  Updating test case: {test_case_id}")
        existing_test_case.title = f"Test for {user_story.title}"
        existing_test_case.description = f"Automated test scenarios for {user_story.id}"
        existing_test_case.gherkin_file_path = gherkin_file
        action = "updated"
    else:
        # Create new test case
        print(f"  Creating new test case: {test_case_id}")
        db_test_case = TestCaseDB(
            id=test_case_id,
            project_id=story_db.project_id,  # Inherit from user story
            title=f"Test for {user_story.title}",
            description=f"Automated test scenarios for {user_story.id}",
            user_story_id=story_id,
            gherkin_file_path=gherkin_file,
            created_date=datetime.now()
        )
        db.add(db_test_case)
        action = "created"

    db.commit()
    db.refresh(existing_test_case if existing_test_case else db_test_case)

    # Get the saved/updated test case for response
    test_case = existing_test_case if existing_test_case else db_test_case

    # Return in format expected by frontend
    return {
        "message": f"Test cases {action} successfully",
        "test_cases": [{
            "id": test_case.id,
            "title": test_case.title,
            "description": test_case.description,
            "user_story_id": test_case.user_story_id,
            "test_type": test_case.test_type.value if test_case.test_type else None,
            "priority": test_case.priority.value if test_case.priority else None,
            "status": test_case.status.value if test_case.status else None,
            "estimated_time_minutes": test_case.estimated_time_minutes,
            "actual_time_minutes": test_case.actual_time_minutes,
            "automated": test_case.automated,
            "created_date": test_case.created_date.isoformat() if test_case.created_date else None,
            "gherkin_file_path": test_case.gherkin_file_path,
        }],
        "action": action,
        "gherkin_file": gherkin_file
    }


@router.get("/test-cases")
async def get_test_cases(
    project_id: str = Query(..., description="Filter test cases by project ID"),
    db: Session = Depends(get_db)
):
    """Get all test cases for a specific project"""
    # Validate project exists
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Filter test cases by project
    test_cases = db.query(TestCaseDB).filter(TestCaseDB.project_id == project_id).all()
    return {
        "test_cases": [
            {
                "id": tc.id,
                "title": tc.title,
                "description": tc.description,
                "user_story_id": tc.user_story_id,
                "test_type": tc.test_type.value if tc.test_type else None,
                "priority": tc.priority.value if tc.priority else None,
                "status": tc.status.value if tc.status else None,
                "estimated_time_minutes": tc.estimated_time_minutes,
                "actual_time_minutes": tc.actual_time_minutes,
                "automated": tc.automated,
                "created_date": tc.created_date.isoformat() if tc.created_date else None,
                "last_executed": tc.last_executed.isoformat() if tc.last_executed else None,
                "executed_by": tc.executed_by,
                "gherkin_file_path": tc.gherkin_file_path,
            }
            for tc in test_cases
        ]
    }



# ==================== Test Cases CRUD & Preview ====================

@router.post("/generate-test-cases/{story_id}/preview")
async def preview_test_cases(
    story_id: str,
    num_test_cases: int = Query(default=5, ge=1, le=10),
    scenarios_per_test: int = Query(default=3, ge=1, le=10),
    test_types: List[str] = Query(default=["FUNCTIONAL", "UI"]),
    use_ai: bool = True,
    db: Session = Depends(get_db),
    gemini_client: GeminiClient = Depends(get_gemini_client)
):
    """
    Generate test case suggestions (PREVIEW - does NOT save to DB)
    QA will review before saving
    """
    # Get user story
    story_db = db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
    if not story_db:
        raise HTTPException(status_code=404, detail="User story not found")

    # Validate user story has project_id
    if not story_db.project_id:
        raise HTTPException(
            status_code=400,
            detail=f"User story {story_id} is not associated with a project. Please re-import user stories with project_id."
        )

    # Parse acceptance criteria from JSON
    acceptance_criteria = []
    if story_db.acceptance_criteria:
        try:
            criteria_data = json.loads(story_db.acceptance_criteria)
            acceptance_criteria = [AcceptanceCriteria(**ac) for ac in criteria_data]
        except Exception as e:
            print(f"Warning: Failed to parse acceptance criteria for {story_id}: {e}")

    user_story = UserStory(
        id=story_db.id,
        title=story_db.title,
        description=story_db.description,
        acceptance_criteria=acceptance_criteria,
        priority=story_db.priority,
        status=story_db.status,
        epic=story_db.epic,
        sprint=story_db.sprint,
        story_points=story_db.story_points,
        assigned_to=story_db.assigned_to
    )

    # Generate multiple test cases with AI
    suggested_test_cases = []

    # Generate Gherkin scenarios using AI if enabled
    gherkin_scenarios = []
    if use_ai:
        try:
            total_scenarios_needed = scenarios_per_test * num_test_cases

            # Use batched generation for better reliability and performance
            gherkin_scenarios = gemini_client.generate_gherkin_scenarios_batched(
                user_story,
                num_scenarios=total_scenarios_needed,
                batch_size=15  # Generate max 15 scenarios per API call
            )
        except Exception as e:
            import traceback
            print(f"❌ AI generation failed with error:")
            print(f"   Error type: {type(e).__name__}")
            print(f"   Error message: {str(e)}")
            print(f"   Traceback:")
            traceback.print_exc()
            print(f"⚠️  Using fallback generation instead")
            use_ai = False

    # Distribute scenarios across test cases
    scenarios_per_tc = len(gherkin_scenarios) // num_test_cases if gherkin_scenarios else scenarios_per_test

    for i in range(num_test_cases):
        # Determine test type for this test case
        test_type = test_types[i % len(test_types)] if test_types else "FUNCTIONAL"

        # Generate title based on test type and position
        titles = {
            "FUNCTIONAL": f"Functional tests for {user_story.title}",
            "UI": f"UI validation for {user_story.title}",
            "SECURITY": f"Security tests for {user_story.title}",
            "API": f"API tests for {user_story.title}",
            "INTEGRATION": f"Integration tests for {user_story.title}",
        }
        title = titles.get(test_type, f"Test case {i+1} for {user_story.title}")

        # Get scenarios for this test case
        start_idx = i * scenarios_per_tc
        end_idx = start_idx + scenarios_per_tc
        test_scenarios = gherkin_scenarios[start_idx:end_idx] if gherkin_scenarios else []

        # Generate Gherkin content
        if test_scenarios:
            gherkin_lines = [
                f"Feature: {title}",
                f"  {user_story.description[:200]}..." if len(user_story.description) > 200 else f"  {user_story.description}",
                "",
                f"  User Story: {user_story.id}",
                f"  Test Type: {test_type}",
                "",
            ]

            for scenario in test_scenarios:
                gherkin_lines.append(scenario.to_gherkin())
                gherkin_lines.append("")  # Empty line between scenarios

            gherkin_content = "\n".join(gherkin_lines)
        else:
            # Fallback: Generate multiple scenarios based on test type (NO AI) - EN ESPAÑOL
            gherkin_lines = [
                f"Feature: {title}",
                f"  {user_story.description}",
                "",
                f"  Historia de Usuario: {user_story.id}",
                f"  Tipo de Prueba: {test_type}",
                f"  Nota: Generación con IA no disponible - usando escenarios de plantilla",
                "",
            ]

            # Generate scenarios_per_test scenarios based on test type
            for s in range(1, scenarios_per_test + 1):
                scenario_type = "Camino Feliz" if s == 1 else ("Negativo" if s == 2 else f"Caso Extremo {s-2}")
                scenario_type_en = "Happy Path" if s == 1 else ("Negative" if s == 2 else f"Edge Case {s-2}")

                if test_type == "FUNCTIONAL":
                    gherkin_lines.extend([
                        f"@{test_type.lower()} @{scenario_type_en.lower().replace(' ', '_')}",
                        f"Scenario {s}: {scenario_type} - {user_story.title[:50]}",
                        f"  Given el sistema está configurado para {user_story.id}",
                        f"  And todos los prerequisitos están cumplidos",
                        f"  When {'se realiza la acción válida' if s == 1 else 'se intenta una acción inválida' if s == 2 else 'se presentan condiciones de caso extremo'}",
                        f"  Then {'se logra el resultado esperado' if s == 1 else 'ocurre el manejo de errores apropiado' if s == 2 else 'se manejan correctamente las condiciones de frontera'}",
                        f"  And el estado del sistema {'se actualiza correctamente' if s == 1 else 'permanece consistente'}",
                        ""
                    ])
                elif test_type == "UI":
                    gherkin_lines.extend([
                        f"@{test_type.lower()} @{scenario_type_en.lower().replace(' ', '_')}",
                        f"Scenario {s}: UI {scenario_type} - {user_story.title[:50]}",
                        f"  Given el usuario está en la página relevante para {user_story.id}",
                        f"  And los elementos de UI están cargados",
                        f"  When el usuario {'realiza la acción principal de UI' if s == 1 else 'intenta una interacción de UI inválida' if s == 2 else 'prueba casos extremos de UI'}",
                        f"  Then {'la UI responde correctamente' if s == 1 else 'aparecen mensajes de validación apropiados' if s == 2 else 'la UI maneja casos extremos apropiadamente'}",
                        f"  And el estado visual se actualiza apropiadamente",
                        ""
                    ])
                elif test_type == "API":
                    gherkin_lines.extend([
                        f"@{test_type.lower()} @{scenario_type_en.lower().replace(' ', '_')}",
                        f"Scenario {s}: API {scenario_type} - {user_story.title[:50]}",
                        f"  Given el endpoint de API está disponible para {user_story.id}",
                        f"  And la autenticación es {'válida' if s == 1 else 'inválida' if s == 2 else 'caso extremo'}",
                        f"  When se realiza una petición API {'válida' if s == 1 else 'inválida' if s == 2 else 'de frontera'}",
                        f"  Then el código de respuesta es {'200 OK' if s == 1 else '400/401' if s == 2 else 'apropiado'}",
                        f"  And los datos de respuesta coinciden con el esquema esperado",
                        ""
                    ])
                else:
                    gherkin_lines.extend([
                        f"@{test_type.lower()} @{scenario_type_en.lower().replace(' ', '_')}",
                        f"Scenario {s}: {scenario_type} - {user_story.title[:50]}",
                        f"  Given el sistema está listo para probar {user_story.id}",
                        f"  And todas las precondiciones están satisfechas",
                        f"  When se ejecuta la acción de prueba",
                        f"  Then se verifica el resultado esperado",
                        f"  And no ocurren efectos secundarios inesperados",
                        ""
                    ])

            gherkin_content = "\n".join(gherkin_lines)

        suggested_test_cases.append({
            "suggested_id": f"TC-{story_id}-{str(i+1).zfill(3)}",
            "title": title,
            "description": f"{test_type} test scenarios for {user_story.id}",
            "test_type": test_type,
            "priority": "MEDIUM",
            "status": "NOT_RUN",
            "scenarios_count": len(test_scenarios) if test_scenarios else scenarios_per_test,
            "gherkin_content": gherkin_content,
            "can_edit": True,
            "can_delete": True
        })

    response = {
        "project_id": story_db.project_id,  # Include project_id for frontend
        "user_story_id": story_id,
        "user_story_title": user_story.title,
        "suggested_test_cases": suggested_test_cases,
        "total_suggested": len(suggested_test_cases),
        "can_edit_before_save": True,
        "can_add_more": True,
        "ai_generated": len(gherkin_scenarios) > 0
    }

    # Add warning if AI generation failed
    if use_ai and len(gherkin_scenarios) == 0:
        response["warning"] = {
            "message": "AI generation unavailable - using template scenarios",
            "reason": "Gemini API key may be invalid, expired, or blocked. Check backend logs for details.",
            "action": "Generate a new API key at: https://makersuite.google.com/app/apikey"
        }

    return response


@router.post("/test-cases/batch")
async def create_test_cases_batch(
    test_cases_data: dict,
    db: Session = Depends(get_db)
):
    """
    Create multiple test cases at once (after QA review)
    """
    print("=" * 80)
    print("🚀 BATCH CREATE TEST CASES - START")
    print(f"📦 Received data: {test_cases_data}")
    print("=" * 80)

    test_cases = test_cases_data.get("test_cases", [])
    user_story_id = test_cases_data.get("user_story_id")

    print(f"📊 Number of test cases to create: {len(test_cases)}")
    print(f"📝 User story ID: {user_story_id}")

    if not user_story_id:
        raise HTTPException(status_code=400, detail="user_story_id is required")

    # Get user story to inherit project_id
    user_story = db.query(UserStoryDB).filter(UserStoryDB.id == user_story_id).first()
    if not user_story:
        raise HTTPException(status_code=404, detail=f"User story {user_story_id} not found")

    print(f"✅ User story found: {user_story.id} - {user_story.title}")
    print(f"📁 Project ID: {user_story.project_id}")

    if not user_story.project_id:
        raise HTTPException(
            status_code=400,
            detail=f"User story {user_story_id} is not associated with a project"
        )

    created_test_cases = []

    # Get initial count ONCE before the loop to generate sequential IDs
    initial_count = db.query(TestCaseDB).filter(
        TestCaseDB.user_story_id == user_story_id
    ).count()
    print(f"📊 Initial test case count for story {user_story_id}: {initial_count}")

    for i, tc_data in enumerate(test_cases, 1):
        try:
            print(f"\n📝 Processing test case {i}/{len(test_cases)}...")
            print(f"   Data: {tc_data}")

            # Generate unique ID if not provided
            if "id" not in tc_data or not tc_data["id"]:
                # Use initial_count + current index to generate unique sequential IDs
                tc_data["id"] = f"TC-{user_story_id}-{str(initial_count + i).zfill(3)}"
                print(f"   Generated ID: {tc_data['id']}")

            # Save Gherkin content to file if provided
            gherkin_file_path = None
            if "gherkin_content" in tc_data:
                settings.ensure_directories()
                gherkin_file = f"{settings.output_dir}/{tc_data['id']}.feature"
                with open(gherkin_file, 'w') as f:
                    f.write(tc_data["gherkin_content"])
                gherkin_file_path = gherkin_file
                print(f"   ✅ Gherkin file saved: {gherkin_file}")

            # Parse enum values safely
            test_type_str = tc_data.get("test_type", "FUNCTIONAL")
            priority_str = tc_data.get("priority", "MEDIUM")
            status_str = tc_data.get("status", "NOT_RUN")

            print(f"   Enum values: type={test_type_str}, priority={priority_str}, status={status_str}")

            # Try to get enum by name (FUNCTIONAL), fallback to getting by value
            try:
                test_type = TestType[test_type_str]
            except KeyError:
                print(f"   ⚠️ TestType KeyError for '{test_type_str}', using fallback")
                # If name lookup fails, try value lookup
                test_type = next((t for t in TestType if t.name == test_type_str), TestType.FUNCTIONAL)

            try:
                priority = TestPriority[priority_str]
            except KeyError:
                print(f"   ⚠️ TestPriority KeyError for '{priority_str}', using fallback")
                priority = next((p for p in TestPriority if p.name == priority_str), TestPriority.MEDIUM)

            try:
                status = TestStatus[status_str]
            except KeyError:
                print(f"   ⚠️ TestStatus KeyError for '{status_str}', using fallback")
                status = next((s for s in TestStatus if s.name == status_str), TestStatus.NOT_RUN)

            print(f"   ✅ Enums resolved: {test_type}, {priority}, {status}")

            # Create test case
            db_test_case = TestCaseDB(
                id=tc_data["id"],
                project_id=user_story.project_id,  # Inherit from user story
                title=tc_data.get("title", "Untitled Test Case"),
                description=tc_data.get("description", ""),
                user_story_id=tc_data["user_story_id"],
                test_type=test_type,
                priority=priority,
                status=status,
                gherkin_file_path=gherkin_file_path,
                created_date=datetime.now()
            )

            db.add(db_test_case)
            created_test_cases.append(db_test_case)
            print(f"   ✅ Test case {tc_data['id']} added to session")

        except Exception as e:
            print(f"   ❌ ERROR processing test case {i}: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Error creating test case {i}: {str(e)}"
            )

    print(f"\n💾 Committing {len(created_test_cases)} test cases to database...")
    db.commit()
    print(f"✅ Commit successful!")

    print("=" * 80)
    print("🎉 BATCH CREATE TEST CASES - COMPLETE")
    print(f"✅ Created {len(created_test_cases)} test cases successfully")
    print("=" * 80)

    return {
        "message": f"Created {len(created_test_cases)} test cases successfully",
        "created_count": len(created_test_cases),
        "test_cases": [
            {
                "id": tc.id,
                "title": tc.title,
                "user_story_id": tc.user_story_id,
                "test_type": tc.test_type.value,
                "status": tc.status.value
            }
            for tc in created_test_cases
        ]
    }


@router.get("/test-cases/{test_id}")
async def get_test_case(test_id: str, db: Session = Depends(get_db)):
    """Get specific test case by ID"""
    tc = db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    return {
        "id": tc.id,
        "title": tc.title,
        "description": tc.description,
        "user_story_id": tc.user_story_id,
        "test_type": tc.test_type.value if tc.test_type else None,
        "priority": tc.priority.value if tc.priority else None,
        "status": tc.status.value if tc.status else None,
        "estimated_time_minutes": tc.estimated_time_minutes,
        "actual_time_minutes": tc.actual_time_minutes,
        "automated": tc.automated,
        "created_date": tc.created_date.isoformat() if tc.created_date else None,
        "last_executed": tc.last_executed.isoformat() if tc.last_executed else None,
        "executed_by": tc.executed_by,
        "gherkin_file_path": tc.gherkin_file_path,
    }


@router.put("/test-cases/{test_id}")
async def update_test_case(
    test_id: str,
    updates: dict,
    db: Session = Depends(get_db)
):
    """Update existing test case"""
    tc = db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    # Update allowed fields
    allowed_fields = [
        "title", "description", "test_type", "priority", "status",
        "estimated_time_minutes", "actual_time_minutes", "automated",
        "executed_by"
    ]

    for field, value in updates.items():
        if field in allowed_fields and value is not None:
            if field in ["test_type", "priority", "status"]:
                # Convert string to enum
                if field == "test_type":
                    value = TestType[value]
                elif field == "priority":
                    value = TestPriority[value]
                elif field == "status":
                    value = TestStatus[value]
            setattr(tc, field, value)

    db.commit()
    db.refresh(tc)

    return {
        "message": "Test case updated successfully",
        "test_case": {
            "id": tc.id,
            "title": tc.title,
            "description": tc.description,
            "test_type": tc.test_type.value if tc.test_type else None,
            "priority": tc.priority.value if tc.priority else None,
            "status": tc.status.value if tc.status else None,
        }
    }

# IMPORTANT: /batch endpoint MUST come BEFORE /{test_id} to avoid path matching conflicts
@router.delete("/test-cases/batch")
async def delete_test_cases_batch(
    test_case_ids: dict,
    db: Session = Depends(get_db)
):
    """Delete multiple test cases at once

    Accepts: {"test_case_ids": ["TC-001", "TC-002", ...]}
    """
    ids_to_delete = test_case_ids.get("test_case_ids", [])

    if not ids_to_delete:
        raise HTTPException(status_code=400, detail="No test case IDs provided")

    deleted_count = 0
    deleted_ids = []
    errors = []

    for test_id in ids_to_delete:
        try:
            tc = db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
            if tc:
                # Delete associated Gherkin file if exists
                if tc.gherkin_file_path and os.path.exists(tc.gherkin_file_path):
                    try:
                        os.remove(tc.gherkin_file_path)
                    except Exception as e:
                        print(f"Warning: Could not delete Gherkin file {tc.gherkin_file_path}: {e}")

                db.delete(tc)
                deleted_count += 1
                deleted_ids.append(test_id)
            else:
                errors.append(f"Test case {test_id} not found")
        except Exception as e:
            errors.append(f"Error deleting {test_id}: {str(e)}")

    db.commit()

    return {
        "message": f"Deleted {deleted_count} test case(s) successfully",
        "deleted_count": deleted_count,
        "deleted_ids": deleted_ids,
        "errors": errors if errors else None
    }


@router.delete("/test-cases/{test_id}")
async def delete_test_case(test_id: str, db: Session = Depends(get_db)):
    """Delete single test case"""
    tc = db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    # Delete associated Gherkin file if exists
    if tc.gherkin_file_path and os.path.exists(tc.gherkin_file_path):
        os.remove(tc.gherkin_file_path)

    db.delete(tc)
    db.commit()

    return {
        "message": "Test case deleted successfully",
        "deleted_id": test_id
    }


@router.get("/test-cases/{test_id}/gherkin")
async def get_gherkin_content(test_id: str, db: Session = Depends(get_db)):
    """Get Gherkin file content for a test case"""
    tc = db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    if not tc.gherkin_file_path or not os.path.exists(tc.gherkin_file_path):
        raise HTTPException(status_code=404, detail="Gherkin file not found")

    with open(tc.gherkin_file_path, 'r') as f:
        content = f.read()

    return {
        "test_case_id": test_id,
        "file_path": tc.gherkin_file_path,
        "gherkin_content": content
    }


@router.put("/test-cases/{test_id}/gherkin")
async def update_gherkin_content(
    test_id: str,
    content_data: dict,
    db: Session = Depends(get_db)
):
    """Update Gherkin file content for a test case"""
    tc = db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    gherkin_content = content_data.get("gherkin_content", "")

    # Create file if doesn't exist
    if not tc.gherkin_file_path:
        settings.ensure_directories()
        tc.gherkin_file_path = f"{settings.output_dir}/{test_id}.feature"

    # Write content to file
    with open(tc.gherkin_file_path, 'w') as f:
        f.write(gherkin_content)

    db.commit()

    return {
        "message": "Gherkin content updated successfully",
        "file_path": tc.gherkin_file_path
    }

# ==================== Execution & Evidence ====================

# Incluir el router de ejecuciones
router.include_router(executions.router, tags=["Test Execution"])

# ==================== Test Plan Generation ====================
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
    # Validate and inherit project_id from user_story or test_case
    project_id = None

    if bug.user_story_id:
        user_story = db.query(UserStoryDB).filter(UserStoryDB.id == bug.user_story_id).first()
        if user_story:
            project_id = user_story.project_id
        else:
            raise HTTPException(status_code=404, detail=f"User story {bug.user_story_id} not found")

    if bug.test_case_id and not project_id:
        test_case = db.query(TestCaseDB).filter(TestCaseDB.id == bug.test_case_id).first()
        if test_case:
            project_id = test_case.project_id
        else:
            raise HTTPException(status_code=404, detail=f"Test case {bug.test_case_id} not found")

    if not project_id:
        raise HTTPException(
            status_code=400,
            detail="Bug must be associated with a user_story_id or test_case_id that belongs to a project"
        )

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
        project_id=project_id,  # Inherit from user_story or test_case
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


# ==================== Bug Report CRUD ====================
@router.get("/bugs")
async def get_bugs(
    project_id: str = Query(..., description="Filter bugs by project"),
    db: Session = Depends(get_db)
):
    """Get all bug reports for a project"""
    print(f"📋 GET /bugs - project_id: {project_id}")

    # Validate project exists
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Query bugs filtered by project_id
    bugs = db.query(BugReportDB).filter(
        BugReportDB.project_id == project_id
    ).all()

    print(f"✅ Found {len(bugs)} bugs for project {project_id}")

    # Convert to response format
    bugs_response = []
    for bug in bugs:
        bugs_response.append({
            "id": bug.id,
            "title": bug.title,
            "description": bug.description,
            "severity": bug.severity.value if bug.severity else "Medium",
            "priority": bug.priority.value if bug.priority else "Medium",
            "bug_type": bug.bug_type.value if bug.bug_type else "Functional",
            "status": bug.status.value if bug.status else "New",
            "environment": bug.environment,
            "browser": bug.browser,
            "os": bug.os,
            "version": bug.version,
            "user_story_id": bug.user_story_id,
            "test_case_id": bug.test_case_id,
            "reported_by": bug.reported_by,
            "assigned_to": bug.assigned_to,
            "verified_by": bug.verified_by,
            "reported_date": bug.reported_date.isoformat() if bug.reported_date else None,
            "assigned_date": bug.assigned_date.isoformat() if bug.assigned_date else None,
            "fixed_date": bug.fixed_date.isoformat() if bug.fixed_date else None,
            "verified_date": bug.verified_date.isoformat() if bug.verified_date else None,
            "closed_date": bug.closed_date.isoformat() if bug.closed_date else None,
            "document_path": bug.document_path,
        })

    return {"bugs": bugs_response}


@router.get("/bugs/{bug_id}")
async def get_bug_by_id(
    bug_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific bug report by ID"""
    print(f"📋 GET /bugs/{bug_id}")

    bug = db.query(BugReportDB).filter(BugReportDB.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail=f"Bug {bug_id} not found")

    return {
        "id": bug.id,
        "title": bug.title,
        "description": bug.description,
        "severity": bug.severity.value if bug.severity else "Medium",
        "priority": bug.priority.value if bug.priority else "Medium",
        "bug_type": bug.bug_type.value if bug.bug_type else "Functional",
        "status": bug.status.value if bug.status else "New",
        "environment": bug.environment,
        "browser": bug.browser,
        "os": bug.os,
        "version": bug.version,
        "user_story_id": bug.user_story_id,
        "test_case_id": bug.test_case_id,
        "reported_by": bug.reported_by,
        "assigned_to": bug.assigned_to,
        "verified_by": bug.verified_by,
        "reported_date": bug.reported_date.isoformat() if bug.reported_date else None,
        "assigned_date": bug.assigned_date.isoformat() if bug.assigned_date else None,
        "fixed_date": bug.fixed_date.isoformat() if bug.fixed_date else None,
        "verified_date": bug.verified_date.isoformat() if bug.verified_date else None,
        "closed_date": bug.closed_date.isoformat() if bug.closed_date else None,
        "document_path": bug.document_path,
    }


@router.post("/bugs")
async def create_bug(
    bug: BugReport,
    db: Session = Depends(get_db)
):
    """Create a new bug report (CRUD style endpoint)"""
    print(f"📝 POST /bugs - Creating bug: {bug.title}")

    # Validate and inherit project_id from user_story or test_case
    project_id = None

    if bug.user_story_id:
        user_story = db.query(UserStoryDB).filter(UserStoryDB.id == bug.user_story_id).first()
        if user_story:
            project_id = user_story.project_id
        else:
            raise HTTPException(status_code=404, detail=f"User story {bug.user_story_id} not found")

    if bug.test_case_id and not project_id:
        test_case = db.query(TestCaseDB).filter(TestCaseDB.id == bug.test_case_id).first()
        if test_case:
            project_id = test_case.project_id
        else:
            raise HTTPException(status_code=404, detail=f"Test case {bug.test_case_id} not found")

    if not project_id:
        raise HTTPException(
            status_code=400,
            detail="Bug must be associated with a user_story_id or test_case_id"
        )

    # Generate bug ID if not provided
    if not bug.id:
        bug_count = db.query(BugReportDB).filter(
            BugReportDB.project_id == project_id
        ).count()
        bug.id = f"BUG-{project_id}-{str(bug_count + 1).zfill(3)}"

    print(f"   Generated bug ID: {bug.id}")

    # Generate document
    settings.ensure_directories()
    bug_gen = BugReportGenerator()
    doc_path = bug_gen.generate_bug_report(bug, settings.output_dir)

    # Save to database
    db_bug = BugReportDB(
        id=bug.id,
        project_id=project_id,
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
    db.refresh(db_bug)

    print(f"✅ Bug {bug.id} created successfully")

    # Return in same format as GET
    return {
        "id": db_bug.id,
        "title": db_bug.title,
        "description": db_bug.description,
        "severity": db_bug.severity.value if db_bug.severity else "Medium",
        "priority": db_bug.priority.value if db_bug.priority else "Medium",
        "bug_type": db_bug.bug_type.value if db_bug.bug_type else "Functional",
        "status": db_bug.status.value if db_bug.status else "New",
        "environment": db_bug.environment,
        "browser": db_bug.browser,
        "os": db_bug.os,
        "version": db_bug.version,
        "user_story_id": db_bug.user_story_id,
        "test_case_id": db_bug.test_case_id,
        "reported_by": db_bug.reported_by,
        "assigned_to": db_bug.assigned_to,
        "verified_by": db_bug.verified_by,
        "reported_date": db_bug.reported_date.isoformat() if db_bug.reported_date else None,
        "document_path": db_bug.document_path,
    }


@router.put("/bugs/{bug_id}")
async def update_bug(
    bug_id: str,
    bug_data: dict,
    db: Session = Depends(get_db)
):
    """Update an existing bug report"""
    print(f"✏️  PUT /bugs/{bug_id}")
    print(f"   Update data: {bug_data}")

    bug = db.query(BugReportDB).filter(BugReportDB.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail=f"Bug {bug_id} not found")

    # Update allowed fields
    allowed_fields = [
        "title", "description", "severity", "priority", "bug_type", "status",
        "environment", "browser", "os", "version",
        "assigned_to", "verified_by",
        "assigned_date", "fixed_date", "verified_date", "closed_date"
    ]

    for field, value in bug_data.items():
        if field in allowed_fields and value is not None:
            # Handle enum fields
            if field in ["severity", "priority", "bug_type", "status"]:
                try:
                    if field == "severity":
                        from backend.models import BugSeverity
                        value = BugSeverity[value] if isinstance(value, str) and value.isupper() else BugSeverity(value)
                    elif field == "priority":
                        from backend.models import BugPriority
                        value = BugPriority[value] if isinstance(value, str) and value.isupper() else BugPriority(value)
                    elif field == "bug_type":
                        from backend.models import BugType
                        value = BugType[value] if isinstance(value, str) and value.isupper() else BugType(value)
                    elif field == "status":
                        from backend.models import BugStatus
                        value = BugStatus[value] if isinstance(value, str) and value.isupper() else BugStatus(value)
                except (KeyError, ValueError) as e:
                    print(f"   ⚠️  Enum conversion error for {field}={value}: {e}")
                    continue

            setattr(bug, field, value)
            print(f"   Updated {field} = {value}")

    db.commit()
    db.refresh(bug)

    print(f"✅ Bug {bug_id} updated successfully")

    # Return updated bug
    return {
        "id": bug.id,
        "title": bug.title,
        "description": bug.description,
        "severity": bug.severity.value if bug.severity else "Medium",
        "priority": bug.priority.value if bug.priority else "Medium",
        "bug_type": bug.bug_type.value if bug.bug_type else "Functional",
        "status": bug.status.value if bug.status else "New",
        "environment": bug.environment,
        "browser": bug.browser,
        "os": bug.os,
        "version": bug.version,
        "user_story_id": bug.user_story_id,
        "test_case_id": bug.test_case_id,
        "reported_by": bug.reported_by,
        "assigned_to": bug.assigned_to,
        "verified_by": bug.verified_by,
        "reported_date": bug.reported_date.isoformat() if bug.reported_date else None,
        "assigned_date": bug.assigned_date.isoformat() if bug.assigned_date else None,
        "fixed_date": bug.fixed_date.isoformat() if bug.fixed_date else None,
        "verified_date": bug.verified_date.isoformat() if bug.verified_date else None,
        "closed_date": bug.closed_date.isoformat() if bug.closed_date else None,
        "document_path": bug.document_path,
    }


@router.delete("/bugs/{bug_id}")
async def delete_bug(
    bug_id: str,
    db: Session = Depends(get_db)
):
    """Delete a bug report"""
    print(f"🗑️  DELETE /bugs/{bug_id}")

    bug = db.query(BugReportDB).filter(BugReportDB.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail=f"Bug {bug_id} not found")

    # Delete document file if exists
    if bug.document_path and os.path.exists(bug.document_path):
        try:
            os.remove(bug.document_path)
            print(f"   Deleted document: {bug.document_path}")
        except Exception as e:
            print(f"   ⚠️  Failed to delete document: {e}")

    db.delete(bug)
    db.commit()

    print(f"✅ Bug {bug_id} deleted successfully")

    return {
        "message": f"Bug {bug_id} deleted successfully",
        "deleted_id": bug_id
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

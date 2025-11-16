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

from src.models import (
    Project, CreateProjectDTO, UpdateProjectDTO, ProjectStatus,
    UserStory, TestCase, BugReport, TestType, TestPriority, TestStatus
)
from src.parsers import FileParser
from src.generators import GherkinGenerator, TestPlanGenerator, BugReportGenerator
from src.integrations import GeminiClient
from src.database import get_db, init_db, ProjectDB, UserStoryDB, TestCaseDB, BugReportDB
from src.config import settings
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

        coverage = (total_tests / total_stories * 100) if total_stories > 0 else 0.0

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
    coverage = (total_tests / total_stories * 100) if total_stories > 0 else 0.0

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
    db: Session = Depends(get_db)
):
    """
    Upload and parse XLSX/CSV file with user stories
    """
    try:
        print(f"\n=== UPLOAD DEBUG ===")
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

        # Parse file
        print("Starting file parsing...")
        parser = FileParser()
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
        print(f"Database commit successful! Inserted: {len(saved_stories)}, Updated: {len(updated_stories)}")
        print("=== UPLOAD COMPLETE ===\n")

        return {
            "message": f"Successfully processed {len(result.user_stories)} user stories ({len(saved_stories)} new, {len(updated_stories)} updated)",
            "inserted": saved_stories,
            "updated": updated_stories,
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
async def get_user_stories(db: Session = Depends(get_db)):
    """Get all user stories from database"""
    stories = db.query(UserStoryDB).all()
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
            "acceptance_criteria": [],  # TODO: Fetch from relationship
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
async def get_test_cases(db: Session = Depends(get_db)):
    """Get all test cases"""
    test_cases = db.query(TestCaseDB).all()
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

    user_story = UserStory(
        id=story_db.id,
        title=story_db.title,
        description=story_db.description,
        priority=story_db.priority,
        status=story_db.status
    )

    # Generate multiple test cases with AI
    suggested_test_cases = []
    
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
        
        # For preview, we'll generate a simple structure
        # In reality, you'd call Gherkin generator here
        suggested_test_cases.append({
            "suggested_id": f"TC-{story_id}-{str(i+1).zfill(3)}",
            "title": title,
            "description": f"{test_type} test scenarios for {user_story.id}",
            "test_type": test_type,
            "priority": "MEDIUM",
            "status": "NOT_RUN",
            "scenarios_count": scenarios_per_test,
            "gherkin_content": f"# Placeholder Gherkin content for {title}\n# Will be generated when saved",
            "can_edit": True,
            "can_delete": True
        })
    
    return {
        "user_story_id": story_id,
        "user_story_title": user_story.title,
        "suggested_test_cases": suggested_test_cases,
        "total_suggested": len(suggested_test_cases),
        "can_edit_before_save": True,
        "can_add_more": True
    }


@router.post("/test-cases/batch")
async def create_test_cases_batch(
    test_cases_data: dict,
    db: Session = Depends(get_db)
):
    """
    Create multiple test cases at once (after QA review)
    """
    test_cases = test_cases_data.get("test_cases", [])
    created_test_cases = []
    
    for tc_data in test_cases:
        # Generate unique ID if not provided
        if "id" not in tc_data or not tc_data["id"]:
            story_id = tc_data.get("user_story_id")
            count = db.query(TestCaseDB).filter(
                TestCaseDB.user_story_id == story_id
            ).count()
            tc_data["id"] = f"TC-{story_id}-{str(count + 1).zfill(3)}"
        
        # Save Gherkin content to file if provided
        gherkin_file_path = None
        if "gherkin_content" in tc_data:
            settings.ensure_directories()
            gherkin_file = f"{settings.output_dir}/{tc_data['id']}.feature"
            with open(gherkin_file, 'w') as f:
                f.write(tc_data["gherkin_content"])
            gherkin_file_path = gherkin_file
        
        # Create test case
        db_test_case = TestCaseDB(
            id=tc_data["id"],
            title=tc_data.get("title", "Untitled Test Case"),
            description=tc_data.get("description", ""),
            user_story_id=tc_data["user_story_id"],
            test_type=TestType[tc_data.get("test_type", "FUNCTIONAL")],
            priority=TestPriority[tc_data.get("priority", "MEDIUM")],
            status=TestStatus[tc_data.get("status", "NOT_RUN")],
            gherkin_file_path=gherkin_file_path,
            created_date=datetime.now()
        )
        
        db.add(db_test_case)
        created_test_cases.append(db_test_case)
    
    db.commit()
    
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


@router.delete("/test-cases/{test_id}")
async def delete_test_case(test_id: str, db: Session = Depends(get_db)):
    """Delete test case"""
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
        "content": content
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
    
    gherkin_content = content_data.get("content", "")
    
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

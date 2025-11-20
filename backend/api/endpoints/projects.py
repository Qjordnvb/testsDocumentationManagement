from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json

from backend.database import get_db, ProjectDB, UserStoryDB, TestCaseDB, BugReportDB
from backend.models import CreateProjectDTO, UpdateProjectDTO, ProjectStatus

router = APIRouter()

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

        # Calculate test coverage: % of stories that have at least 1 test case
        # OLD (WRONG): coverage = min((total_tests / total_stories * 100), 100.0) - could give >100%
        # NEW (CORRECT): Count stories with at least one test case
        stories_with_tests = 0
        if total_stories > 0:
            # Get distinct user_story_ids that have test cases
            story_ids_with_tests = db.query(TestCaseDB.user_story_id).filter(
                TestCaseDB.project_id == project.id
            ).distinct().all()
            stories_with_tests = len(story_ids_with_tests)
            coverage = (stories_with_tests / total_stories) * 100
        else:
            coverage = 0.0

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

    # Calculate test coverage: % of stories that have at least 1 test case
    stories_with_tests = 0
    if total_stories > 0:
        # Get distinct user_story_ids that have test cases
        story_ids_with_tests = db.query(TestCaseDB.user_story_id).filter(
            TestCaseDB.project_id == project.id
        ).distinct().all()
        stories_with_tests = len(story_ids_with_tests)
        coverage = (stories_with_tests / total_stories) * 100
    else:
        coverage = 0.0

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

    # Calculate test coverage: % of stories that have at least 1 test case
    stories_with_tests = 0
    if total_stories > 0:
        # Get distinct user_story_ids that have test cases
        story_ids_with_tests = db.query(TestCaseDB.user_story_id).filter(
            TestCaseDB.project_id == project_id
        ).distinct().all()
        stories_with_tests = len(story_ids_with_tests)
        coverage = (stories_with_tests / total_stories) * 100
    else:
        coverage = 0.0

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
        "test_coverage": round(coverage, 2),
        "stories_by_status": stories_by_status,
        "timestamp": datetime.now().isoformat()
    }

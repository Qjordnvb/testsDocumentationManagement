from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
import os
from pathlib import Path

from backend.database import get_db, ProjectDB, UserStoryDB, TestCaseDB, BugReportDB
from backend.models import BugReport
from backend.generators import BugReportGenerator
from backend.config import settings

router = APIRouter()

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

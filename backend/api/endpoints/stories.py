from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pathlib import Path
import shutil
import json
from datetime import datetime

from backend.database import get_db, ProjectDB, UserStoryDB
from backend.models import UserStory, AcceptanceCriteria
from backend.parsers import FileParser
from backend.integrations import GeminiClient
from backend.config import settings
from backend.api.dependencies import get_gemini_client

router = APIRouter()

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


@router.put("/user-stories/{story_id}")
async def update_user_story(
    story_id: str,
    updates: dict,
    db: Session = Depends(get_db)
):
    """Update user story (including acceptance criteria)"""
    story = db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="User story not found")

    # Update fields if provided
    if "title" in updates:
        story.title = updates["title"]
    if "description" in updates:
        story.description = updates["description"]
    if "priority" in updates:
        story.priority = updates["priority"]
    if "status" in updates:
        story.status = updates["status"]
    if "epic" in updates:
        story.epic = updates["epic"]
    if "sprint" in updates:
        story.sprint = updates["sprint"]
    if "story_points" in updates:
        story.story_points = updates["story_points"]
    if "assigned_to" in updates:
        story.assigned_to = updates["assigned_to"]

    # Update acceptance criteria if provided
    if "acceptance_criteria" in updates:
        criteria = updates["acceptance_criteria"]
        story.acceptance_criteria = json.dumps(criteria) if criteria else None
        story.total_criteria = len(criteria) if criteria else 0
        story.completed_criteria = sum(1 for c in criteria if c.get("completed", False)) if criteria else 0
        total = len(criteria) if criteria else 0
        story.completion_percentage = (story.completed_criteria / total * 100) if total > 0 else 0.0

    story.updated_date = datetime.now()
    db.commit()
    db.refresh(story)

    return {
        "id": story.id,
        "title": story.title,
        "description": story.description,
        "priority": story.priority.value if story.priority else None,
        "status": story.status.value if story.status else None,
        "epic": story.epic,
        "sprint": story.sprint,
        "story_points": story.story_points,
        "assigned_to": story.assigned_to,
        "acceptance_criteria": json.loads(story.acceptance_criteria) if story.acceptance_criteria else [],
        "total_criteria": story.total_criteria,
        "completed_criteria": story.completed_criteria,
        "completion_percentage": story.completion_percentage,
        "updated_date": story.updated_date.isoformat() if story.updated_date else None
    }

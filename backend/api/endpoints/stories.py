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

        # Save to database (BATCH PROCESSING for 10-100x speedup)
        print(f"Saving {len(result.user_stories)} stories to database with BATCH processing...")

        # Step 1: Identify existing stories in ONE query
        print("  Step 1: Identifying existing stories...")
        all_story_ids = [s.id for s in result.user_stories]
        existing_stories_query = db.query(UserStoryDB).filter(
            UserStoryDB.id.in_(all_story_ids),
            UserStoryDB.project_id == project_id
        ).all()
        existing_ids = {s.id for s in existing_stories_query}

        # Step 2: Prepare batch data
        print("  Step 2: Preparing batch data...")
        new_stories_data = []
        update_stories_data = []
        now = datetime.now()

        for user_story in result.user_stories:
            story_data = {
                'id': user_story.id,
                'project_id': project_id,
                'title': user_story.title,
                'description': user_story.description,
                'priority': user_story.priority.value if hasattr(user_story.priority, 'value') else user_story.priority,
                'status': user_story.status.value if hasattr(user_story.status, 'value') else user_story.status,
                'epic': user_story.epic,
                'sprint': user_story.sprint,
                'story_points': user_story.story_points,
                'assigned_to': user_story.assigned_to,
                'acceptance_criteria': json.dumps(
                    [ac.dict() for ac in user_story.acceptance_criteria]
                ) if user_story.acceptance_criteria else None,
                'total_criteria': len(user_story.acceptance_criteria),
                'completed_criteria': sum(1 for ac in user_story.acceptance_criteria if ac.completed),
                'completion_percentage': user_story.get_completion_percentage(),
                'updated_date': now
            }

            if user_story.id in existing_ids:
                update_stories_data.append(story_data)
            else:
                story_data['created_date'] = now
                new_stories_data.append(story_data)

        # Step 3: Batch insert new stories (FAST!)
        if new_stories_data:
            print(f"  Step 3: Batch inserting {len(new_stories_data)} new stories...")
            db.bulk_insert_mappings(UserStoryDB, new_stories_data)

        # Step 4: Batch update existing stories (FAST!)
        if update_stories_data:
            print(f"  Step 4: Batch updating {len(update_stories_data)} existing stories...")
            db.bulk_update_mappings(UserStoryDB, update_stories_data)

        saved_stories = [s['id'] for s in new_stories_data]
        updated_stories = [s['id'] for s in update_stories_data]

        db.commit()
        print(f"✅ Database commit successful! Inserted: {len(saved_stories)}, Updated: {len(updated_stories)}")

        # Fetch the saved stories with all data (from THIS PROJECT only)
        all_story_ids = [s.id for s in result.user_stories]
        db_stories = db.query(UserStoryDB).filter(
            UserStoryDB.id.in_(all_story_ids),
            UserStoryDB.project_id == project_id
        ).all()

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
            "test_case_ids": [tc.id for tc in s.test_cases] if s.test_cases else []
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
        "completion_percentage": story.completion_percentage,
        "test_case_ids": [tc.id for tc in story.test_cases] if story.test_cases else []
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


# ==================== Async Excel Upload (Celery Background Processing) ====================

@router.post("/upload/async")
async def upload_file_async(
    file: UploadFile = File(...),
    project_id: str = Query(..., description="Project ID to associate user stories with"),
    db: Session = Depends(get_db)
):
    """
    Upload Excel file for ASYNCHRONOUS processing (non-blocking)
    Returns task_id for status polling

    Use this endpoint for large Excel files (>50 rows) to avoid blocking the UI
    """
    from backend.tasks import process_excel_task

    try:
        # Validate that project exists
        project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=404,
                detail=f"Project {project_id} not found. Please create the project first."
            )

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

        print(f"📤 File saved: {file_path} ({file_path.stat().st_size} bytes)")
        print(f"📦 Queueing Excel processing task for project {project_id}...")

        # Queue the background task
        task = process_excel_task.delay(
            file_path=str(file_path),
            project_id=project_id
        )

        print(f"✅ Task queued: {task.id}")

        return {
            "task_id": task.id,
            "project_id": project_id,
            "project_name": project.name,
            "file_name": file.filename,
            "status": "queued",
            "message": "Excel file is being processed in background",
            "status_url": f"/api/v1/upload/status/{task.id}"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Upload error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )


@router.get("/upload/status/{task_id}")
async def get_upload_status(task_id: str):
    """
    Get status of background Excel processing task

    Returns:
        - status: "pending" | "processing" | "completed" | "failed"
        - progress: 0-100
        - result: Complete result when status=completed
    """
    from backend.celery_app import celery_app

    task = celery_app.AsyncResult(task_id)

    if task.state == 'PENDING':
        return {
            "task_id": task_id,
            "status": "pending",
            "progress": 0,
            "message": "Task is waiting to start..."
        }

    elif task.state == 'PROGRESS':
        # Task is running, return progress info
        info = task.info or {}
        return {
            "task_id": task_id,
            "status": "processing",
            "progress": info.get('progress', 0),
            "message": info.get('status', 'Processing Excel file...'),
            "project_id": info.get('project_id'),
            "project_name": info.get('project_name'),
            "current_story": info.get('current_story'),
            "total_stories": info.get('total_stories'),
            "inserted": info.get('inserted'),
            "updated": info.get('updated')
        }

    elif task.state == 'SUCCESS':
        # Task completed successfully
        result = task.result
        return {
            "task_id": task_id,
            "status": "completed",
            "progress": 100,
            "message": "Excel file processed successfully",
            "result": result
        }

    elif task.state == 'FAILURE':
        # Task failed
        error_info = str(task.info) if task.info else "Unknown error"
        return {
            "task_id": task_id,
            "status": "failed",
            "progress": 0,
            "message": "Excel processing failed",
            "error": error_info
        }

    else:
        # Unknown state
        return {
            "task_id": task_id,
            "status": "unknown",
            "progress": 0,
            "message": f"Unknown task state: {task.state}"
        }

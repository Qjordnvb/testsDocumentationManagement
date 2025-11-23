"""
User Story management endpoints

Handles all user story-related operations including file upload, retrieval, and updates.

Refactored to use StoryService following SOLID principles:
- Thin controllers: Only handle HTTP concerns (requests, responses, status codes)
- Business logic delegated to StoryService
- Testability: Service layer can be unit tested independently
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pathlib import Path

from backend.database import get_db
from backend.services.story_service import StoryService
from backend.integrations import GeminiClient
from backend.api.dependencies import get_gemini_client

router = APIRouter()


def get_story_service_dependency(
    db: Session = Depends(get_db),
    gemini_client: GeminiClient = Depends(get_gemini_client)
) -> StoryService:
    """Dependency injection for StoryService"""
    return StoryService(db, gemini_client)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    project_id: str = Query(..., description="Project ID to associate user stories with"),
    service: StoryService = Depends(get_story_service_dependency)
):
    """
    Upload and parse XLSX/CSV file with user stories

    Args:
        file: Uploaded file (Excel or CSV)
        project_id: Project ID to associate stories with
        service: Injected StoryService instance

    Returns:
        Processing results with user stories

    Raises:
        HTTPException: If validation fails or processing errors
    """
    try:
        # Validate file type
        print(f"Received file: {file.filename}")
        print(f"Content type: {file.content_type}")

        service.validate_file_type(file.filename)

        # Save uploaded file
        file_path = service.save_uploaded_file(file, file.filename)

        # Process file and save stories
        result = await service.upload_and_process_file(
            file_path=file_path,
            original_filename=file.filename,
            project_id=project_id
        )

        return result

    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg
            )
        elif "Unsupported file type" in error_msg or "Parse errors" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing file: {error_msg}"
            )

    except Exception as e:
        print(f"\n!!! UPLOAD ERROR !!!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        import traceback
        print(f"Traceback:\n{traceback.format_exc()}")
        print("===================\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )


@router.get("/user-stories")
async def get_user_stories(
    project_id: str = Query(..., description="Filter user stories by project ID"),
    service: StoryService = Depends(get_story_service_dependency)
):
    """
    Get all user stories for a specific project

    Args:
        project_id: Project ID to filter stories
        service: Injected StoryService instance

    Returns:
        List of user stories

    Raises:
        HTTPException: If project not found
    """
    print(f"📋 GET /user-stories - Project: {project_id}")

    try:
        user_stories_list = service.get_stories_by_project(project_id)

        print(f"   Found {len(user_stories_list)} user stories")

        return {"user_stories": user_stories_list}

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/user-stories/{story_id}")
async def get_user_story(
    story_id: str,
    service: StoryService = Depends(get_story_service_dependency)
):
    """
    Get specific user story by ID

    Args:
        story_id: User story ID
        service: Injected StoryService instance

    Returns:
        User story details

    Raises:
        HTTPException: If story not found
    """
    print(f"🔍 GET /user-stories/{story_id}")

    try:
        story = service.get_story_by_id(story_id)

        print(f"   ✅ Story found: {story['title']}")

        return story

    except ValueError as e:
        print(f"   ❌ Story not found: {story_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/user-stories/{story_id}")
async def update_user_story(
    story_id: str,
    updates: dict,
    service: StoryService = Depends(get_story_service_dependency)
):
    """
    Update user story (including acceptance criteria)

    Args:
        story_id: User story ID to update
        updates: Dictionary with fields to update
        service: Injected StoryService instance

    Returns:
        Updated user story

    Raises:
        HTTPException: If story not found
    """
    print(f"✏️  PUT /user-stories/{story_id}")
    print(f"   Update data: {updates}")

    try:
        updated_story = service.update_story(story_id, updates)

        print(f"   ✅ Story updated: {story_id}")

        return updated_story

    except ValueError as e:
        print(f"   ❌ Update failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# ==================== Async Excel Upload (Celery Background Processing) ====================

@router.post("/upload/async")
async def upload_file_async(
    file: UploadFile = File(...),
    project_id: str = Query(..., description="Project ID to associate user stories with"),
    service: StoryService = Depends(get_story_service_dependency)
):
    """
    Upload Excel file for ASYNCHRONOUS processing (non-blocking)
    Returns task_id for status polling

    Use this endpoint for large Excel files (>50 rows) to avoid blocking the UI

    Args:
        file: Uploaded file (Excel or CSV)
        project_id: Project ID to associate stories with
        service: Injected StoryService instance

    Returns:
        Task info with task_id

    Raises:
        HTTPException: If validation fails or upload errors
    """
    from backend.tasks import process_excel_task

    try:
        # Validate project exists
        project = service.validate_project_exists(project_id)

        # Validate file extension
        service.validate_file_type(file.filename)

        # Save uploaded file
        file_path = service.save_uploaded_file(file, file.filename)

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

    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )

    except ImportError:
        # Celery not configured
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Background task queue not configured"
        )

    except Exception as e:
        print(f"❌ Upload error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )


@router.get("/upload/status/{task_id}")
async def get_upload_status(task_id: str):
    """
    Get status of background Excel processing task

    Args:
        task_id: Celery task ID

    Returns:
        Task status info

    Note: This endpoint doesn't use StoryService since it's only checking Celery task status
    """
    try:
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

    except ImportError:
        # Celery not configured
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Background task queue not configured"
        )

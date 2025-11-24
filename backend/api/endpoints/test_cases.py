"""
Test Case management endpoints

Handles all test case-related operations including generation, retrieval, updates, and deletion.

Refactored to use TestCaseService following SOLID principles:
- Thin controllers: Only handle HTTP concerns (requests, responses, status codes)
- Business logic delegated to TestCaseService
- Testability: Service layer can be unit tested independently
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db, UserDB
from backend.services.test_case_service import TestCaseService
from backend.integrations import GeminiClient
from backend.api.dependencies import get_gemini_client, get_current_user

router = APIRouter()


def get_test_case_service_dependency(
    db: Session = Depends(get_db),
    gemini_client: GeminiClient = Depends(get_gemini_client)
) -> TestCaseService:
    """Dependency injection for TestCaseService"""
    return TestCaseService(db, gemini_client)


@router.post("/generate-test-cases/{story_id}")
async def generate_test_cases(
    story_id: str,
    use_ai: bool = True,
    num_scenarios: int = 3,
    service: TestCaseService = Depends(get_test_case_service_dependency)
):
    """
    Generate test cases with Gherkin scenarios for a user story

    Args:
        story_id: User story ID
        use_ai: Whether to use AI generation
        num_scenarios: Number of scenarios to generate
        service: Injected TestCaseService instance

    Returns:
        Generated test cases info

    Raises:
        HTTPException: If user story not found or generation errors
    """
    try:
        result = service.generate_test_cases(
            story_id=story_id,
            use_ai=use_ai,
            num_scenarios=num_scenarios
        )
        return result

    except ValueError as e:
        error_msg = str(e)
        # Handle API key errors
        if "API key" in error_msg or "API error" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg
            )
        # Handle validation errors
        elif "not found" in error_msg or "not associated" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND if "not found" in error_msg else status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error generating test scenarios: {error_msg}"
            )


@router.get("/test-cases")
async def get_test_cases(
    project_id: str = Query(..., description="Filter test cases by project ID"),
    service: TestCaseService = Depends(get_test_case_service_dependency)
):
    """
    Get all test cases for a specific project

    Args:
        project_id: Project ID to filter test cases
        service: Injected TestCaseService instance

    Returns:
        List of test cases

    Raises:
        HTTPException: If project not found
    """
    print(f"📋 GET /test-cases - Project: {project_id}")

    try:
        test_cases = service.get_test_cases_by_project(project_id)

        print(f"   Found {len(test_cases)} test cases")

        return {"test_cases": test_cases}

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/generate-test-cases/{story_id}/preview")
async def preview_test_cases(
    story_id: str,
    num_test_cases: int = Query(default=5, ge=1, le=10),
    scenarios_per_test: int = Query(default=3, ge=1, le=10),
    test_types: List[str] = Query(default=["FUNCTIONAL", "UI"]),
    use_ai: bool = True,
    service: TestCaseService = Depends(get_test_case_service_dependency)
):
    """
    Generate test case suggestions (PREVIEW - does NOT save to DB)
    QA will review before saving

    Args:
        story_id: User story ID
        num_test_cases: Number of test cases to generate
        scenarios_per_test: Number of scenarios per test case
        test_types: List of test types
        use_ai: Whether to use AI generation
        service: Injected TestCaseService instance

    Returns:
        Suggested test cases for review

    Raises:
        HTTPException: If user story not found or generation errors
    """
    print(f"🔍 POST /generate-test-cases/{story_id}/preview")
    print(f"   num_test_cases: {num_test_cases}")
    print(f"   scenarios_per_test: {scenarios_per_test}")
    print(f"   test_types: {test_types}")
    print(f"   use_ai: {use_ai}")

    try:
        result = service.preview_test_cases(
            story_id=story_id,
            num_test_cases=num_test_cases,
            scenarios_per_test=scenarios_per_test,
            test_types=test_types,
            use_ai=use_ai
        )

        print(f"   ✅ Generated {result['total_suggested']} test case suggestions")
        if result.get('warning'):
            print(f"   ⚠️  Warning: {result['warning']['message']}")

        return result

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "not found" in str(e) else status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/test-cases/batch", status_code=status.HTTP_201_CREATED)
async def create_test_cases_batch(
    test_cases_data: dict,
    current_user: UserDB = Depends(get_current_user),
    service: TestCaseService = Depends(get_test_case_service_dependency)
):
    """
    Create multiple test cases at once (after QA review)

    Args:
        test_cases_data: Dictionary with test_cases list, user_story_id, and project_id
        current_user: Current authenticated user (for organization validation)
        service: Injected TestCaseService instance

    Returns:
        Created test cases info

    Raises:
        HTTPException: If validation fails or creation errors
    """
    test_cases = test_cases_data.get("test_cases", [])
    user_story_id = test_cases_data.get("user_story_id")
    project_id = test_cases_data.get("project_id")

    if not user_story_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_story_id is required"
        )

    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="project_id is required"
        )

    try:
        result = service.create_test_cases_batch(
            test_cases_data=test_cases,
            user_story_id=user_story_id,
            project_id=project_id,
            organization_id=current_user.organization_id
        )

        return result

    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg
            )
        elif "not associated" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )


@router.get("/test-cases/{test_id}")
async def get_test_case(
    test_id: str,
    service: TestCaseService = Depends(get_test_case_service_dependency)
):
    """
    Get specific test case by ID

    Args:
        test_id: Test case ID
        service: Injected TestCaseService instance

    Returns:
        Test case details

    Raises:
        HTTPException: If test case not found
    """
    print(f"🔍 GET /test-cases/{test_id}")

    try:
        test_case = service.get_test_case_by_id(test_id)

        print(f"   ✅ Test case found: {test_case['title']}")

        return test_case

    except ValueError as e:
        print(f"   ❌ Test case not found: {test_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/test-cases/{test_id}")
async def update_test_case(
    test_id: str,
    updates: dict,
    service: TestCaseService = Depends(get_test_case_service_dependency)
):
    """
    Update existing test case

    Args:
        test_id: Test case ID to update
        updates: Dictionary with fields to update
        service: Injected TestCaseService instance

    Returns:
        Updated test case

    Raises:
        HTTPException: If test case not found
    """
    print(f"✏️  PUT /test-cases/{test_id}")
    print(f"   Update data: {updates}")

    try:
        result = service.update_test_case(test_id, updates)

        print(f"   ✅ Test case updated: {test_id}")

        return result

    except ValueError as e:
        print(f"   ❌ Update failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# IMPORTANT: /batch endpoint MUST come BEFORE /{test_id} to avoid path matching conflicts
@router.delete("/test-cases/batch")
async def delete_test_cases_batch(
    test_case_ids: dict,
    service: TestCaseService = Depends(get_test_case_service_dependency)
):
    """
    Delete multiple test cases at once

    Args:
        test_case_ids: Dictionary with test_case_ids list
        service: Injected TestCaseService instance

    Returns:
        Deletion results

    Raises:
        HTTPException: If validation fails
    """
    ids_to_delete = test_case_ids.get("test_case_ids", [])

    print(f"🗑️  DELETE /test-cases/batch")
    print(f"   IDs to delete: {ids_to_delete}")

    try:
        result = service.delete_test_cases_batch(ids_to_delete)

        print(f"   ✅ Deleted {result['deleted_count']} test case(s)")
        if result.get('errors'):
            print(f"   ⚠️  Errors: {result['errors']}")

        return result

    except ValueError as e:
        print(f"   ❌ Batch delete failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/test-cases/{test_id}")
async def delete_test_case(
    test_id: str,
    service: TestCaseService = Depends(get_test_case_service_dependency)
):
    """
    Delete single test case

    Args:
        test_id: Test case ID to delete
        service: Injected TestCaseService instance

    Returns:
        Success message

    Raises:
        HTTPException: If test case not found
    """
    print(f"🗑️  DELETE /test-cases/{test_id}")

    deleted = service.delete_test_case(test_id)

    if not deleted:
        print(f"   ❌ Test case not found: {test_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )

    print(f"   ✅ Test case deleted: {test_id}")

    return {
        "message": "Test case deleted successfully",
        "deleted_id": test_id
    }


@router.get("/test-cases/{test_id}/gherkin")
async def get_gherkin_content(
    test_id: str,
    service: TestCaseService = Depends(get_test_case_service_dependency)
):
    """
    Get Gherkin file content for a test case

    Args:
        test_id: Test case ID
        service: Injected TestCaseService instance

    Returns:
        Gherkin content

    Raises:
        HTTPException: If test case or file not found
    """
    print(f"📄 GET /test-cases/{test_id}/gherkin")

    try:
        result = service.get_gherkin_content(test_id)

        print(f"   ✅ Gherkin content found")

        return result

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/test-cases/{test_id}/gherkin")
async def update_gherkin_content(
    test_id: str,
    content_data: dict,
    service: TestCaseService = Depends(get_test_case_service_dependency)
):
    """
    Update Gherkin file content for a test case

    Args:
        test_id: Test case ID
        content_data: Dictionary with gherkin_content
        service: Injected TestCaseService instance

    Returns:
        Success message

    Raises:
        HTTPException: If test case not found
    """
    gherkin_content = content_data.get("gherkin_content", "")

    print(f"✏️  PUT /test-cases/{test_id}/gherkin")
    print(f"   Content length: {len(gherkin_content)} characters")

    try:
        result = service.update_gherkin_content(test_id, gherkin_content)

        print(f"   ✅ Gherkin content updated")

        return result

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# ==================== Background Test Generation (Celery Queue) ====================

@router.post("/generate-test-cases/{story_id}/queue")
async def queue_test_generation(
    story_id: str,
    project_id: str = Query(..., description="Project ID for multi-tenant isolation"),
    num_test_cases: int = Query(default=5, ge=1, le=10),
    scenarios_per_test: int = Query(default=3, ge=1, le=10),
    test_types: List[str] = Query(default=["FUNCTIONAL", "UI"]),
    use_ai: bool = True,
    service: TestCaseService = Depends(get_test_case_service_dependency)
):
    """
    Queue test generation task in background (non-blocking)
    Returns task_id for status polling

    Args:
        story_id: User story ID
        num_test_cases: Number of test cases to generate
        scenarios_per_test: Number of scenarios per test case
        test_types: List of test types
        use_ai: Whether to use AI generation
        service: Injected TestCaseService instance

    Returns:
        Task info with task_id

    Raises:
        HTTPException: If validation fails
    """
    from backend.tasks import generate_test_cases_task
    from backend.database.db import SessionLocal

    # Validate user story exists (use service's DB session)
    try:
        # We need to validate the story exists and belongs to the project
        # We can't use service directly here, so we'll do a quick validation
        from backend.database import UserStoryDB, ProjectDB

        # Get project to retrieve organization_id
        project = service.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )

        # Validate story exists in the specified project and organization
        story_db = service.db.query(UserStoryDB).filter(
            UserStoryDB.id == story_id,
            UserStoryDB.project_id == project_id,
            UserStoryDB.organization_id == project.organization_id
        ).first()
        if not story_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User story {story_id} not found in project {project_id}"
            )

        # Queue the task (runs in background)
        task = generate_test_cases_task.delay(
            story_id=story_id,
            project_id=project_id,
            organization_id=project.organization_id,
            num_test_cases=num_test_cases,
            scenarios_per_test=scenarios_per_test,
            test_types=test_types,
            use_ai=use_ai
        )

        print(f"📋 Queued test generation task: {task.id} for story {story_id}")

        return {
            "task_id": task.id,
            "story_id": story_id,
            "status": "queued",
            "message": "Test generation queued successfully",
            "status_url": f"/api/v1/generate-test-cases/status/{task.id}"
        }

    except ImportError:
        # Celery not configured
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Background task queue not configured"
        )


@router.get("/generate-test-cases/status/{task_id}")
async def get_task_status(task_id: str):
    """
    Get status of background test generation task

    Args:
        task_id: Celery task ID

    Returns:
        Task status info

    Note: This endpoint doesn't use TestCaseService since it's only checking Celery task status
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
                "status": "generating",
                "progress": info.get('progress', 0),
                "message": info.get('status', 'Generating test cases...'),
                "story_id": info.get('story_id'),
                "story_title": info.get('story_title')
            }

        elif task.state == 'SUCCESS':
            # Task completed successfully
            result = task.result
            return {
                "task_id": task_id,
                "status": "completed",
                "progress": 100,
                "message": "Test cases generated successfully",
                "result": result
            }

        elif task.state == 'FAILURE':
            # Task failed
            error_info = str(task.info) if task.info else "Unknown error"
            return {
                "task_id": task_id,
                "status": "failed",
                "progress": 0,
                "message": "Test generation failed",
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

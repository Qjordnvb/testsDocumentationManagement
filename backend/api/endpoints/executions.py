"""
Test Execution endpoints

Handles test execution operations including evidence upload and execution tracking.

Refactored to use ExecutionService following SOLID principles:
- Thin controllers: Only handle HTTP concerns (requests, responses, status codes)
- Business logic delegated to ExecutionService
- Testability: Service layer can be unit tested independently
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.services.execution_service import ExecutionService
from backend.models.test_case import TestExecutionCreate

router = APIRouter()


def get_execution_service_dependency(db: Session = Depends(get_db)) -> ExecutionService:
    """Dependency injection for ExecutionService"""
    return ExecutionService(db)


@router.post("/upload-evidence")
async def upload_evidence(
    project_id: str = Query(..., description="Project ID"),
    entity_type: str = Query(..., description="execution or bug"),
    file: UploadFile = File(...),
    service: ExecutionService = Depends(get_execution_service_dependency)
):
    """
    Upload execution evidence (screenshots, logs)
    Structure: /uploads/{project_id}/{entity_type}/{date}/{filename}

    Args:
        project_id: Project ID for organizing uploads
        entity_type: "execution" or "bug"
        file: Uploaded file
        service: Injected ExecutionService instance

    Returns:
        Upload result with file path and URL

    Raises:
        HTTPException: If file type not allowed or upload fails
    """
    try:
        result = service.upload_evidence(
            project_id=project_id,
            entity_type=entity_type,
            file=file.file,
            filename=file.filename,
            content_type=file.content_type
        )
        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )


@router.post("/test-executions")
async def create_test_execution(
    execution_data: TestExecutionCreate,
    service: ExecutionService = Depends(get_execution_service_dependency)
):
    """
    Save a detailed test execution result and update the parent Test Case.

    VALIDACIÓN AUTOMÁTICA (Pydantic):
    - scenario_name es REQUERIDO en todos los steps
    - keyword debe ser: Given, When, Then, And, But
    - step_index debe ser >= 0 y único
    - step_results debe tener al menos 1 item
    - text y scenario_name no pueden estar vacíos

    Si la validación falla, Pydantic retorna 422 automáticamente con detalles del error.

    Args:
        execution_data: Test execution data (Pydantic validates automatically)
        service: Injected ExecutionService instance

    Returns:
        Execution result with ID and status

    Raises:
        HTTPException: If test case not found or execution creation fails
    """
    try:
        result = service.create_test_execution(execution_data)
        return result

    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )

    except Exception as e:
        print(f"[ERROR] Unexpected error in create_test_execution: {str(e)}")
        print(f"[ERROR] Error type: {type(e).__name__}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/test-cases/{test_case_id}/executions")
async def get_test_case_executions(
    test_case_id: str,
    limit: int = Query(10, ge=1, le=50, description="Number of executions to return"),
    service: ExecutionService = Depends(get_execution_service_dependency)
):
    """
    Get execution history for a specific test case
    Returns most recent executions first

    Args:
        test_case_id: Test case ID
        limit: Number of executions to return (1-50)
        service: Injected ExecutionService instance

    Returns:
        Execution history with test case details

    Raises:
        HTTPException: If test case not found
    """
    print(f"[DEBUG] Fetching executions for test case: {test_case_id}, limit: {limit}")

    try:
        result = service.get_test_case_executions(test_case_id, limit)
        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/test-executions/{execution_id}/link-bugs")
async def link_bugs_to_execution(
    execution_id: int,
    payload: dict,
    service: ExecutionService = Depends(get_execution_service_dependency)
):
    """
    Link bugs that were created during test execution to the saved execution.
    This is called after saving an execution to associate bugs that were reported
    during the test run (with execution_id: 0) to the real execution_id.

    Args:
        execution_id: Execution ID to link bugs to
        payload: Dictionary with test_case_id and scenarios
        service: Injected ExecutionService instance

    Returns:
        Link result with bug IDs

    Raises:
        HTTPException: If execution not found
    """
    test_case_id = payload.get("test_case_id")
    scenarios = payload.get("scenarios", [])

    print(f"[DEBUG] Linking bugs for execution {execution_id}, test_case: {test_case_id}, scenarios: {scenarios}")

    try:
        result = service.link_bugs_to_execution(execution_id, test_case_id, scenarios)
        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/test-executions/{execution_id}")
async def get_execution_details(
    execution_id: int,
    service: ExecutionService = Depends(get_execution_service_dependency)
):
    """
    Get detailed information about a specific execution
    Includes all step results and evidence files

    Args:
        execution_id: Execution ID
        service: Injected ExecutionService instance

    Returns:
        Execution details with steps and evidence

    Raises:
        HTTPException: If execution not found
    """
    print(f"[DEBUG] Fetching execution details for ID: {execution_id}")

    try:
        result = service.get_execution_details(execution_id)
        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/evidence/{file_path:path}")
async def download_evidence(
    file_path: str,
    service: ExecutionService = Depends(get_execution_service_dependency)
):
    """
    Download or view evidence file (screenshot, log, etc.)

    Args:
        file_path: Relative path to evidence file
        service: Injected ExecutionService instance

    Returns:
        File response

    Raises:
        HTTPException: If file path invalid or file not found
    """
    print(f"[DEBUG] Requesting evidence file: {file_path}")

    try:
        full_path = service.validate_evidence_path(file_path)
        media_type = service.get_media_type_for_file(full_path)

        print(f"[DEBUG] Serving evidence file: {full_path.name}, type: {media_type}")

        return FileResponse(
            path=str(full_path),
            media_type=media_type,
            filename=full_path.name
        )

    except ValueError as e:
        error_msg = str(e)
        if "Invalid file path" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg
            )

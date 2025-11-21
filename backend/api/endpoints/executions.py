from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from typing import List, Optional
from pathlib import Path
import shutil
import os
import json
from datetime import datetime
from sqlalchemy.orm import Session
from pydantic import ValidationError

# Imports del proyecto (Asegúrate que las rutas sean correctas desde este nivel)
from backend.database import get_db, TestCaseDB, TestExecutionDB
from backend.models import TestStatus
from backend.models.test_case import TestExecutionCreate
from backend.config import settings

router = APIRouter()

# ==================== Execution & Evidence ====================

@router.post("/upload-evidence")
async def upload_evidence(
    project_id: str = Query(..., description="Project ID"),
    entity_type: str = Query(..., description="execution or bug"),
    file: UploadFile = File(...)
):
    """
    Upload execution evidence (screenshots, logs)
    Structure: /uploads/{project_id}/{entity_type}/{date}/{filename}
    """
    # 1. Validate File Type
    allowed_types = ["image/png", "image/jpeg", "image/gif", "video/mp4", "text/plain", "application/json"]
    if file.content_type not in allowed_types and not file.filename.endswith(('.log', '.txt', '.csv')):
         raise HTTPException(400, f"File type {file.content_type} not allowed")

    # 2. Create Directory Structure
    # uploads/PROJ-001/execution/20231119/
    date_str = datetime.now().strftime('%Y%m%d')
    save_dir = Path(settings.upload_dir) / project_id / entity_type / date_str

    # Ensure directory exists
    os.makedirs(save_dir, exist_ok=True)

    # 3. Save File with unique name
    timestamp = datetime.now().strftime('%H%M%S')
    safe_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
    file_path = save_dir / safe_filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return relative path for DB storage
        relative_path = f"uploads/{project_id}/{entity_type}/{date_str}/{safe_filename}"

        return {
            "filename": safe_filename,
            "file_path": relative_path,
            "url": f"/api/v1/download/{safe_filename}" # Helper url
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to save file: {str(e)}")


@router.post("/test-executions")
async def create_test_execution(
    execution_data: TestExecutionCreate,  # ✅ Pydantic valida automáticamente
    db: Session = Depends(get_db)
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
    """
    try:
        # Debug: Log received data
        print(f"[DEBUG] Received execution data for test case: {execution_data.test_case_id}")
        print(f"[DEBUG] Status: {execution_data.status}, Steps count: {len(execution_data.step_results)}")

        # 1. Validate Test Case exists
        test_case = db.query(TestCaseDB).filter(TestCaseDB.id == execution_data.test_case_id).first()
        if not test_case:
            print(f"[ERROR] Test Case {execution_data.test_case_id} not found in database")
            raise HTTPException(404, f"Test Case {execution_data.test_case_id} not found")

        print(f"[DEBUG] Test case found: {test_case.id} - {test_case.title}")

        # 2. Calculate Metrics
        total_steps = len(execution_data.step_results)
        passed_steps = sum(1 for s in execution_data.step_results if s.status == TestStatus.PASSED)
        failed_steps = sum(1 for s in execution_data.step_results if s.status == TestStatus.FAILED)

        print(f"[DEBUG] Metrics - Total: {total_steps}, Passed: {passed_steps}, Failed: {failed_steps}")

        # 3. Auto-determine Status if logic requires (Optional safeguard)
        final_status = execution_data.status
        if failed_steps > 0:
            final_status = TestStatus.FAILED
        elif passed_steps == total_steps and total_steps > 0:
            final_status = TestStatus.PASSED

        # 4. Serialize step_results with better error handling
        try:
            serialized_steps = json.dumps([s.dict() for s in execution_data.step_results])
            print(f"[DEBUG] Serialized {len(execution_data.step_results)} steps successfully")
        except Exception as e:
            print(f"[ERROR] Failed to serialize step_results: {str(e)}")
            raise HTTPException(500, f"Failed to serialize step results: {str(e)}")

        # 5. Create Execution Record
        print(f"[DEBUG] Creating execution record...")
        new_execution = TestExecutionDB(
            test_case_id=execution_data.test_case_id,
            executed_by=execution_data.executed_by,
            execution_date=datetime.now(),
            status=final_status,
            environment=execution_data.environment,
            version=execution_data.version,
            execution_time_minutes=round(execution_data.execution_time_seconds / 60, 2),
            passed_steps=passed_steps,
            failed_steps=failed_steps,
            total_steps=total_steps,
            step_results=serialized_steps,
            evidence_files=json.dumps(execution_data.evidence_files) if execution_data.evidence_files else None,
            notes=execution_data.notes,
            failure_reason=execution_data.failure_reason,
            bug_ids=",".join(execution_data.bug_ids) if execution_data.bug_ids else None
        )

        db.add(new_execution)
        print(f"[DEBUG] Execution record added to session")

        # 6. Update Parent Test Case
        test_case.last_executed = datetime.now()
        test_case.status = final_status
        test_case.executed_by = execution_data.executed_by
        # Update actual time if provided
        if new_execution.execution_time_minutes:
            test_case.actual_time_minutes = int(new_execution.execution_time_minutes)

        print(f"[DEBUG] Test case updated, committing to database...")
        db.commit()
        db.refresh(new_execution)

        print(f"[DEBUG] Execution saved successfully with ID: {new_execution.id}")

        return {
            "message": "Execution saved successfully",
            "execution_id": new_execution.id,
            "status": new_execution.status.value
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error in create_test_execution: {str(e)}")
        print(f"[ERROR] Error type: {type(e).__name__}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(500, f"Internal server error: {str(e)}")


# ==================== Get Execution History ====================

@router.get("/test-cases/{test_case_id}/executions")
async def get_test_case_executions(
    test_case_id: str,
    limit: int = Query(10, ge=1, le=50, description="Number of executions to return"),
    db: Session = Depends(get_db)
):
    """
    Get execution history for a specific test case
    Returns most recent executions first
    """
    print(f"[DEBUG] Fetching executions for test case: {test_case_id}, limit: {limit}")

    # Validate test case exists
    test_case = db.query(TestCaseDB).filter(TestCaseDB.id == test_case_id).first()
    if not test_case:
        raise HTTPException(404, f"Test case {test_case_id} not found")

    # Get executions ordered by date (most recent first)
    executions = db.query(TestExecutionDB).filter(
        TestExecutionDB.test_case_id == test_case_id
    ).order_by(TestExecutionDB.execution_date.desc()).limit(limit).all()

    print(f"[DEBUG] Found {len(executions)} executions for test case {test_case_id}")

    # Format response
    result = []
    for ex in executions:
        bug_ids_list = ex.bug_ids.split(",") if ex.bug_ids else []
        print(f"[DEBUG] Execution {ex.id}: bug_ids raw = '{ex.bug_ids}', parsed = {bug_ids_list}")

        result.append({
            "execution_id": ex.id,
            "executed_by": ex.executed_by,
            "execution_date": ex.execution_date.isoformat(),
            "status": ex.status.value,
            "environment": ex.environment,
            "version": ex.version,
            "execution_time_minutes": ex.execution_time_minutes,
            "passed_steps": ex.passed_steps,
            "failed_steps": ex.failed_steps,
            "total_steps": ex.total_steps,
            "evidence_count": len(json.loads(ex.evidence_files)) if ex.evidence_files else 0,
            "notes": ex.notes,
            "bug_ids": bug_ids_list
        })

    return {
        "test_case_id": test_case_id,
        "test_case_title": test_case.title,
        "executions": result,
        "total": len(result)
    }


@router.put("/test-executions/{execution_id}/link-bugs")
async def link_bugs_to_execution(
    execution_id: int,
    payload: dict,
    db: Session = Depends(get_db)
):
    """
    Link bugs that were created during test execution to the saved execution.
    This is called after saving an execution to associate bugs that were reported
    during the test run (with execution_id: 0) to the real execution_id.
    """
    from backend.database.models import BugReportDB

    test_case_id = payload.get("test_case_id")
    scenarios = payload.get("scenarios", [])

    print(f"[DEBUG] Linking bugs for execution {execution_id}, test_case: {test_case_id}, scenarios: {scenarios}")

    # Find execution
    execution = db.query(TestExecutionDB).filter(TestExecutionDB.id == execution_id).first()
    if not execution:
        raise HTTPException(404, f"Execution {execution_id} not found")

    # Find bugs for this test case and scenarios that don't have an execution_id yet (or have 0)
    bugs_to_link = db.query(BugReportDB).filter(
        BugReportDB.test_case_id == test_case_id,
        BugReportDB.scenario_name.in_(scenarios),
        (BugReportDB.execution_id == None) | (BugReportDB.execution_id == 0)
    ).all()

    print(f"[DEBUG] Found {len(bugs_to_link)} bugs to link")

    # Update each bug with the execution_id
    linked_bug_ids = []
    for bug in bugs_to_link:
        bug.execution_id = execution_id
        linked_bug_ids.append(bug.id)
        print(f"   → Linked bug {bug.id} to execution {execution_id}")

    # Update execution's bug_ids field
    if linked_bug_ids:
        existing_bugs = execution.bug_ids.split(",") if execution.bug_ids else []
        all_bugs = list(set(existing_bugs + linked_bug_ids))  # Remove duplicates
        execution.bug_ids = ",".join(all_bugs)
        print(f"   ✅ Updated execution {execution_id} bug_ids: {execution.bug_ids}")

    db.commit()

    return {
        "message": f"Linked {len(linked_bug_ids)} bugs to execution {execution_id}",
        "linked_bugs": linked_bug_ids,
        "execution_bug_ids": execution.bug_ids.split(",") if execution.bug_ids else []
    }


@router.get("/test-executions/{execution_id}")
async def get_execution_details(
    execution_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific execution
    Includes all step results and evidence files
    """
    print(f"[DEBUG] Fetching execution details for ID: {execution_id}")

    execution = db.query(TestExecutionDB).filter(
        TestExecutionDB.id == execution_id
    ).first()

    if not execution:
        raise HTTPException(404, f"Execution {execution_id} not found")

    # Parse JSON fields
    step_results = json.loads(execution.step_results) if execution.step_results else []
    evidence_files = json.loads(execution.evidence_files) if execution.evidence_files else []

    print(f"[DEBUG] Execution {execution_id} has {len(step_results)} steps and {len(evidence_files)} evidence files")

    return {
        "execution_id": execution.id,
        "test_case_id": execution.test_case_id,
        "executed_by": execution.executed_by,
        "execution_date": execution.execution_date.isoformat(),
        "status": execution.status.value,
        "environment": execution.environment,
        "version": execution.version,
        "execution_time_minutes": execution.execution_time_minutes,
        "passed_steps": execution.passed_steps,
        "failed_steps": execution.failed_steps,
        "total_steps": execution.total_steps,
        "step_results": step_results,
        "evidence_files": evidence_files,
        "notes": execution.notes,
        "failure_reason": execution.failure_reason,
        "bug_ids": execution.bug_ids.split(",") if execution.bug_ids else []
    }


@router.get("/evidence/{file_path:path}")
async def download_evidence(file_path: str):
    """
    Download or view evidence file (screenshot, log, etc.)
    """
    print(f"[DEBUG] Requesting evidence file: {file_path}")

    # Security: Ensure path doesn't escape uploads directory
    if ".." in file_path or file_path.startswith("/"):
        raise HTTPException(400, "Invalid file path")

    # Construct full path
    full_path = Path(file_path)

    if not full_path.exists():
        print(f"[ERROR] Evidence file not found: {full_path}")
        raise HTTPException(404, f"Evidence file not found: {file_path}")

    # Determine media type based on extension
    media_type = "application/octet-stream"
    extension = full_path.suffix.lower()

    if extension in [".png", ".jpg", ".jpeg", ".gif"]:
        media_type = f"image/{extension[1:]}"
    elif extension == ".mp4":
        media_type = "video/mp4"
    elif extension in [".txt", ".log"]:
        media_type = "text/plain"
    elif extension == ".json":
        media_type = "application/json"

    print(f"[DEBUG] Serving evidence file: {full_path.name}, type: {media_type}")

    return FileResponse(
        path=str(full_path),
        media_type=media_type,
        filename=full_path.name
    )

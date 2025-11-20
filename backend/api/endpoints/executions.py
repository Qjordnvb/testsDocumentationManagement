from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from typing import List, Optional
from pathlib import Path
import shutil
import os
import json
from datetime import datetime
from sqlalchemy.orm import Session

# Imports del proyecto (Asegúrate que las rutas sean correctas desde este nivel)
from backend.database import get_db, TestCaseDB, TestExecutionDB
from backend.models import TestStatus
from backend.models.test_case import TestExecutionCreate, TestExecutionCreate
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
    execution_data: TestExecutionCreate,
    db: Session = Depends(get_db)
):
    """
    Save a detailed test execution result and update the parent Test Case
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
            evidence_files=json.dumps(execution_data.evidence_files),
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

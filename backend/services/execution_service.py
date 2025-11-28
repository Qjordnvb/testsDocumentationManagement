"""
Execution Service Layer

Handles business logic for test execution operations following SOLID principles:
- Single Responsibility: Only handles execution-related business logic
- Dependency Inversion: Depends on Session abstraction
- Open/Closed: Easy to extend with new execution operations
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path
import shutil
import os
import json

from backend.database import TestCaseDB, TestExecutionDB, BugReportDB
from backend.models import TestStatus
from backend.models.test_case import TestExecutionCreate
from backend.config import settings


class ExecutionService:
    """Service class for test execution business logic"""

    def __init__(self, db: Session):
        """Initialize service with database session"""
        self.db = db

    def upload_evidence(
        self,
        project_id: str,
        entity_type: str,
        file,
        filename: str,
        content_type: str
    ) -> Dict[str, Any]:
        """
        Upload execution evidence (screenshots, logs)

        Args:
            project_id: Project ID
            entity_type: "execution" or "bug"
            file: File object
            filename: Original filename
            content_type: File content type

        Returns:
            Dictionary with file info

        Raises:
            ValueError: If file type not allowed or upload fails
        """
        # Validate File Type
        allowed_types = [
            "image/png", "image/jpeg", "image/gif",
            "video/mp4", "text/plain", "application/json"
        ]
        if content_type not in allowed_types and not filename.endswith(('.log', '.txt', '.csv')):
            raise ValueError(f"File type {content_type} not allowed")

        # Create Directory Structure: uploads/PROJ-001/execution/20231119/
        date_str = datetime.now().strftime('%Y%m%d')
        save_dir = Path(settings.upload_dir) / project_id / entity_type / date_str

        # Ensure directory exists
        os.makedirs(save_dir, exist_ok=True)

        # Save File with unique name
        timestamp = datetime.now().strftime('%H%M%S')
        safe_filename = f"{timestamp}_{filename.replace(' ', '_')}"
        file_path = save_dir / safe_filename

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file, buffer)

            # Return relative path for DB storage
            relative_path = f"uploads/{project_id}/{entity_type}/{date_str}/{safe_filename}"

            return {
                "filename": safe_filename,
                "file_path": relative_path,
                "url": f"/api/v1/download/{safe_filename}"
            }
        except Exception as e:
            raise ValueError(f"Failed to save file: {str(e)}")

    def create_test_execution(self, execution_data: TestExecutionCreate) -> Dict[str, Any]:
        """
        Save a detailed test execution result and update the parent Test Case

        Args:
            execution_data: Test execution data (Pydantic validated)

        Returns:
            Dictionary with execution info

        Raises:
            ValueError: If test case not found or save fails
        """
        # Debug logging
        print(f"[DEBUG] Received execution data for test case: {execution_data.test_case_id}")
        print(f"[DEBUG] Status: {execution_data.status}, Steps count: {len(execution_data.step_results)}")

        # 1. Validate Test Case exists
        test_case = self.db.query(TestCaseDB).filter(TestCaseDB.id == execution_data.test_case_id).first()
        if not test_case:
            print(f"[ERROR] Test Case {execution_data.test_case_id} not found in database")
            raise ValueError(f"Test Case {execution_data.test_case_id} not found")

        print(f"[DEBUG] Test case found: {test_case.id} - {test_case.title}")

        # 2. Calculate Metrics
        total_steps = len(execution_data.step_results)
        passed_steps = sum(1 for s in execution_data.step_results if s.status == TestStatus.PASSED)
        failed_steps = sum(1 for s in execution_data.step_results if s.status == TestStatus.FAILED)

        print(f"[DEBUG] Metrics - Total: {total_steps}, Passed: {passed_steps}, Failed: {failed_steps}")

        # 3. Auto-determine Status
        final_status = execution_data.status
        if failed_steps > 0:
            final_status = TestStatus.FAILED
        elif passed_steps == total_steps and total_steps > 0:
            final_status = TestStatus.PASSED

        # 4. Serialize step_results
        try:
            serialized_steps = json.dumps([s.dict() for s in execution_data.step_results])
            print(f"[DEBUG] Serialized {len(execution_data.step_results)} steps successfully")
        except Exception as e:
            print(f"[ERROR] Failed to serialize step_results: {str(e)}")
            raise ValueError(f"Failed to serialize step results: {str(e)}")

        # 5. Create Execution Record with multi-tenant isolation
        print(f"[DEBUG] Creating execution record...")
        new_execution = TestExecutionDB(
            test_case_id=execution_data.test_case_id,
            project_id=test_case.project_id,  # CRITICAL: Multi-tenant composite FK
            organization_id=test_case.organization_id,  # CRITICAL: Multi-tenant composite FK
            executed_by=execution_data.executed_by,
            execution_date=datetime.now(),
            status=final_status,
            environment=execution_data.environment,
            # version=execution_data.version,  # Removed: Not in DB
            duration_seconds=execution_data.execution_time_seconds, # FIX: Map to duration_seconds
            # execution_time_minutes=round(execution_data.execution_time_seconds / 60, 2), # Removed: Not in DB
            # passed_steps=passed_steps,  # Removed: Not in DB
            # failed_steps=failed_steps,  # Removed: Not in DB
            # total_steps=total_steps,  # Removed: Not in DB
            steps_results=serialized_steps,
            # evidence_files=json.dumps(execution_data.evidence_files) if execution_data.evidence_files else None, # Removed: Not in DB
            notes=execution_data.notes,
            # failure_reason=execution_data.failure_reason, # Removed: Not in DB
            # bug_ids=",".join(execution_data.bug_ids) if execution_data.bug_ids else None # Removed: Not in DB
        )

        self.db.add(new_execution)
        print(f"[DEBUG] Execution record added to session")

        # 6. Update Parent Test Case
        test_case.last_executed = datetime.now()
        test_case.status = final_status
        test_case.executed_by = execution_data.executed_by
        if new_execution.duration_seconds:
            test_case.actual_time_minutes = int(new_execution.duration_seconds / 60)

        print(f"[DEBUG] Test case updated, committing to database...")
        self.db.commit()
        self.db.refresh(new_execution)

        print(f"[DEBUG] Execution saved successfully with ID: {new_execution.id}")

        return {
            "message": "Execution saved successfully",
            "execution_id": new_execution.id,
            "status": new_execution.status
        }

    def get_test_case_executions(self, test_case_id: str, limit: int = 10) -> Dict[str, Any]:
        """
        Get execution history for a specific test case

        Args:
            test_case_id: Test case ID
            limit: Number of executions to return (1-50)

        Returns:
            Dictionary with executions list

        Raises:
            ValueError: If test case not found
        """
        print(f"[DEBUG] Fetching executions for test case: {test_case_id}, limit: {limit}")

        # Validate test case exists
        test_case = self.db.query(TestCaseDB).filter(TestCaseDB.id == test_case_id).first()
        if not test_case:
            raise ValueError(f"Test case {test_case_id} not found")

        # Get executions ordered by date (most recent first)
        executions = self.db.query(TestExecutionDB).filter(
            TestExecutionDB.test_case_id == test_case_id
        ).order_by(TestExecutionDB.execution_date.desc()).limit(limit).all()

        print(f"[DEBUG] Found {len(executions)} executions for test case {test_case_id}")

        # Format response
        result = []
        for ex in executions:
            # Calculate metrics from steps_results JSON
            passed_steps = 0
            failed_steps = 0
            total_steps = 0
            evidence_count = 0

            if ex.steps_results:
                try:
                    steps = json.loads(ex.steps_results)
                    total_steps = len(steps)
                    passed_steps = sum(1 for s in steps if s.get('status') == 'PASSED')
                    failed_steps = sum(1 for s in steps if s.get('status') == 'FAILED')
                    evidence_count = sum(1 for s in steps if s.get('evidence_file'))
                except json.JSONDecodeError:
                    pass

            # Get bugs linked to this execution
            bugs = self.db.query(BugReportDB).filter(
                BugReportDB.execution_id == ex.id,
                BugReportDB.test_case_id == test_case_id
            ).all()
            bug_ids_list = [bug.id for bug in bugs]

            result.append({
                "execution_id": ex.id,
                "executed_by": ex.executed_by,
                "execution_date": ex.execution_date.isoformat(),
                "status": ex.status,
                "environment": ex.environment,
                "version": None,
                "execution_time_minutes": round(ex.duration_seconds / 60, 2) if ex.duration_seconds else 0,
                "duration_seconds": ex.duration_seconds,
                "passed_steps": passed_steps,
                "failed_steps": failed_steps,
                "total_steps": total_steps,
                "evidence_count": evidence_count,
                "notes": ex.notes,
                "bug_ids": bug_ids_list
            })

        return {
            "test_case_id": test_case_id,
            "test_case_title": test_case.title,
            "executions": result,
            "total": len(result)
        }

    def link_bugs_to_execution(
        self,
        execution_id: int,
        test_case_id: str,
        scenarios: List[str]
    ) -> Dict[str, Any]:
        """
        Link bugs to execution after saving

        Args:
            execution_id: Execution ID
            test_case_id: Test case ID
            scenarios: List of scenario names

        Returns:
            Dictionary with linked bugs info

        Raises:
            ValueError: If execution not found
        """
        print(f"[DEBUG] Linking bugs for execution {execution_id}, test_case: {test_case_id}, scenarios: {scenarios}")

        # Find execution
        execution = self.db.query(TestExecutionDB).filter(TestExecutionDB.id == execution_id).first()
        if not execution:
            raise ValueError(f"Execution {execution_id} not found")

        # Find bugs for this test case and scenarios that don't have an execution_id yet
        bugs_to_link = self.db.query(BugReportDB).filter(
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
        # if linked_bug_ids:
        #     existing_bugs = execution.bug_ids.split(",") if execution.bug_ids else []
        #     all_bugs = list(set(existing_bugs + linked_bug_ids))  # Remove duplicates
        #     execution.bug_ids = ",".join(all_bugs)
        #     print(f"   ✅ Updated execution {execution_id} bug_ids: {execution.bug_ids}")

        self.db.commit()

        return {
            "message": f"Linked {len(linked_bug_ids)} bugs to execution {execution_id}",
            "linked_bugs": linked_bug_ids,
            "execution_bug_ids": [] # execution.bug_ids.split(",") if execution.bug_ids else []
        }

    def get_execution_details(self, execution_id: int) -> Dict[str, Any]:
        """
        Get detailed information about a specific execution

        Args:
            execution_id: Execution ID

        Returns:
            Dictionary with execution details

        Raises:
            ValueError: If execution not found
        """
        print(f"[DEBUG] Fetching execution details for ID: {execution_id}")

        execution = self.db.query(TestExecutionDB).filter(
            TestExecutionDB.id == execution_id
        ).first()

        if not execution:
            raise ValueError(f"Execution {execution_id} not found")

        # Parse JSON fields
        step_results = json.loads(execution.steps_results) if execution.steps_results else []

        print(f"[DEBUG] Execution {execution_id} has {len(step_results)} steps")

        # Calculate metrics from step_results
        passed_steps = sum(1 for s in step_results if s.get('status') == 'PASSED')
        failed_steps = sum(1 for s in step_results if s.get('status') == 'FAILED')
        total_steps = len(step_results)
        evidence_count = sum(1 for s in step_results if s.get('evidence_file'))

        # Get evidence files from step_results
        evidence_files = [s.get('evidence_file') for s in step_results if s.get('evidence_file')]

        # Get bugs linked to this execution
        bugs = self.db.query(BugReportDB).filter(
            BugReportDB.execution_id == execution_id
        ).all()
        bug_ids_list = [bug.id for bug in bugs]

        return {
            "execution_id": execution.id,
            "test_case_id": execution.test_case_id,
            "executed_by": execution.executed_by,
            "execution_date": execution.execution_date.isoformat(),
            "status": execution.status,
            "environment": execution.environment,
            "version": None,
            "execution_time_minutes": round(execution.duration_seconds / 60, 2) if execution.duration_seconds else 0,
            "duration_seconds": execution.duration_seconds,
            "passed_steps": passed_steps,
            "failed_steps": failed_steps,
            "total_steps": total_steps,
            "step_results": step_results,
            "evidence_files": evidence_files,
            "evidence_count": evidence_count,
            "notes": execution.notes,
            "failure_reason": None,
            "bug_ids": bug_ids_list
        }

    def validate_evidence_path(self, file_path: str) -> Path:
        """
        Validate and resolve evidence file path

        Args:
            file_path: Relative file path

        Returns:
            Full file path

        Raises:
            ValueError: If path is invalid or file doesn't exist
        """
        print(f"[DEBUG] Requesting evidence file: {file_path}")

        # Security: Ensure path doesn't escape uploads directory
        if ".." in file_path or file_path.startswith("/"):
            raise ValueError("Invalid file path")

        # Construct full path - prepend 'evidence' base directory
        # This allows serving files from:
        # - uploads/PROJ-XXX/... (original bug attachments)
        # - execution/PROJ-XXX/... (test execution screenshots)
        # - comments/PROJ-XXX/BUG-XXX/... (comment attachments)
        full_path = Path(file_path)

        print(f"[DEBUG] Full path resolved to: {full_path}")
        print(f"[DEBUG] File exists: {full_path.exists()}")

        if not full_path.exists():
            print(f"[ERROR] Evidence file not found: {full_path}")
            raise ValueError(f"Evidence file not found: {file_path}")

        return full_path

    def get_media_type_for_file(self, file_path: Path) -> str:
        """
        Determine media type based on file extension

        Args:
            file_path: File path

        Returns:
            Media type string
        """
        media_type = "application/octet-stream"
        extension = file_path.suffix.lower()

        # Image formats
        if extension in [".png", ".jpg", ".jpeg", ".gif"]:
            media_type = f"image/{extension[1:]}"
        elif extension == ".webp":
            media_type = "image/webp"
        elif extension == ".svg":
            media_type = "image/svg+xml"
        elif extension == ".bmp":
            media_type = "image/bmp"
        # Video formats
        elif extension == ".mp4":
            media_type = "video/mp4"
        # Document formats
        elif extension == ".pdf":
            media_type = "application/pdf"
        # Text formats
        elif extension in [".txt", ".log"]:
            media_type = "text/plain"
        elif extension == ".json":
            media_type = "application/json"

        return media_type


def get_execution_service(db: Session) -> ExecutionService:
    """Dependency injection helper for FastAPI"""
    return ExecutionService(db)

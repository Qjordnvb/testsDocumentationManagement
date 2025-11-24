"""
Bug management endpoints

Handles all bug-related operations including creation, retrieval, updates, and deletion.

Refactored to use BugService following SOLID principles:
- Thin controllers: Only handle HTTP concerns (requests, responses, status codes)
- Business logic delegated to BugService
- Testability: Service layer can be unit tested independently
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.database import get_db, UserDB
from backend.models import BugReport
from backend.services.bug_service import BugService
from backend.generators import BugReportGenerator
from backend.config import settings
from backend.api.dependencies import get_current_user

router = APIRouter()


def get_bug_service_dependency(db: Session = Depends(get_db)) -> BugService:
    """Dependency injection for BugService"""
    return BugService(db)


@router.post("/generate-bug-template")
async def generate_bug_template():
    """
    Generate bug report template

    Returns:
        Template file path
    """
    settings.ensure_directories()
    bug_gen = BugReportGenerator()
    template_path = bug_gen.generate_template(settings.output_dir)

    return {
        "message": "Bug report template generated",
        "file": template_path
    }


@router.post("/create-bug-report", status_code=status.HTTP_201_CREATED)
async def create_bug_report(
    bug: BugReport,
    service: BugService = Depends(get_bug_service_dependency)
):
    """
    Create a new bug report with associated document (legacy endpoint)

    Args:
        bug: Bug report data
        service: Injected BugService instance

    Returns:
        Created bug with document path

    Raises:
        HTTPException: If project determination fails or creation errors
    """
    print(f"🐛 POST /create-bug-report - Title: {bug.title}")

    try:
        result = service.create_bug(bug)

        print(f"   ✅ Bug created: {result['id']} - {result['title']}")
        print(f"   📄 Document: {result['document_path']}")

        return {
            "message": "Bug report created successfully",
            "bug_id": result["id"],
            "document": result["document_path"]
        }

    except ValueError as e:
        print(f"   ❌ Bug creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"   ❌ Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/bugs")
async def get_bugs(
    project_id: str = Query(..., description="Project ID to filter bugs"),
    service: BugService = Depends(get_bug_service_dependency)
):
    """
    Get all bugs for a specific project

    Args:
        project_id: Project ID to filter
        service: Injected BugService instance

    Returns:
        List of bugs for the project

    Raises:
        HTTPException: If project not found
    """
    print(f"📋 GET /bugs - Project: {project_id}")

    try:
        bugs = service.get_bugs_by_project(project_id)

        print(f"   Found {len(bugs)} bugs")

        return {"bugs": bugs}

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/bugs/grouped")
async def get_bugs_grouped(
    project_id: str = Query(..., description="Project ID"),
    service: BugService = Depends(get_bug_service_dependency)
):
    """
    Get bugs grouped by test case and scenario

    Args:
        project_id: Project ID
        service: Injected BugService instance

    Returns:
        Bugs grouped by test case and scenario

    Raises:
        HTTPException: If project not found
    """
    print(f"📊 GET /bugs/grouped - Project: {project_id}")

    try:
        result = service.get_bugs_grouped(project_id)

        total_bugs = sum(g["total_bugs"] for g in result["grouped_bugs"])
        print(f"   Found {total_bugs} bugs in {len(result['grouped_bugs'])} test cases")

        return result

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/bugs/{bug_id}")
async def get_bug_by_id(
    bug_id: str,
    project_id: str = Query(..., description="Project ID for multi-tenant isolation"),
    current_user: UserDB = Depends(get_current_user),
    service: BugService = Depends(get_bug_service_dependency)
):
    """
    Get a specific bug by ID

    Args:
        bug_id: Bug ID
        project_id: Project ID (part of composite key)
        current_user: Current authenticated user (for organization validation)
        service: Injected BugService instance

    Returns:
        Bug details

    Raises:
        HTTPException: If bug not found or access denied
    """
    print(f"🔍 GET /bugs/{bug_id}?project_id={project_id} - User: {current_user.id} (Org: {current_user.organization_id})")

    try:
        bug = service.get_bug_by_id(bug_id, project_id, current_user.organization_id)

        print(f"   ✅ Bug found: {bug['title']}")
        print(f"   📤 Returning bug data:")
        print(f"      expected_behavior: {bug.get('expected_behavior')}")
        print(f"      actual_behavior: {bug.get('actual_behavior')}")
        print(f"      assigned_to: {bug.get('assigned_to')}")

        return bug

    except ValueError as e:
        print(f"   ❌ Bug not found: {bug_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/bugs", status_code=status.HTTP_201_CREATED)
async def create_bug(
    bug: BugReport,
    service: BugService = Depends(get_bug_service_dependency)
):
    """
    Create a new bug report (CRUD style endpoint)

    Args:
        bug: Bug report data
        service: Injected BugService instance

    Returns:
        Created bug

    Raises:
        HTTPException: If project determination fails or creation errors
    """
    print(f"📝 POST /bugs - Creating bug: {bug.title}")

    try:
        result = service.create_bug(bug)

        print(f"   ✅ Bug created: {result['id']}")

        return result

    except ValueError as e:
        print(f"   ❌ Bug creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"   ❌ Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.put("/bugs/{bug_id}")
async def update_bug(
    bug_id: str,
    updates: Dict[str, Any],
    project_id: str = Query(..., description="Project ID for multi-tenant isolation"),
    current_user: UserDB = Depends(get_current_user),
    service: BugService = Depends(get_bug_service_dependency)
):
    """
    Update a bug report

    Args:
        bug_id: Bug ID to update
        updates: Dictionary with fields to update
        project_id: Project ID (part of composite key)
        current_user: Current authenticated user (for organization validation)
        service: Injected BugService instance

    Returns:
        Updated bug

    Raises:
        HTTPException: If bug not found or access denied
    """
    print(f"✏️  PUT /bugs/{bug_id}?project_id={project_id} - User: {current_user.id} (Org: {current_user.organization_id})")
    print(f"   Update data: {updates}")

    try:
        updated_bug = service.update_bug(bug_id, project_id, current_user.organization_id, updates)

        print(f"   ✅ Bug updated: {updated_bug['id']}")

        return updated_bug

    except ValueError as e:
        print(f"   ❌ Update failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch("/bugs/{bug_id}/dev-update")
async def dev_update_bug(
    bug_id: str,
    update_data: Dict[str, Any],
    service: BugService = Depends(get_bug_service_dependency)
):
    """
    Developer-restricted bug update endpoint

    Only allows updating: status, fix_description, fixed_date
    Auto-sets fixed_date when status changes to FIXED

    Args:
        bug_id: Bug ID
        update_data: Updates (only status, fix_description allowed)
        service: Injected BugService instance

    Returns:
        Updated bug

    Raises:
        HTTPException: If bug not found or invalid fields
    """
    print(f"🔧 PATCH /bugs/{bug_id}/dev-update")
    print(f"   Update data: {update_data}")

    # Restrict to allowed fields
    allowed_fields = {"status", "fix_description", "fixed_date"}
    filtered_updates = {k: v for k, v in update_data.items() if k in allowed_fields}

    if not filtered_updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update. Allowed: status, fix_description, fixed_date"
        )

    # Validate status transitions (only allow dev-appropriate statuses)
    if "status" in filtered_updates:
        from backend.models import BugStatus
        allowed_statuses = ["In Progress", "Fixed", "Testing"]
        if filtered_updates["status"] not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Status must be one of: {allowed_statuses}"
            )

        # Auto-set fixed_date when status changes to FIXED
        if filtered_updates["status"] == "Fixed":
            from datetime import datetime
            filtered_updates["fixed_date"] = datetime.now().isoformat()
            print(f"   Auto-setting fixed_date to now")

    try:
        updated_bug = service.update_bug(bug_id, filtered_updates)

        print(f"   ✅ Bug updated by dev: {updated_bug['id']}")

        return updated_bug

    except ValueError as e:
        print(f"   ❌ Update failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/bugs/count-by-test-case/{test_case_id}")
async def count_bugs_by_test_case(
    test_case_id: str,
    project_id: str = Query(..., description="Project ID for multi-tenant isolation"),
    current_user: UserDB = Depends(get_current_user),
    service: BugService = Depends(get_bug_service_dependency)
):
    """
    Count bugs associated with a specific test case

    CRITICAL SAFETY: Uses composite key (test_case_id + project_id + organization_id)
    to ensure only bugs from the current organization/project are counted

    Args:
        test_case_id: Test case ID to count bugs for
        project_id: Project ID (part of composite key)
        current_user: Current authenticated user (for organization validation)
        service: Injected BugService instance

    Returns:
        Bug count

    Raises:
        HTTPException: If project not found or access denied
    """
    print(f"📊 GET /bugs/count-by-test-case/{test_case_id}?project_id={project_id}")
    print(f"   User: {current_user.id} (Org: {current_user.organization_id})")

    try:
        count = service.count_bugs_by_test_case(test_case_id, project_id)
        print(f"   ✅ Found {count} bug(s) associated with test case {test_case_id}")

        return {
            "test_case_id": test_case_id,
            "project_id": project_id,
            "bug_count": count
        }

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/bugs/{bug_id}")
async def delete_bug(
    bug_id: str,
    project_id: str = Query(..., description="Project ID for multi-tenant isolation"),
    current_user: UserDB = Depends(get_current_user),
    service: BugService = Depends(get_bug_service_dependency)
):
    """
    Delete a bug report and associated document

    Args:
        bug_id: Bug ID to delete
        project_id: Project ID (part of composite key)
        current_user: Current authenticated user (for organization validation)
        service: Injected BugService instance

    Returns:
        Success message

    Raises:
        HTTPException: If bug not found or access denied
    """
    print(f"🗑️  DELETE /bugs/{bug_id}?project_id={project_id} - User: {current_user.id} (Org: {current_user.organization_id})")

    try:
        deleted = service.delete_bug(bug_id, project_id, current_user.organization_id)

        if not deleted:
            raise ValueError(f"Bug {bug_id} not found")

        print(f"   ✅ Bug deleted: {bug_id}")

        return {
            "message": f"Bug {bug_id} deleted successfully",
            "deleted_id": bug_id
        }

    except ValueError as e:
        print(f"   ❌ Deletion failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

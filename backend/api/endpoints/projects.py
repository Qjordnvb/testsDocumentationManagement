"""
Projects API Endpoints (Refactored with Service Layer)

This module contains HTTP endpoints for project management.
Business logic has been extracted to ProjectService following SOLID principles.

Benefits of this refactoring:
- Thin controllers: Only handle HTTP concerns (requests, responses, status codes)
- Testability: Business logic can be unit tested independently
- Reusability: Service layer can be used in CLI, background jobs, etc.
- Maintainability: Changes to business logic don't affect API layer
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from backend.database import get_db, UserDB
from backend.api.dependencies import get_current_user
from backend.models import CreateProjectDTO, UpdateProjectDTO
from backend.services.project_service import ProjectService

router = APIRouter()


def get_project_service_dependency(db: Session = Depends(get_db)) -> ProjectService:
    """Dependency injection for ProjectService"""
    return ProjectService(db)


@router.get("/projects")
async def get_projects(
    assigned_to: Optional[str] = Query(None, description="Filter projects by bugs assigned to user email"),
    service: ProjectService = Depends(get_project_service_dependency),
    current_user: UserDB = Depends(get_current_user)
):
    """
    Get all projects from current user's organization, optionally filtered by assigned bugs

    Args:
        assigned_to: Optional email filter for projects with assigned bugs
        service: Injected ProjectService instance
        current_user: Current authenticated user

    Returns:
        Dictionary with projects list
    """
    print(f"📋 GET /projects - Requested by: {current_user.id} ({current_user.role})")
    print(f"   Organization: {current_user.organization_id}")

    # CRITICAL: Filter projects by organization_id
    projects = service.get_all_projects(
        organization_id=current_user.organization_id,
        assigned_to=assigned_to
    )

    print(f"   Found {len(projects)} projects in organization {current_user.organization_id}")

    return {"projects": projects}


@router.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service_dependency)
):
    """
    Get project by ID with metrics

    Args:
        project_id: Project ID to fetch
        service: Injected ProjectService instance

    Returns:
        Project dictionary with metrics

    Raises:
        HTTPException: 404 if project not found
    """
    project = service.get_project_by_id(project_id)

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project {project_id} not found"
        )

    return project


@router.post("/projects")
async def create_project(
    project_data: CreateProjectDTO,
    service: ProjectService = Depends(get_project_service_dependency),
    current_user: UserDB = Depends(get_current_user)
):
    """
    Create a new project in the current user's organization

    Args:
        project_data: Project creation data
        service: Injected ProjectService instance
        current_user: Current authenticated user

    Returns:
        Created project with metrics
    """
    print(f"📁 POST /projects - Creating project: {project_data.name}")
    print(f"   Created by: {current_user.id} ({current_user.email})")
    print(f"   Organization: {current_user.organization_id}")

    # CRITICAL: Pass user's organization_id to assign project to their organization
    return service.create_project(project_data, organization_id=current_user.organization_id)


@router.put("/projects/{project_id}")
async def update_project(
    project_id: str,
    updates: UpdateProjectDTO,
    service: ProjectService = Depends(get_project_service_dependency)
):
    """
    Update an existing project

    Args:
        project_id: Project ID to update
        updates: Fields to update
        service: Injected ProjectService instance

    Returns:
        Updated project dictionary

    Raises:
        HTTPException: 404 if project not found
    """
    updated_project = service.update_project(project_id, updates)

    if not updated_project:
        raise HTTPException(
            status_code=404,
            detail=f"Project {project_id} not found"
        )

    return updated_project


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service_dependency)
):
    """
    Delete a project (cascades to related data)

    Args:
        project_id: Project ID to delete
        service: Injected ProjectService instance

    Returns:
        Success message

    Raises:
        HTTPException: 404 if project not found
    """
    deleted = service.delete_project(project_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=f"Project {project_id} not found"
        )

    return {"message": f"Project {project_id} deleted successfully"}


@router.get("/projects/{project_id}/stats")
async def get_project_stats(
    project_id: str,
    service: ProjectService = Depends(get_project_service_dependency),
    current_user: UserDB = Depends(get_current_user)
):
    """
    Get detailed statistics for a project

    For developers: Shows only bugs assigned to them
    For QA/Admin: Shows all project bugs

    Args:
        project_id: Project ID
        service: Injected ProjectService instance
        current_user: Current authenticated user

    Returns:
        Project statistics dictionary

    Raises:
        HTTPException: 404 if project not found
    """
    # Pass user email if developer role, otherwise None (show all)
    assigned_to = current_user.email if current_user.role.value == 'dev' else None

    stats = service.get_project_stats(project_id, assigned_to=assigned_to)

    if not stats:
        raise HTTPException(
            status_code=404,
            detail=f"Project {project_id} not found"
        )

    return stats


@router.get("/projects/{project_id}/coverage")
async def get_project_coverage(
    project_id: str,
    service: ProjectService = Depends(get_project_service_dependency),
    current_user: UserDB = Depends(get_current_user)
):
    """
    Get detailed test coverage metrics for a project

    Returns:
        - Test coverage percentage (stories with tests / total stories)
        - List of stories without tests
        - Test execution rate
        - Test pass rate

    Args:
        project_id: Project ID
        service: Injected ProjectService instance
        current_user: Current authenticated user

    Returns:
        Coverage metrics dictionary

    Raises:
        HTTPException: 404 if project not found
    """
    print(f"📊 GET /projects/{project_id}/coverage - User: {current_user.email} (Org: {current_user.organization_id})")

    try:
        coverage = service.get_project_coverage(project_id, current_user.organization_id)
        print(f"   ✅ Coverage calculated: {coverage['test_coverage_percent']}%")
        return coverage

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

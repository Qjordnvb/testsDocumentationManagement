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

from backend.database import get_db
from backend.models import CreateProjectDTO, UpdateProjectDTO
from backend.services.project_service import ProjectService

router = APIRouter()


def get_project_service_dependency(db: Session = Depends(get_db)) -> ProjectService:
    """Dependency injection for ProjectService"""
    return ProjectService(db)


@router.get("/projects")
async def get_projects(
    assigned_to: Optional[str] = Query(None, description="Filter projects by bugs assigned to user email"),
    service: ProjectService = Depends(get_project_service_dependency)
):
    """
    Get all projects with metrics, optionally filtered by assigned bugs

    Args:
        assigned_to: Optional email filter for projects with assigned bugs
        service: Injected ProjectService instance

    Returns:
        Dictionary with projects list
    """
    projects = service.get_all_projects(assigned_to=assigned_to)
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
    service: ProjectService = Depends(get_project_service_dependency)
):
    """
    Create a new project

    Args:
        project_data: Project creation data
        service: Injected ProjectService instance

    Returns:
        Created project with metrics
    """
    return service.create_project(project_data)


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
    service: ProjectService = Depends(get_project_service_dependency)
):
    """
    Get detailed statistics for a project

    Args:
        project_id: Project ID
        service: Injected ProjectService instance

    Returns:
        Project statistics dictionary

    Raises:
        HTTPException: 404 if project not found
    """
    stats = service.get_project_stats(project_id)

    if not stats:
        raise HTTPException(
            status_code=404,
            detail=f"Project {project_id} not found"
        )

    return stats

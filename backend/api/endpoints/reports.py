"""
Report generation endpoints

Handles all report-related operations including test plans, bug summaries, and consolidated reports.

Refactored to use ReportService following SOLID principles:
- Thin controllers: Only handle HTTP concerns (requests, responses, status codes)
- Business logic delegated to ReportService
- Testability: Service layer can be unit tested independently
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path

from backend.database import get_db
from backend.services.report_service import ReportService
from backend.config import settings

router = APIRouter()


def get_report_service_dependency(db: Session = Depends(get_db)) -> ReportService:
    """Dependency injection for ReportService"""
    return ReportService(db)


@router.post("/generate-test-plan")
async def generate_test_plan(
    project_id: str = Query(..., description="Project ID to generate test plan for"),
    format: str = Query(default="both", description="Format: pdf, docx, or both"),
    service: ReportService = Depends(get_report_service_dependency)
):
    """
    Generate test plan document for a specific project

    Args:
        project_id: Project ID to generate test plan for
        format: Format - "pdf", "docx", or "both"
        service: Injected ReportService instance

    Returns:
        Generated files info

    Raises:
        HTTPException: If project not found
    """
    print(f"📊 POST /generate-test-plan - Project: {project_id}, Format: {format}")

    try:
        result = service.generate_test_plan(project_id, format)

        print(f"   ✅ Test plan generated: {result['files']}")

        return result

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/download/{filename}")
async def download_file(filename: str):
    """
    Download generated file

    Args:
        filename: Filename to download

    Returns:
        File response

    Raises:
        HTTPException: If file not found
    """
    file_path = Path(settings.output_dir) / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )


@router.get("/projects/{project_id}/reports/bug-summary")
async def generate_bug_summary_report(
    project_id: str,
    service: ReportService = Depends(get_report_service_dependency)
):
    """
    Generate Bug Summary Report for Dev Team
    Returns a Word document with all bugs for the project

    Args:
        project_id: Project ID
        service: Injected ReportService instance

    Returns:
        File response with Word document

    Raises:
        HTTPException: If project not found or no bugs found
    """
    print(f"📊 GET /projects/{project_id}/reports/bug-summary")

    try:
        file_path = service.generate_bug_summary_report(project_id)

        filename = Path(file_path).name

        print(f"   ✅ Bug summary report generated: {filename}")

        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/projects/{project_id}/reports/test-execution-summary")
async def generate_test_execution_report(
    project_id: str,
    service: ReportService = Depends(get_report_service_dependency)
):
    """
    Generate Test Execution Summary Report for QA Manager
    Returns a Word document with execution statistics and details grouped by Test Case and Scenario

    Args:
        project_id: Project ID
        service: Injected ReportService instance

    Returns:
        File response with Word document

    Raises:
        HTTPException: If project not found or no test cases found
    """
    print(f"📊 GET /projects/{project_id}/reports/test-execution-summary")

    try:
        file_path = service.generate_test_execution_report(project_id)

        filename = Path(file_path).name

        print(f"   ✅ Test execution report generated: {filename}")

        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/reports/consolidated")
async def generate_consolidated_report(
    service: ReportService = Depends(get_report_service_dependency)
):
    """
    Generate Consolidated Report for Manager
    Returns a Word document with metrics from all projects

    Args:
        service: Injected ReportService instance

    Returns:
        File response with Word document

    Raises:
        HTTPException: If no projects found
    """
    print(f"📊 GET /reports/consolidated")

    try:
        file_path = service.generate_consolidated_report()

        filename = Path(file_path).name

        print(f"   ✅ Consolidated report generated: {filename}")

        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

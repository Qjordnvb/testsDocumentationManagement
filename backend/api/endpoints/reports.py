from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from datetime import datetime
import os

from backend.database import get_db, ProjectDB, UserStoryDB, TestCaseDB, BugReportDB, TestExecutionDB
from backend.models import UserStory, TestCase, BugReport, BugSeverity, BugPriority, BugStatus, BugType
from backend.generators import TestPlanGenerator
from backend.generators.bug_report_generator import BugReportGenerator
from backend.config import settings

router = APIRouter()

@router.post("/generate-test-plan")
async def generate_test_plan(
    project_id: str = Query(..., description="Project ID to generate test plan for"),
    format: str = Query(default="both", description="Format: pdf, docx, or both"),
    db: Session = Depends(get_db)
):
    """
    Generate test plan document for a specific project
    """
    # Validate project exists
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Get user stories and test cases for this project only
    user_stories_db = db.query(UserStoryDB).filter(UserStoryDB.project_id == project_id).all()
    test_cases_db = db.query(TestCaseDB).filter(TestCaseDB.project_id == project_id).all()

    # Convert to models (simplified)
    user_stories = [
        UserStory(
            id=s.id,
            title=s.title,
            description=s.description,
            priority=s.priority,
            status=s.status
        )
        for s in user_stories_db
    ]

    test_cases = [
        TestCase(
            id=tc.id,
            title=tc.title,
            description=tc.description,
            user_story_id=tc.user_story_id,
            test_type=tc.test_type,
            priority=tc.priority,
            status=tc.status
        )
        for tc in test_cases_db
    ]

    # Generate test plan
    settings.ensure_directories()
    test_plan_gen = TestPlanGenerator()
    files = test_plan_gen.generate_test_plan(
        user_stories=user_stories,
        test_cases=test_cases,
        output_dir=settings.output_dir,
        project_name=project.name,  # Use project name from database
        format=format
    )

    return {
        "message": "Test plan generated successfully",
        "files": files
    }

@router.get("/download/{filename}")
async def download_file(filename: str):
    """Download generated file"""
    file_path = Path(settings.output_dir) / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )


@router.get("/projects/{project_id}/reports/bug-summary")
async def generate_bug_summary_report(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate Bug Summary Report for Dev Team
    Returns a Word document with all bugs for the project
    """
    # Validate project exists
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Get all bugs for the project
    bugs_db = db.query(BugReportDB).filter(BugReportDB.project_id == project_id).all()

    if not bugs_db:
        raise HTTPException(status_code=404, detail="No bugs found for this project")

    # Convert to Pydantic models
    import json
    bugs = []
    for bug_db in bugs_db:
        bug = BugReport(
            id=bug_db.id,
            title=bug_db.title,
            description=bug_db.description,
            steps_to_reproduce=bug_db.steps_to_reproduce.split('\n') if bug_db.steps_to_reproduce else [],
            expected_behavior=bug_db.expected_behavior or "",
            actual_behavior=bug_db.actual_behavior or "",
            severity=BugSeverity(bug_db.severity),
            priority=BugPriority(bug_db.priority),
            bug_type=BugType(bug_db.bug_type),
            status=BugStatus(bug_db.status),
            environment=bug_db.environment,
            browser=bug_db.browser,
            os=bug_db.os,
            version=bug_db.version,
            user_story_id=bug_db.user_story_id,
            test_case_id=bug_db.test_case_id,
            screenshots=json.loads(bug_db.screenshots) if bug_db.screenshots else [],
            logs=bug_db.logs,
            notes=bug_db.notes,
            workaround=bug_db.workaround,
            root_cause=bug_db.root_cause,
            fix_description=bug_db.fix_description,
            reported_by=bug_db.reported_by or "Unknown",
            assigned_to=bug_db.assigned_to,
            verified_by=bug_db.verified_by,
            reported_date=bug_db.reported_date,
            assigned_date=bug_db.assigned_date,
            fixed_date=bug_db.fixed_date,
            verified_date=bug_db.verified_date,
            closed_date=bug_db.closed_date
        )
        bugs.append(bug)

    # Generate report
    generator = BugReportGenerator()
    output_dir = "output/reports"
    filename = f"BugSummary_{project.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"

    file_path = generator.generate_bulk_report(bugs, output_dir, filename)

    # Return file
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/projects/{project_id}/reports/test-execution-summary")
async def generate_test_execution_report(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate Test Execution Summary Report for QA Manager
    Returns a Word document with execution statistics and details
    """
    from docx import Document
    from docx.shared import Pt, RGBColor, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    # Validate project exists
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Get test cases for the project
    test_cases = db.query(TestCaseDB).filter(TestCaseDB.project_id == project_id).all()

    if not test_cases:
        raise HTTPException(status_code=404, detail="No test cases found for this project")

    # Get all executions for these test cases
    test_case_ids = [tc.id for tc in test_cases]
    executions = db.query(TestExecutionDB).filter(
        TestExecutionDB.test_case_id.in_(test_case_ids)
    ).order_by(TestExecutionDB.execution_date.desc()).all()

    # Calculate statistics
    total_tests = len(test_cases)
    total_executions = len(executions)

    # Execution status counts
    status_counts = {
        'PASSED': 0,
        'FAILED': 0,
        'BLOCKED': 0,
        'SKIPPED': 0,
        'NOT_RUN': 0
    }

    for execution in executions:
        status_counts[execution.status] = status_counts.get(execution.status, 0) + 1

    # Test case status (latest execution)
    test_case_latest_status = {}
    for tc in test_cases:
        # Get latest execution for this test case
        latest = db.query(TestExecutionDB).filter(
            TestExecutionDB.test_case_id == tc.id
        ).order_by(TestExecutionDB.execution_date.desc()).first()

        if latest:
            test_case_latest_status[tc.id] = latest.status
        else:
            test_case_latest_status[tc.id] = 'NOT_RUN'

    # Create document
    doc = Document()

    # Title
    title = doc.add_heading(f"Test Execution Summary Report", 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Project info
    info_para = doc.add_paragraph()
    info_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    info_para.add_run(f"Project: {project.name}\n").bold = True
    info_para.add_run(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
    info_para.add_run(f"Total Test Cases: {total_tests}\n")
    info_para.add_run(f"Total Executions: {total_executions}")

    # Executive Summary
    doc.add_heading("Executive Summary", level=1)
    doc.add_paragraph(f"Total Test Cases: {total_tests}")
    doc.add_paragraph(f"Total Test Executions: {total_executions}")

    # Execution Status Distribution
    doc.add_heading("Execution Status Distribution", level=2)
    status_table = doc.add_table(rows=1, cols=2)
    status_table.style = "Light Grid Accent 1"

    # Header
    header_cells = status_table.rows[0].cells
    header_cells[0].text = "Status"
    header_cells[1].text = "Count"
    for cell in header_cells:
        cell.paragraphs[0].runs[0].font.bold = True

    # Add status counts
    for status, count in sorted(status_counts.items()):
        row_cells = status_table.add_row().cells
        row_cells[0].text = status
        row_cells[1].text = str(count)

    # Pass Rate
    if total_executions > 0:
        pass_rate = (status_counts['PASSED'] / total_executions) * 100
        doc.add_paragraph()
        pass_rate_para = doc.add_paragraph()
        pass_rate_para.add_run(f"Overall Pass Rate: {pass_rate:.1f}%").bold = True
        if pass_rate >= 80:
            pass_rate_para.runs[0].font.color.rgb = RGBColor(0, 128, 0)  # Green
        elif pass_rate >= 60:
            pass_rate_para.runs[0].font.color.rgb = RGBColor(255, 165, 0)  # Orange
        else:
            pass_rate_para.runs[0].font.color.rgb = RGBColor(255, 0, 0)  # Red

    # Test Case Details
    doc.add_heading("Test Case Details", level=1)

    test_table = doc.add_table(rows=1, cols=5)
    test_table.style = "Light Grid Accent 1"

    # Header
    header_cells = test_table.rows[0].cells
    headers = ["Test ID", "Title", "Type", "Priority", "Latest Status"]
    for i, header in enumerate(headers):
        header_cells[i].text = header
        header_cells[i].paragraphs[0].runs[0].font.bold = True

    # Add test cases
    for tc in test_cases:
        row_cells = test_table.add_row().cells
        row_cells[0].text = tc.id
        row_cells[1].text = tc.title[:40] + "..." if len(tc.title) > 40 else tc.title
        row_cells[2].text = tc.test_type
        row_cells[3].text = tc.priority
        row_cells[4].text = test_case_latest_status.get(tc.id, 'NOT_RUN')

    # Recent Executions
    doc.add_heading("Recent Executions (Last 20)", level=1)

    exec_table = doc.add_table(rows=1, cols=6)
    exec_table.style = "Light Grid Accent 1"

    # Header
    header_cells = exec_table.rows[0].cells
    headers = ["Date", "Test ID", "Executed By", "Status", "Duration (min)", "Pass/Fail/Total"]
    for i, header in enumerate(headers):
        header_cells[i].text = header
        header_cells[i].paragraphs[0].runs[0].font.bold = True

    # Add recent executions (last 20)
    for execution in executions[:20]:
        row_cells = exec_table.add_row().cells
        row_cells[0].text = execution.execution_date.strftime('%Y-%m-%d %H:%M')
        row_cells[1].text = execution.test_case_id
        row_cells[2].text = execution.executed_by
        row_cells[3].text = execution.status
        row_cells[4].text = str(execution.execution_time_minutes or 0)
        row_cells[5].text = f"{execution.passed_steps}/{execution.failed_steps}/{execution.total_steps}"

    # Footer
    doc.add_paragraph()
    footer = doc.add_paragraph("Generated by Quality Mission Control System")
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.runs[0].font.size = Pt(9)
    footer.runs[0].font.color.rgb = RGBColor(128, 128, 128)

    # Save document
    output_dir = Path("output/reports")
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"TestExecution_{project.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
    file_path = output_dir / filename

    doc.save(str(file_path))

    # Return file
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

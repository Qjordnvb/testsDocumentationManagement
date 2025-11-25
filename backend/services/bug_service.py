"""
Bug Service Layer

Handles business logic for bug management operations following SOLID principles:
- Single Responsibility: Only handles bug-related business logic
- Dependency Inversion: Depends on Session abstraction
- Open/Closed: Easy to extend with new bug operations
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import defaultdict
import json

from backend.database import BugReportDB, TestCaseDB, ProjectDB, UserStoryDB, TestExecutionDB
from backend.models import BugReport, BugStatus, BugSeverity, BugPriority, BugType
from backend.generators import BugReportGenerator
from backend.config import settings
from backend.utils import generate_composite_id


class BugService:
    """Service class for bug-related business logic"""

    def __init__(self, db: Session):
        """Initialize service with database session"""
        self.db = db

    def get_bugs_by_project(self, project_id: str) -> List[Dict[str, Any]]:
        """
        Get all bugs for a specific project

        Args:
            project_id: Project ID to filter bugs

        Returns:
            List of bug dictionaries
        """
        # Validate project exists
        project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        bugs = self.db.query(BugReportDB).filter(
            BugReportDB.project_id == project_id
        ).all()

        return [self._bug_to_dict(bug) for bug in bugs]

    def get_bugs_grouped(self, project_id: str) -> Dict[str, Any]:
        """
        Get bugs grouped by test case and scenario

        Args:
            project_id: Project ID

        Returns:
            Dictionary with grouped bugs
        """
        # Validate project exists
        project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        bugs = self.db.query(BugReportDB).filter(
            BugReportDB.project_id == project_id
        ).all()

        # Group bugs by test_case_id and scenario_name
        test_case_groups = defaultdict(lambda: defaultdict(list))

        for bug in bugs:
            test_case_id = bug.test_case_id or "NO_TEST_CASE"
            scenario_name = bug.scenario_name or "No Scenario"
            test_case_groups[test_case_id][scenario_name].append(self._bug_to_dict(bug))

        # Build final structure with test case details
        grouped_bugs = []
        for test_case_id, scenarios_dict in test_case_groups.items():
            test_case_title = "Unknown Test Case"
            if test_case_id != "NO_TEST_CASE":
                test_case = self.db.query(TestCaseDB).filter(TestCaseDB.id == test_case_id).first()
                if test_case:
                    test_case_title = test_case.title

            scenarios = []
            for scenario_name, bugs_list in scenarios_dict.items():
                scenarios.append({
                    "scenario_name": scenario_name,
                    "bug_count": len(bugs_list),
                    "bugs": bugs_list
                })

            scenarios.sort(key=lambda x: x["scenario_name"])

            grouped_bugs.append({
                "test_case_id": test_case_id,
                "test_case_title": test_case_title,
                "total_bugs": sum(s["bug_count"] for s in scenarios),
                "scenarios": scenarios
            })

        grouped_bugs.sort(key=lambda x: x["test_case_id"])

        return {"grouped_bugs": grouped_bugs}

    def get_bug_by_id(self, bug_id: str, project_id: str, organization_id: str) -> Dict[str, Any]:
        """
        Get a specific bug by ID

        Args:
            bug_id: Bug ID
            project_id: Project ID (part of composite key)
            organization_id: Organization ID (part of composite key)

        Returns:
            Bug dictionary

        Raises:
            ValueError: If bug not found or access denied
        """
        # CRITICAL: Bugs have composite PK (id, project_id, organization_id)
        bug = self.db.query(BugReportDB).filter(
            BugReportDB.id == bug_id,
            BugReportDB.project_id == project_id,
            BugReportDB.organization_id == organization_id
        ).first()

        if not bug:
            raise ValueError(f"Bug {bug_id} not found in project {project_id}")

        bug_dict = self._bug_to_dict(bug)
        # Include attachments alias for frontend compatibility
        bug_dict["attachments"] = bug_dict["screenshots"]

        return bug_dict

    def create_bug(self, bug: BugReport) -> Dict[str, Any]:
        """
        Create a new bug report

        Args:
            bug: Bug report data

        Returns:
            Created bug dictionary

        Raises:
            ValueError: If project_id cannot be determined
        """
        # Determine project_id
        project_id = self._determine_project_id(bug)

        # Get project to obtain organization_id for multi-tenant isolation
        project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        # Generate bug ID if not provided
        if not bug.id:
            bug_count = self.db.query(BugReportDB).filter(
                BugReportDB.project_id == project_id
            ).count()
            # Generate composite ID using centralized utility
            bug.id = generate_composite_id("BUG", project_id, bug_count)

        # Generate document
        settings.ensure_directories()
        bug_gen = BugReportGenerator()
        doc_path = bug_gen.generate_bug_report(bug, settings.output_dir)

        # Create DB record with organization_id for multi-tenant isolation
        db_bug = self._create_bug_db_record(bug, project_id, project.organization_id, doc_path)
        self.db.add(db_bug)
        self.db.commit()
        self.db.refresh(db_bug)

        # Update test execution if applicable
        self._link_bug_to_execution(bug, db_bug.id)

        return self._bug_to_dict(db_bug)

    def update_bug(self, bug_id: str, project_id: str, organization_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing bug

        Args:
            bug_id: Bug ID to update
            project_id: Project ID (part of composite key)
            organization_id: Organization ID (part of composite key)
            updates: Dictionary with fields to update

        Returns:
            Updated bug dictionary

        Raises:
            ValueError: If bug not found or access denied
        """
        # CRITICAL: Bugs have composite PK (id, project_id, organization_id)
        bug = self.db.query(BugReportDB).filter(
            BugReportDB.id == bug_id,
            BugReportDB.project_id == project_id,
            BugReportDB.organization_id == organization_id
        ).first()

        if not bug:
            raise ValueError(f"Bug {bug_id} not found in project {project_id}")

        # Update allowed fields
        self._apply_bug_updates(bug, updates)

        self.db.commit()
        self.db.refresh(bug)

        bug_dict = self._bug_to_dict(bug)
        bug_dict["attachments"] = bug_dict["screenshots"]
        return bug_dict

    def delete_bug(self, bug_id: str, project_id: str, organization_id: str) -> bool:
        """
        Delete a bug report

        Args:
            bug_id: Bug ID to delete
            project_id: Project ID (part of composite key)
            organization_id: Organization ID (part of composite key)

        Returns:
            True if deleted, False if not found or access denied
        """
        # CRITICAL: Bugs have composite PK (id, project_id, organization_id)
        bug = self.db.query(BugReportDB).filter(
            BugReportDB.id == bug_id,
            BugReportDB.project_id == project_id,
            BugReportDB.organization_id == organization_id
        ).first()

        if not bug:
            return False

        # Delete document file if exists
        if bug.document_path and os.path.exists(bug.document_path):
            try:
                os.remove(bug.document_path)
            except Exception as e:
                print(f"⚠️ Failed to delete document: {e}")

        self.db.delete(bug)
        self.db.commit()

        return True

    def count_bugs_by_test_case(self, test_case_id: str, project_id: str) -> int:
        """
        Count number of bugs associated with a specific test case

        CRITICAL SAFETY: Uses composite key (test_case_id + project_id + organization_id)
        to ensure isolation per organization/project

        Args:
            test_case_id: Test case ID
            project_id: Project ID for isolation

        Returns:
            Number of bugs associated with this test case

        Raises:
            ValueError: If project not found
        """
        # Validate project exists and get organization_id
        project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        # Count bugs with composite key filtering (ensures multi-tenant isolation)
        count = self.db.query(BugReportDB).filter(
            BugReportDB.test_case_id == test_case_id,
            BugReportDB.project_id == project_id,
            BugReportDB.organization_id == project.organization_id  # CRITICAL: Tenant isolation
        ).count()

        return count

    # ========== Private Helper Methods ==========

    def _determine_project_id(self, bug: BugReport) -> str:
        """Determine project_id from bug data"""
        project_id = bug.project_id

        if not project_id and bug.user_story_id:
            user_story = self.db.query(UserStoryDB).filter(UserStoryDB.id == bug.user_story_id).first()
            if user_story:
                project_id = user_story.project_id
            else:
                raise ValueError(f"User story {bug.user_story_id} not found")

        if not project_id and bug.test_case_id:
            test_case = self.db.query(TestCaseDB).filter(TestCaseDB.id == bug.test_case_id).first()
            if test_case:
                project_id = test_case.project_id
            else:
                raise ValueError(f"Test case {bug.test_case_id} not found")

        if not project_id:
            raise ValueError("Bug must have project_id or be associated with a user_story_id or test_case_id")

        return project_id

    def _create_bug_db_record(self, bug: BugReport, project_id: str, organization_id: str, doc_path: str) -> BugReportDB:
        """Create BugReportDB instance from BugReport with multi-tenant isolation"""
        import os  # Add missing import

        steps_str = '\n'.join(bug.steps_to_reproduce) if bug.steps_to_reproduce else None
        screenshots_str = json.dumps(bug.screenshots) if bug.screenshots else None

        return BugReportDB(
            id=bug.id,
            project_id=project_id,
            organization_id=organization_id,  # CRITICAL: Multi-tenant isolation
            title=bug.title,
            description=bug.description,
            steps_to_reproduce=steps_str,
            expected_behavior=bug.expected_behavior,
            actual_behavior=bug.actual_behavior,
            severity=bug.severity,
            priority=bug.priority,
            bug_type=bug.bug_type,
            status=bug.status,
            environment=bug.environment,
            browser=bug.browser,
            os=bug.os,
            version=bug.version,  # Uncommented: Now in DB
            user_story_id=bug.user_story_id,
            test_case_id=bug.test_case_id,
            scenario_name=bug.scenario_name,  # Uncommented: Now in DB
            attachments=screenshots_str,  # FIX: Map screenshots to attachments field
            # logs=bug.logs,
            # notes=bug.notes,
            # workaround=bug.workaround,
            # root_cause=bug.root_cause,
            # fix_description=bug.fix_description,
            reported_by=bug.reported_by,
            assigned_to=bug.assigned_to,
            # verified_by=bug.verified_by,
            # reported_date=bug.reported_date or datetime.now(),
            # document_path=doc_path
        )

    def _link_bug_to_execution(self, bug: BugReport, bug_id: str):
        """Link bug to test execution if execution_id is provided"""
        if bug.execution_id and bug.execution_id > 0:
            execution = self.db.query(TestExecutionDB).filter(TestExecutionDB.id == bug.execution_id).first()
            if execution:
                existing_bugs = execution.bug_ids.split(",") if execution.bug_ids else []
                if bug_id not in existing_bugs:
                    existing_bugs.append(bug_id)
                    execution.bug_ids = ",".join(existing_bugs)
                    self.db.commit()

    def _apply_bug_updates(self, bug: BugReportDB, updates: Dict[str, Any]):
        """Apply updates to bug record"""
        allowed_fields = [
            "title", "description", "steps_to_reproduce", "expected_behavior", "actual_behavior",
            "severity", "priority", "bug_type", "status",
            "environment", "browser", "os",
            "version", "scenario_name", # Uncommented: Now in DB
            "screenshots",
            # "logs", "notes", "workaround", "root_cause", "fix_description",
            "assigned_to",
            # "verified_by", "assigned_date", "fixed_date", "verified_date", "closed_date"
        ]

        for field, value in updates.items():
            if field in allowed_fields and value is not None:
                # Handle list conversions
                if field == "steps_to_reproduce" and isinstance(value, list):
                    value = '\n'.join(value) if value else None
                elif field == "screenshots" and isinstance(value, list):
                    # Map screenshots to attachments field
                    field = "attachments"
                    value = json.dumps(value) if value else None
                elif field == "logs" and isinstance(value, list):
                    value = json.dumps(value) if value else None

                # Handle enum fields
                if field in ["severity", "priority", "bug_type", "status"]:
                    try:
                        if field == "severity":
                            value = BugSeverity[value] if isinstance(value, str) and value.isupper() else BugSeverity(value)
                        elif field == "priority":
                            value = BugPriority[value] if isinstance(value, str) and value.isupper() else BugPriority(value)
                        elif field == "bug_type":
                            value = BugType[value] if isinstance(value, str) and value.isupper() else BugType(value)
                        elif field == "status":
                            value = BugStatus[value] if isinstance(value, str) and value.isupper() else BugStatus(value)
                    except (KeyError, ValueError):
                        continue

                setattr(bug, field, value)

    def _bug_to_dict(self, bug: BugReportDB) -> Dict[str, Any]:
        """Convert BugReportDB to dictionary"""
        screenshots_list = json.loads(bug.attachments) if bug.attachments else []

        return {
            "id": bug.id,
            "project_id": bug.project_id,
            "title": bug.title,
            "description": bug.description,
            "steps_to_reproduce": bug.steps_to_reproduce.split('\n') if bug.steps_to_reproduce else [],
            "expected_behavior": bug.expected_behavior,
            "actual_behavior": bug.actual_behavior,
            "severity": bug.severity.value if bug.severity else "Medium",
            "priority": bug.priority.value if bug.priority else "Medium",
            "bug_type": bug.bug_type.value if bug.bug_type else "Functional",
            "status": bug.status.value if bug.status else "New",
            "environment": bug.environment,
            "browser": bug.browser,
            "os": bug.os,
            "version": bug.version, # Uncommented: Now in DB
            "user_story_id": bug.user_story_id,
            "test_case_id": bug.test_case_id,
            "scenario_name": bug.scenario_name, # Uncommented: Now in DB
            "screenshots": screenshots_list,
            "logs": None,
            "notes": None,
            "workaround": None,
            "root_cause": None,
            "fix_description": None,
            "reported_by": bug.reported_by,
            "assigned_to": bug.assigned_to,
            "verified_by": None,
            "reported_date": bug.created_date.isoformat() if bug.created_date else None,
            "assigned_date": None,
            "fixed_date": None,
            "verified_date": None,
            "closed_date": None,
            "document_path": None,
        }


def get_bug_service(db: Session) -> BugService:
    """Dependency injection helper for FastAPI"""
    return BugService(db)

"""
Project Service Layer
Handles business logic for project operations

Following SOLID principles:
- Single Responsibility: Only handles project-related business logic
- Dependency Inversion: Depends on Session abstraction, not concrete DB implementation
- Open/Closed: Easy to extend with new project operations without modifying existing code
"""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from backend.database import ProjectDB, UserStoryDB, TestCaseDB, BugReportDB
from backend.models import CreateProjectDTO, UpdateProjectDTO, ProjectStatus


class ProjectService:
    """
    Service class for project-related business logic

    Benefits of service layer:
    1. Testability: Can unit test business logic without HTTP server
    2. Reusability: Same logic can be used in API, CLI, background jobs
    3. Separation of Concerns: Business logic separate from HTTP handling
    4. Maintainability: Changes to business logic don't affect API layer
    """

    def __init__(self, db: Session):
        """
        Initialize service with database session

        Args:
            db: SQLAlchemy database session
        """
        self.db = db

    def get_all_projects(self, assigned_to: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all projects with metrics, optionally filtered by assigned bugs

        Args:
            assigned_to: Email of user to filter projects by assigned bugs

        Returns:
            List of project dictionaries with metrics
        """
        if assigned_to:
            projects = self._get_projects_by_assigned_user(assigned_to)
        else:
            projects = self.db.query(ProjectDB).all()

        return [self._project_to_dict_with_metrics(project) for project in projects]

    def get_project_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single project by ID with metrics

        Args:
            project_id: Project ID to fetch

        Returns:
            Project dictionary with metrics or None if not found
        """
        project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()

        if not project:
            return None

        return self._project_to_dict_with_metrics(project)

    def create_project(self, project_data: CreateProjectDTO) -> Dict[str, Any]:
        """
        Create a new project with auto-generated ID

        Args:
            project_data: DTO with project creation data

        Returns:
            Created project as dictionary with metrics
        """
        # Generate unique project ID
        project_id = self._generate_unique_project_id()

        # Create project entity
        new_project = ProjectDB(
            id=project_id,
            name=project_data.name,
            description=project_data.description,
            client=project_data.client,
            team_members=json.dumps(project_data.team_members) if project_data.team_members else None,
            default_test_types=json.dumps(project_data.default_test_types) if project_data.default_test_types else None,
            start_date=project_data.start_date,
            end_date=project_data.end_date,
            status=ProjectStatus.ACTIVE,
            created_date=datetime.now(),
            updated_date=datetime.now()
        )

        self.db.add(new_project)
        self.db.commit()
        self.db.refresh(new_project)

        return self._project_to_dict_with_metrics(new_project)

    def update_project(self, project_id: str, updates: UpdateProjectDTO) -> Optional[Dict[str, Any]]:
        """
        Update an existing project

        Args:
            project_id: ID of project to update
            updates: DTO with fields to update

        Returns:
            Updated project as dictionary or None if not found
        """
        project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()

        if not project:
            return None

        # Apply updates (only non-None values)
        if updates.name is not None:
            project.name = updates.name
        if updates.description is not None:
            project.description = updates.description
        if updates.client is not None:
            project.client = updates.client
        if updates.team_members is not None:
            project.team_members = json.dumps(updates.team_members)
        if updates.default_test_types is not None:
            project.default_test_types = json.dumps(updates.default_test_types)
        if updates.start_date is not None:
            project.start_date = updates.start_date
        if updates.end_date is not None:
            project.end_date = updates.end_date
        if updates.status is not None:
            project.status = updates.status

        project.updated_date = datetime.now()

        self.db.commit()
        self.db.refresh(project)

        return self._project_to_dict_with_metrics(project)

    def delete_project(self, project_id: str) -> bool:
        """
        Delete a project (cascades to related data via DB constraints)

        Args:
            project_id: ID of project to delete

        Returns:
            True if deleted, False if not found
        """
        project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()

        if not project:
            return False

        self.db.delete(project)
        self.db.commit()

        return True

    def get_project_stats(self, project_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed statistics for a project

        Args:
            project_id: Project ID

        Returns:
            Statistics dictionary or None if project not found
        """
        project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()

        if not project:
            return None

        metrics = self._calculate_project_metrics(project)

        return {
            "project_id": project.id,
            "project_name": project.name,
            **metrics
        }

    # ========== Private Helper Methods ==========

    def _get_projects_by_assigned_user(self, user_email: str) -> List[ProjectDB]:
        """Get projects that have bugs assigned to a specific user"""
        # Query distinct project_ids from bugs assigned to the user
        project_ids_with_bugs = self.db.query(BugReportDB.project_id).filter(
            BugReportDB.assigned_to == user_email
        ).distinct().all()

        project_ids = [pid[0] for pid in project_ids_with_bugs]

        if not project_ids:
            return []

        return self.db.query(ProjectDB).filter(ProjectDB.id.in_(project_ids)).all()

    def _generate_unique_project_id(self) -> str:
        """Generate a unique project ID in format PROJ-001"""
        project_count = self.db.query(ProjectDB).count()
        project_id = f"PROJ-{str(project_count + 1).zfill(3)}"

        # Handle edge case: ID collision (shouldn't happen but be defensive)
        while self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first():
            project_count += 1
            project_id = f"PROJ-{str(project_count + 1).zfill(3)}"

        return project_id

    def _project_to_dict_with_metrics(self, project: ProjectDB) -> Dict[str, Any]:
        """Convert ProjectDB entity to dictionary with calculated metrics"""
        metrics = self._calculate_project_metrics(project)

        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "client": project.client,
            "team_members": json.loads(project.team_members) if project.team_members else [],
            "status": project.status.value,
            "default_test_types": json.loads(project.default_test_types) if project.default_test_types else [],
            "start_date": project.start_date.isoformat() if project.start_date else None,
            "end_date": project.end_date.isoformat() if project.end_date else None,
            "created_date": project.created_date.isoformat(),
            "updated_date": project.updated_date.isoformat(),
            **metrics
        }

    def _calculate_project_metrics(self, project: ProjectDB) -> Dict[str, Any]:
        """
        Calculate project metrics (stories, tests, bugs, coverage)

        This is the core business logic that was previously in the controller.
        Now it's testable, reusable, and maintainable.
        """
        # Count total entities
        total_stories = self.db.query(UserStoryDB).filter(
            UserStoryDB.project_id == project.id
        ).count()

        total_tests = self.db.query(TestCaseDB).filter(
            TestCaseDB.project_id == project.id
        ).count()

        total_bugs = self.db.query(BugReportDB).filter(
            BugReportDB.project_id == project.id
        ).count()

        # Calculate test coverage: % of stories that have at least 1 test case
        coverage = 0.0
        stories_with_tests = 0

        if total_stories > 0:
            # Get distinct user_story_ids that have test cases
            story_ids_with_tests = self.db.query(TestCaseDB.user_story_id).filter(
                TestCaseDB.project_id == project.id
            ).distinct().all()

            stories_with_tests = len(story_ids_with_tests)
            coverage = (stories_with_tests / total_stories) * 100

        return {
            "total_user_stories": total_stories,
            "total_test_cases": total_tests,
            "total_bugs": total_bugs,
            "test_coverage": round(coverage, 2),
            "stories_with_tests": stories_with_tests  # Additional metric
        }


# ========== Dependency Injection Helper ==========

def get_project_service(db: Session = None) -> ProjectService:
    """
    Dependency injection helper for FastAPI

    Usage in endpoint:
        @router.get("/projects")
        async def get_projects(
            service: ProjectService = Depends(get_project_service)
        ):
            return service.get_all_projects()
    """
    return ProjectService(db)

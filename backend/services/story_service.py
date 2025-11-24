"""
User Story Service Layer

Handles business logic for user story management operations following SOLID principles:
- Single Responsibility: Only handles user story-related business logic
- Dependency Inversion: Depends on Session abstraction
- Open/Closed: Easy to extend with new user story operations
"""

from sqlalchemy.orm import Session, selectinload
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path
import json
import shutil

from backend.database import ProjectDB, UserStoryDB
from backend.models import UserStory
from backend.parsers import FileParser
from backend.integrations import GeminiClient
from backend.config import settings


class StoryService:
    """Service class for user story-related business logic"""

    def __init__(self, db: Session, gemini_client: Optional[GeminiClient] = None):
        """Initialize service with database session and optional AI client"""
        self.db = db
        self.gemini_client = gemini_client

    async def upload_and_process_file(
        self,
        file_path: Path,
        original_filename: str,
        project_id: str
    ) -> Dict[str, Any]:
        """
        Parse uploaded file and save user stories to database

        Args:
            file_path: Path to uploaded file
            original_filename: Original filename
            project_id: Project ID to associate stories with

        Returns:
            Dictionary with processing results

        Raises:
            ValueError: If project not found or parse errors
        """
        # Validate that project exists
        project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found. Please create the project first.")

        print(f"\n=== UPLOAD DEBUG ===")
        print(f"Project: {project_id} - {project.name}")
        print(f"File: {original_filename}")
        print(f"Path: {file_path}")

        # Parse file WITH PARALLEL AI processing
        print("Starting file parsing with parallel AI processing...")
        parser = FileParser(gemini_client=self.gemini_client)
        result = await parser.parse_async(str(file_path))

        print(f"Parse result: success={result.success}, stories={len(result.user_stories)}, errors={result.errors}")

        if not result.success:
            raise ValueError(f"Parse errors: {result.errors}")

        # Save to database with batch processing
        # CRITICAL: Pass organization_id for multi-tenant isolation
        saved_stories, updated_stories = self._batch_save_stories(
            result.user_stories,
            project_id,
            project.organization_id  # Get from validated project
        )

        # Fetch the saved stories (with multi-tenant isolation)
        all_story_ids = [s.id for s in result.user_stories]
        db_stories = self.db.query(UserStoryDB).filter(
            UserStoryDB.id.in_(all_story_ids),
            UserStoryDB.project_id == project_id,
            UserStoryDB.organization_id == project.organization_id
        ).all()

        # Format stories
        formatted_stories = [self._story_to_dict(story) for story in db_stories]

        print(f"Returning {len(formatted_stories)} stories with criteria")
        print("=== UPLOAD COMPLETE ===\n")

        return {
            "message": f"Successfully processed {len(result.user_stories)} user stories ({len(saved_stories)} new, {len(updated_stories)} updated)",
            "file_name": original_filename,
            "stories_count": len(formatted_stories),
            "user_stories": formatted_stories,
            "inserted": len(saved_stories),
            "updated": len(updated_stories),
            "total": len(result.user_stories),
            "file_path": str(file_path),
            "detected_columns": parser.get_detected_columns_info()
        }

    def get_stories_by_project(self, project_id: str) -> List[Dict[str, Any]]:
        """
        Get all user stories for a specific project

        Args:
            project_id: Project ID to filter stories

        Returns:
            List of user story dictionaries

        Raises:
            ValueError: If project not found
        """
        # Validate project exists
        project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        # Filter stories by project AND organization WITH eager loading of test_cases
        stories = self.db.query(UserStoryDB).options(
            selectinload(UserStoryDB.test_cases)
        ).filter(
            UserStoryDB.project_id == project_id,
            UserStoryDB.organization_id == project.organization_id
        ).all()

        return [self._story_to_dict_with_test_cases(story) for story in stories]

    def get_story_by_id(self, story_id: str) -> Dict[str, Any]:
        """
        Get specific user story by ID

        Args:
            story_id: User story ID

        Returns:
            User story dictionary

        Raises:
            ValueError: If story not found
        """
        story = self.db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
        if not story:
            raise ValueError("User story not found")

        return self._story_to_dict_with_test_cases(story)

    def update_story(self, story_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user story (including acceptance criteria)

        Args:
            story_id: User story ID to update
            updates: Dictionary with fields to update

        Returns:
            Updated user story dictionary

        Raises:
            ValueError: If story not found
        """
        story = self.db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
        if not story:
            raise ValueError("User story not found")

        # Update basic fields
        allowed_fields = [
            "title", "description", "priority", "status",
            "epic", "sprint", "story_points", "assigned_to"
        ]

        for field in allowed_fields:
            if field in updates:
                setattr(story, field, updates[field])

        # Update acceptance criteria if provided
        if "acceptance_criteria" in updates:
            criteria = updates["acceptance_criteria"]
            story.acceptance_criteria = json.dumps(criteria) if criteria else None
            story.total_criteria = len(criteria) if criteria else 0
            story.completed_criteria = sum(1 for c in criteria if c.get("completed", False)) if criteria else 0
            total = len(criteria) if criteria else 0
            story.completion_percentage = (story.completed_criteria / total * 100) if total > 0 else 0.0

        story.updated_date = datetime.now()
        self.db.commit()
        self.db.refresh(story)

        return {
            "id": story.id,
            "title": story.title,
            "description": story.description,
            "priority": story.priority.value if story.priority else None,
            "status": story.status.value if story.status else None,
            "epic": story.epic,
            "sprint": story.sprint,
            "story_points": story.story_points,
            "assigned_to": story.assigned_to,
            "acceptance_criteria": json.loads(story.acceptance_criteria) if story.acceptance_criteria else [],
            "total_criteria": story.total_criteria,
            "completed_criteria": story.completed_criteria,
            "completion_percentage": story.completion_percentage,
            "updated_date": story.updated_date.isoformat() if story.updated_date else None
        }

    def save_uploaded_file(self, file, original_filename: str) -> Path:
        """
        Save uploaded file to upload directory

        Args:
            file: UploadFile object
            original_filename: Original filename

        Returns:
            Path to saved file
        """
        settings.ensure_directories()
        file_path = Path(settings.upload_dir) / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{original_filename}"

        print(f"Saving to: {file_path}")

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"File saved successfully. Size: {file_path.stat().st_size} bytes")

        return file_path

    def validate_file_type(self, filename: str) -> str:
        """
        Validate file extension

        Args:
            filename: Filename to validate

        Returns:
            File extension

        Raises:
            ValueError: If file type not supported
        """
        file_extension = Path(filename).suffix.lower()

        if file_extension not in [".xlsx", ".xls", ".csv"]:
            raise ValueError(f"Unsupported file type: {file_extension}. Please upload .xlsx or .csv file")

        return file_extension

    def validate_project_exists(self, project_id: str) -> ProjectDB:
        """
        Validate that project exists

        Args:
            project_id: Project ID to validate

        Returns:
            ProjectDB instance

        Raises:
            ValueError: If project not found
        """
        project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found. Please create the project first.")

        return project

    # ========== Private Helper Methods ==========

    def _batch_save_stories(
        self,
        user_stories: List[UserStory],
        project_id: str,
        organization_id: str
    ) -> tuple[List[str], List[str]]:
        """
        Save user stories to database using batch processing

        Args:
            user_stories: List of user stories to save
            project_id: Project ID to associate stories with
            organization_id: Organization ID for multi-tenant isolation

        Returns:
            Tuple of (saved_story_ids, updated_story_ids)
        """
        print(f"Saving {len(user_stories)} stories to database with BATCH processing...")

        # Step 1: Identify existing stories in ONE query
        print("  Step 1: Identifying existing stories...")
        all_story_ids = [s.id for s in user_stories]
        existing_stories_query = self.db.query(UserStoryDB).filter(
            UserStoryDB.id.in_(all_story_ids),
            UserStoryDB.project_id == project_id
        ).all()
        existing_ids = {s.id for s in existing_stories_query}

        # Step 2: Prepare batch data
        print("  Step 2: Preparing batch data...")
        new_stories_data = []
        update_stories_data = []
        now = datetime.now()

        for user_story in user_stories:
            story_data = {
                'id': user_story.id,
                'project_id': project_id,
                'organization_id': organization_id,  # CRITICAL: Multi-tenant isolation
                'title': user_story.title,
                'description': user_story.description,
                'priority': user_story.priority.value if hasattr(user_story.priority, 'value') else user_story.priority,
                'status': user_story.status.value if hasattr(user_story.status, 'value') else user_story.status,
                'epic': user_story.epic,
                'sprint': user_story.sprint,
                'story_points': user_story.story_points,
                'assigned_to': user_story.assigned_to,
                'acceptance_criteria': json.dumps(
                    [ac.dict() for ac in user_story.acceptance_criteria]
                ) if user_story.acceptance_criteria else None,
                'total_criteria': len(user_story.acceptance_criteria),
                'completed_criteria': sum(1 for ac in user_story.acceptance_criteria if ac.completed),
                'completion_percentage': user_story.get_completion_percentage(),
                'updated_date': now
            }

            if user_story.id in existing_ids:
                update_stories_data.append(story_data)
            else:
                story_data['created_date'] = now
                new_stories_data.append(story_data)

        # Step 3: Batch insert new stories
        if new_stories_data:
            print(f"  Step 3: Batch inserting {len(new_stories_data)} new stories...")
            self.db.bulk_insert_mappings(UserStoryDB, new_stories_data)

        # Step 4: Batch update existing stories
        if update_stories_data:
            print(f"  Step 4: Batch updating {len(update_stories_data)} existing stories...")
            self.db.bulk_update_mappings(UserStoryDB, update_stories_data)

        saved_stories = [s['id'] for s in new_stories_data]
        updated_stories = [s['id'] for s in update_stories_data]

        self.db.commit()
        print(f"✅ Database commit successful! Inserted: {len(saved_stories)}, Updated: {len(updated_stories)}")

        return saved_stories, updated_stories

    def _story_to_dict(self, story: UserStoryDB) -> Dict[str, Any]:
        """Convert UserStoryDB to dictionary (without test cases)"""
        return {
            "id": story.id,
            "title": story.title,
            "description": story.description,
            "acceptance_criteria": json.loads(story.acceptance_criteria) if story.acceptance_criteria else [],
            "total_criteria": story.total_criteria,
            "completed_criteria": story.completed_criteria,
            "completion_percentage": story.completion_percentage,
            "priority": story.priority,
            "status": story.status
        }

    def _story_to_dict_with_test_cases(self, story: UserStoryDB) -> Dict[str, Any]:
        """Convert UserStoryDB to dictionary (with test cases)"""
        return {
            "id": story.id,
            "title": story.title,
            "description": story.description,
            "priority": story.priority.value if story.priority else None,
            "status": story.status.value if story.status else None,
            "epic": story.epic,
            "sprint": story.sprint,
            "story_points": story.story_points,
            "assigned_to": story.assigned_to,
            "acceptance_criteria": json.loads(story.acceptance_criteria) if story.acceptance_criteria else [],
            "created_at": story.created_date.isoformat() if story.created_date else None,
            "updated_at": story.updated_date.isoformat() if story.updated_date else None,
            "completion_percentage": story.completion_percentage,
            "test_case_ids": [tc.id for tc in story.test_cases] if story.test_cases else []
        }


def get_story_service(db: Session, gemini_client: Optional[GeminiClient] = None) -> StoryService:
    """Dependency injection helper for FastAPI"""
    return StoryService(db, gemini_client)

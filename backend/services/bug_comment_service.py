"""
Bug Comment Service Layer

Handles business logic for bug comment operations following SOLID principles:
- Single Responsibility: Only handles bug comment-related business logic
- Dependency Inversion: Depends on Session abstraction
- Open/Closed: Easy to extend with new comment operations
- Testability: All logic isolated from HTTP layer

Provides QA-DEV communication on bugs with:
- Author tracking
- Soft delete
- Attachment support
- Mentions support
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import random
import string

from backend.database import BugCommentDB, BugReportDB, ProjectDB


class BugCommentService:
    """Service class for bug comment-related business logic"""

    def __init__(self, db: Session):
        """
        Initialize service with database session

        Args:
            db: SQLAlchemy database session
        """
        self.db = db

    def _generate_comment_id(self) -> str:
        """
        Generate unique comment ID with format: CMT-{timestamp}-{random}

        Returns:
            Unique comment ID
        """
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        return f"CMT-{timestamp}-{random_suffix}"

    def _comment_to_dict(self, comment: BugCommentDB) -> Dict[str, Any]:
        """
        Convert BugCommentDB to dictionary for API response

        Args:
            comment: BugCommentDB instance

        Returns:
            Dictionary representation of comment
        """
        return {
            "id": comment.id,
            "bug_id": comment.bug_id,
            "project_id": comment.project_id,
            "organization_id": comment.organization_id,
            "author_email": comment.author_email,
            "author_name": comment.author_name,
            "author_role": comment.author_role,
            "text": comment.text,
            "mentions": json.loads(comment.mentions) if comment.mentions else [],
            "attachment_path": comment.attachment_path,
            "created_date": comment.created_date.isoformat() if comment.created_date else None,
            "updated_date": comment.updated_date.isoformat() if comment.updated_date else None,
            "is_deleted": comment.is_deleted
        }

    def create_comment(
        self,
        bug_id: str,
        project_id: str,
        organization_id: str,
        text: str,
        author_email: str,
        author_name: str,
        author_role: str,
        attachment_path: Optional[str] = None,
        mentions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Create a new comment on a bug

        Args:
            bug_id: Bug ID to comment on
            project_id: Project ID (part of composite key)
            organization_id: Organization ID (part of composite key)
            text: Comment text
            author_email: Email of comment author
            author_name: Full name of comment author
            author_role: Role of comment author (qa, dev, manager, admin)
            attachment_path: Optional path to attachment file
            mentions: Optional list of mentioned user emails

        Returns:
            Created comment as dictionary

        Raises:
            ValueError: If bug not found or project not found
        """
        # Validate bug exists
        bug = self.db.query(BugReportDB).filter(
            BugReportDB.id == bug_id,
            BugReportDB.project_id == project_id,
            BugReportDB.organization_id == organization_id
        ).first()

        if not bug:
            raise ValueError(f"Bug {bug_id} not found in project {project_id}")

        # Generate unique comment ID
        comment_id = self._generate_comment_id()

        # Convert mentions to JSON
        mentions_json = json.dumps(mentions) if mentions else None

        # Create comment
        comment = BugCommentDB(
            id=comment_id,
            project_id=project_id,
            organization_id=organization_id,
            bug_id=bug_id,
            author_email=author_email,
            author_name=author_name,
            author_role=author_role,
            text=text,
            mentions=mentions_json,
            attachment_path=attachment_path,
            created_date=datetime.now(),
            is_deleted=False
        )

        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)

        return self._comment_to_dict(comment)

    def get_comments_by_bug(
        self,
        bug_id: str,
        project_id: str,
        organization_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get all comments for a specific bug (non-deleted, ordered by creation date)

        Args:
            bug_id: Bug ID to get comments for
            project_id: Project ID (part of composite key)
            organization_id: Organization ID (part of composite key)

        Returns:
            List of comment dictionaries, ordered by created_date ASC

        Raises:
            ValueError: If bug not found
        """
        # Validate bug exists
        bug = self.db.query(BugReportDB).filter(
            BugReportDB.id == bug_id,
            BugReportDB.project_id == project_id,
            BugReportDB.organization_id == organization_id
        ).first()

        if not bug:
            raise ValueError(f"Bug {bug_id} not found in project {project_id}")

        # Query comments (non-deleted only)
        comments = self.db.query(BugCommentDB).filter(
            BugCommentDB.bug_id == bug_id,
            BugCommentDB.project_id == project_id,
            BugCommentDB.organization_id == organization_id,
            BugCommentDB.is_deleted == False
        ).order_by(BugCommentDB.created_date.asc()).all()

        return [self._comment_to_dict(comment) for comment in comments]

    def update_comment(
        self,
        comment_id: str,
        project_id: str,
        organization_id: str,
        text: str,
        author_email: str
    ) -> Dict[str, Any]:
        """
        Update comment text (only by original author)

        Args:
            comment_id: Comment ID to update
            project_id: Project ID (part of composite key)
            organization_id: Organization ID (part of composite key)
            text: New comment text
            author_email: Email of user attempting update (must match comment author)

        Returns:
            Updated comment as dictionary

        Raises:
            ValueError: If comment not found
            PermissionError: If author_email doesn't match comment author
        """
        # Query comment
        comment = self.db.query(BugCommentDB).filter(
            BugCommentDB.id == comment_id,
            BugCommentDB.project_id == project_id,
            BugCommentDB.organization_id == organization_id,
            BugCommentDB.is_deleted == False
        ).first()

        if not comment:
            raise ValueError(f"Comment {comment_id} not found")

        # Verify author
        if comment.author_email != author_email:
            raise PermissionError("Only the comment author can edit this comment")

        # Update text and timestamp
        comment.text = text
        comment.updated_date = datetime.now()

        self.db.commit()
        self.db.refresh(comment)

        return self._comment_to_dict(comment)

    def delete_comment(
        self,
        comment_id: str,
        project_id: str,
        organization_id: str,
        current_user_email: str,
        current_user_role: str
    ) -> bool:
        """
        Soft delete a comment (only by author or admin)

        Args:
            comment_id: Comment ID to delete
            project_id: Project ID (part of composite key)
            organization_id: Organization ID (part of composite key)
            current_user_email: Email of user attempting delete
            current_user_role: Role of user attempting delete

        Returns:
            True if deleted successfully

        Raises:
            ValueError: If comment not found
            PermissionError: If user is not author or admin
        """
        # Query comment
        comment = self.db.query(BugCommentDB).filter(
            BugCommentDB.id == comment_id,
            BugCommentDB.project_id == project_id,
            BugCommentDB.organization_id == organization_id,
            BugCommentDB.is_deleted == False
        ).first()

        if not comment:
            raise ValueError(f"Comment {comment_id} not found")

        # Verify permissions (author or admin)
        is_author = comment.author_email == current_user_email
        is_admin = current_user_role == "admin"

        if not (is_author or is_admin):
            raise PermissionError("Only the comment author or admin can delete this comment")

        # Soft delete
        comment.is_deleted = True
        comment.updated_date = datetime.now()

        self.db.commit()

        return True

    def count_comments_by_bug(
        self,
        bug_id: str,
        project_id: str,
        organization_id: str
    ) -> int:
        """
        Count non-deleted comments for a bug

        Args:
            bug_id: Bug ID
            project_id: Project ID (part of composite key)
            organization_id: Organization ID (part of composite key)

        Returns:
            Number of active comments
        """
        count = self.db.query(BugCommentDB).filter(
            BugCommentDB.bug_id == bug_id,
            BugCommentDB.project_id == project_id,
            BugCommentDB.organization_id == organization_id,
            BugCommentDB.is_deleted == False
        ).count()

        return count

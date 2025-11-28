"""
Bug Comments Endpoints

Handles all bug comment-related HTTP operations for QA-DEV communication.

Refactored to use BugCommentService following SOLID principles:
- Thin controllers: Only handle HTTP concerns (requests, responses, status codes)
- Business logic delegated to BugCommentService
- Testability: Service layer can be unit tested independently
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import os
import shutil
from datetime import datetime

from backend.database import get_db, UserDB
from backend.services.bug_comment_service import BugCommentService
from backend.api.dependencies import get_current_user
from backend.config import settings

router = APIRouter()


class UpdateCommentRequest(BaseModel):
    """Request model for updating a comment"""
    text: str


def get_bug_comment_service(db: Session = Depends(get_db)) -> BugCommentService:
    """Dependency injection for BugCommentService"""
    return BugCommentService(db)


@router.post("/bugs/{bug_id}/comments", status_code=status.HTTP_201_CREATED)
async def create_bug_comment(
    bug_id: str,
    project_id: str = Query(..., description="Project ID for multi-tenant isolation"),
    text: str = Form(..., description="Comment text"),
    attachment: Optional[UploadFile] = File(None),
    current_user: UserDB = Depends(get_current_user),
    service: BugCommentService = Depends(get_bug_comment_service)
):
    """
    Create a new comment on a bug

    Args:
        bug_id: Bug ID to comment on
        project_id: Project ID (part of composite key)
        text: Comment text
        attachment: Optional file attachment
        current_user: Current authenticated user
        service: Injected BugCommentService instance

    Returns:
        Created comment

    Raises:
        HTTPException: If bug not found or file upload fails
    """
    print(f"💬 POST /bugs/{bug_id}/comments - User: {current_user.email} (Org: {current_user.organization_id})")
    print(f"   Project: {project_id}")
    print(f"   Text: {text[:100]}...")

    attachment_path = None

    # Handle file upload if present
    if attachment:
        try:
            # Create evidence/comments/{project_id}/{bug_id}/ directory
            comments_dir = os.path.join("evidence", "comments", project_id, bug_id)
            os.makedirs(comments_dir, exist_ok=True)

            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_extension = os.path.splitext(attachment.filename)[1]
            filename = f"{timestamp}_{attachment.filename}"
            file_path = os.path.join(comments_dir, filename)

            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(attachment.file, buffer)

            # Store relative path for serving via /evidence/ endpoint
            attachment_path = f"evidence/comments/{project_id}/{bug_id}/{filename}"
            print(f"   📎 Attachment saved: {attachment_path}")

        except Exception as e:
            print(f"   ❌ File upload failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File upload failed: {str(e)}"
            )

    try:
        comment = service.create_comment(
            bug_id=bug_id,
            project_id=project_id,
            organization_id=current_user.organization_id,
            text=text,
            author_email=current_user.email,
            author_name=current_user.full_name,
            author_role=current_user.role,
            attachment_path=attachment_path
        )

        print(f"   ✅ Comment created: {comment['id']}")

        return comment

    except ValueError as e:
        print(f"   ❌ Comment creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        print(f"   ❌ Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/bugs/{bug_id}/comments")
async def get_bug_comments(
    bug_id: str,
    project_id: str = Query(..., description="Project ID for multi-tenant isolation"),
    current_user: UserDB = Depends(get_current_user),
    service: BugCommentService = Depends(get_bug_comment_service)
):
    """
    Get all comments for a specific bug

    Args:
        bug_id: Bug ID
        project_id: Project ID (part of composite key)
        current_user: Current authenticated user
        service: Injected BugCommentService instance

    Returns:
        List of comments ordered by creation date

    Raises:
        HTTPException: If bug not found
    """
    print(f"📋 GET /bugs/{bug_id}/comments - User: {current_user.email} (Org: {current_user.organization_id})")
    print(f"   Project: {project_id}")

    try:
        comments = service.get_comments_by_bug(bug_id, project_id, current_user.organization_id)

        print(f"   ✅ Found {len(comments)} comment(s)")

        return {"comments": comments}

    except ValueError as e:
        print(f"   ❌ Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/bugs/comments/{comment_id}")
async def update_comment(
    comment_id: str,
    request: UpdateCommentRequest,
    project_id: str = Query(..., description="Project ID for multi-tenant isolation"),
    current_user: UserDB = Depends(get_current_user),
    service: BugCommentService = Depends(get_bug_comment_service)
):
    """
    Update a comment (only by original author)

    Args:
        comment_id: Comment ID to update
        request: Request body containing new comment text
        project_id: Project ID (part of composite key)
        current_user: Current authenticated user
        service: Injected BugCommentService instance

    Returns:
        Updated comment

    Raises:
        HTTPException: If comment not found or user is not the author
    """
    print(f"✏️  PUT /bugs/comments/{comment_id} - User: {current_user.email} (Org: {current_user.organization_id})")
    print(f"   Project: {project_id}")
    print(f"   New text: {request.text[:100]}...")

    try:
        updated_comment = service.update_comment(
            comment_id=comment_id,
            project_id=project_id,
            organization_id=current_user.organization_id,
            text=request.text,
            author_email=current_user.email
        )

        print(f"   ✅ Comment updated")

        return updated_comment

    except ValueError as e:
        print(f"   ❌ Update failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        print(f"   ❌ Permission denied: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/bugs/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    project_id: str = Query(..., description="Project ID for multi-tenant isolation"),
    current_user: UserDB = Depends(get_current_user),
    service: BugCommentService = Depends(get_bug_comment_service)
):
    """
    Soft delete a comment (only by author or admin)

    Args:
        comment_id: Comment ID to delete
        project_id: Project ID (part of composite key)
        current_user: Current authenticated user
        service: Injected BugCommentService instance

    Returns:
        Success message

    Raises:
        HTTPException: If comment not found or user lacks permission
    """
    print(f"🗑️  DELETE /bugs/comments/{comment_id} - User: {current_user.email} (Org: {current_user.organization_id})")
    print(f"   Project: {project_id}")

    try:
        deleted = service.delete_comment(
            comment_id=comment_id,
            project_id=project_id,
            organization_id=current_user.organization_id,
            current_user_email=current_user.email,
            current_user_role=current_user.role
        )

        if not deleted:
            raise ValueError(f"Comment {comment_id} not found")

        print(f"   ✅ Comment deleted (soft delete)")

        return {
            "message": f"Comment {comment_id} deleted successfully",
            "deleted_id": comment_id
        }

    except ValueError as e:
        print(f"   ❌ Deletion failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        print(f"   ❌ Permission denied: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/bugs/{bug_id}/comments/count")
async def count_bug_comments(
    bug_id: str,
    project_id: str = Query(..., description="Project ID for multi-tenant isolation"),
    current_user: UserDB = Depends(get_current_user),
    service: BugCommentService = Depends(get_bug_comment_service)
):
    """
    Count non-deleted comments for a bug

    Args:
        bug_id: Bug ID
        project_id: Project ID (part of composite key)
        current_user: Current authenticated user
        service: Injected BugCommentService instance

    Returns:
        Comment count

    Raises:
        HTTPException: If bug not found
    """
    print(f"📊 GET /bugs/{bug_id}/comments/count - User: {current_user.email} (Org: {current_user.organization_id})")

    count = service.count_comments_by_bug(bug_id, project_id, current_user.organization_id)

    print(f"   ✅ Found {count} comment(s)")

    return {
        "bug_id": bug_id,
        "project_id": project_id,
        "comment_count": count
    }

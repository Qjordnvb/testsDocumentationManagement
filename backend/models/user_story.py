"""
User Story data model
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re


class Priority(str, Enum):
    """User story priority levels"""
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class Status(str, Enum):
    """User story status"""
    BACKLOG = "Backlog"
    TODO = "To Do"
    IN_PROGRESS = "In Progress"
    IN_REVIEW = "In Review"
    TESTING = "Testing"
    DONE = "Done"


class AcceptanceCriteria(BaseModel):
    """Single acceptance criteria for a user story"""
    id: Optional[str] = None
    description: str = Field(..., min_length=1, max_length=500, description="Acceptance criteria description")
    completed: bool = False

    @validator('description')
    def strip_description(cls, v):
        """Strip whitespace from description"""
        if v:
            return v.strip()
        return v


class UserStory(BaseModel):
    """
    User Story model representing a feature or requirement
    Flexible to accommodate different input formats
    """
    # Core fields
    id: str = Field(..., min_length=1, max_length=50, description="Unique identifier (e.g., US-001)")
    title: str = Field(..., min_length=1, max_length=200, description="User story title")
    description: str = Field(..., min_length=1, max_length=2000, description="Detailed description or user story format")

    # Optional fields that might come from different sources
    acceptance_criteria: List[AcceptanceCriteria] = Field(
        default_factory=list,
        description="List of acceptance criteria"
    )
    priority: Optional[Priority] = Field(default=Priority.MEDIUM)
    status: Optional[Status] = Field(default=Status.BACKLOG)

    # Additional metadata
    epic: Optional[str] = None
    sprint: Optional[str] = None
    story_points: Optional[int] = None
    assigned_to: Optional[str] = None
    created_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None

    # Original data for reference
    raw_data: Optional[dict] = Field(
        default=None,
        description="Original data from source (Excel/CSV)"
    )

    # Relationships
    test_case_ids: List[str] = Field(
        default_factory=list,
        description="IDs of generated test cases"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "US-001",
                "title": "User login with email and password",
                "description": "As a user, I want to login with my email and password so that I can access my account",
                "acceptance_criteria": [
                    {
                        "description": "User can enter email and password in login form",
                        "completed": False
                    },
                    {
                        "description": "System validates credentials against database",
                        "completed": False
                    },
                    {
                        "description": "Successful login redirects to dashboard",
                        "completed": False
                    }
                ],
                "priority": "High",
                "status": "To Do"
            }
        }

    @validator('id')
    def validate_id_format(cls, v):
        """Validate user story ID format (e.g., US-001, US-PROJ-001, or numeric like 462462)"""
        if v:
            # Allow flexible formats:
            # - Alphanumeric: US-XXX, US-PROJ-XXX, etc.
            # - Pure numeric: 462462 (Azure DevOps format)
            if not re.match(r'^([A-Z]+-.*\d|\d+)$', v):
                raise ValueError("User story ID must be alphanumeric (e.g., 'US-001') or numeric (e.g., '462462')")
            return v.strip()
        return v

    @validator('title', 'description')
    def strip_whitespace(cls, v):
        """Strip leading/trailing whitespace from text fields"""
        if v:
            return v.strip()
        return v

    @validator('story_points')
    def validate_story_points(cls, v):
        """Ensure story points are positive"""
        if v is not None and v <= 0:
            raise ValueError("Story points must be greater than 0")
        return v

    @validator('sprint', 'epic', 'assigned_to')
    def strip_optional_strings(cls, v):
        """Strip whitespace from optional string fields"""
        if v:
            return v.strip()
        return v

    def get_criteria_text(self) -> str:
        """Get all acceptance criteria as formatted text"""
        if not self.acceptance_criteria:
            return "No acceptance criteria defined"

        return "\n".join([
            f"- {criteria.description}"
            for criteria in self.acceptance_criteria
        ])

    def get_completion_percentage(self) -> float:
        """Calculate percentage of completed acceptance criteria"""
        if not self.acceptance_criteria:
            return 0.0

        completed = sum(1 for ac in self.acceptance_criteria if ac.completed)
        return (completed / len(self.acceptance_criteria)) * 100

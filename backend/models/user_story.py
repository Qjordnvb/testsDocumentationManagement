"""
User Story data model
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


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
    description: str
    completed: bool = False


class UserStory(BaseModel):
    """
    User Story model representing a feature or requirement
    Flexible to accommodate different input formats
    """
    # Core fields
    id: str = Field(..., description="Unique identifier (e.g., US-001)")
    title: str = Field(..., description="User story title")
    description: str = Field(..., description="Detailed description or user story format")

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

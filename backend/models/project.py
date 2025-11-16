"""
Project data model
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ProjectStatus(str, Enum):
    """Project status enum"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"


class Project(BaseModel):
    """Project model for multi-project QA management"""
    id: str = Field(..., description="Unique project identifier (e.g., PROJ-001)")
    name: str = Field(..., description="Project name")
    description: Optional[str] = Field(None, description="Project description")

    # Client/Team
    client: Optional[str] = Field(None, description="Client name")
    team_members: Optional[List[str]] = Field(None, description="Team member emails/names")

    # Status
    status: ProjectStatus = Field(default=ProjectStatus.ACTIVE, description="Project status")

    # Configuration
    default_test_types: Optional[List[str]] = Field(None, description="Default test types for this project")

    # Dates
    start_date: Optional[datetime] = Field(None, description="Project start date")
    end_date: Optional[datetime] = Field(None, description="Project end date")
    created_date: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_date: datetime = Field(default_factory=datetime.now, description="Last update timestamp")

    # Integration IDs
    notion_database_id: Optional[str] = Field(None, description="Notion database ID")
    azure_project_id: Optional[str] = Field(None, description="Azure DevOps project ID")

    # Metrics (calculated)
    total_user_stories: int = Field(default=0, description="Total user stories in project")
    total_test_cases: int = Field(default=0, description="Total test cases in project")
    total_bugs: int = Field(default=0, description="Total bugs in project")
    test_coverage: float = Field(default=0.0, description="Test coverage percentage")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "PROJ-001",
                "name": "E-commerce Platform",
                "description": "Main e-commerce application testing project",
                "client": "ABC Company",
                "team_members": ["qa1@example.com", "qa2@example.com"],
                "status": "active",
                "default_test_types": ["FUNCTIONAL", "UI", "API"],
                "start_date": "2025-01-01T00:00:00",
                "total_user_stories": 25,
                "total_test_cases": 78,
                "total_bugs": 3,
                "test_coverage": 95.5
            }
        }


class CreateProjectDTO(BaseModel):
    """DTO for creating a new project"""
    name: str = Field(..., description="Project name", min_length=1, max_length=200)
    description: Optional[str] = Field(None, description="Project description")
    client: Optional[str] = Field(None, description="Client name")
    team_members: Optional[List[str]] = Field(None, description="Team member emails/names")
    default_test_types: Optional[List[str]] = Field(None, description="Default test types")
    start_date: Optional[datetime] = Field(None, description="Project start date")
    end_date: Optional[datetime] = Field(None, description="Project end date")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Mobile Banking App",
                "description": "QA testing for mobile banking application",
                "client": "Bank XYZ",
                "team_members": ["qa-lead@bank.com", "qa-tester@bank.com"],
                "default_test_types": ["FUNCTIONAL", "SECURITY", "API"],
                "start_date": "2025-02-01T00:00:00"
            }
        }


class UpdateProjectDTO(BaseModel):
    """DTO for updating a project"""
    name: Optional[str] = Field(None, description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    client: Optional[str] = Field(None, description="Client name")
    team_members: Optional[List[str]] = Field(None, description="Team member emails/names")
    status: Optional[ProjectStatus] = Field(None, description="Project status")
    default_test_types: Optional[List[str]] = Field(None, description="Default test types")
    start_date: Optional[datetime] = Field(None, description="Project start date")
    end_date: Optional[datetime] = Field(None, description="Project end date")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "completed",
                "end_date": "2025-12-31T00:00:00"
            }
        }

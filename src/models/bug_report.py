"""
Bug Report data model
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class BugSeverity(str, Enum):
    """Bug severity levels"""
    CRITICAL = "Critical"  # System crash, data loss
    HIGH = "High"          # Major functionality broken
    MEDIUM = "Medium"      # Feature partially broken
    LOW = "Low"            # Minor issue, cosmetic


class BugPriority(str, Enum):
    """Bug priority levels"""
    URGENT = "Urgent"      # Fix immediately
    HIGH = "High"          # Fix in current sprint
    MEDIUM = "Medium"      # Fix in next sprint
    LOW = "Low"            # Fix when possible


class BugStatus(str, Enum):
    """Bug lifecycle status"""
    NEW = "New"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    FIXED = "Fixed"
    TESTING = "Testing"
    VERIFIED = "Verified"
    CLOSED = "Closed"
    REOPENED = "Reopened"
    WONT_FIX = "Won't Fix"
    DUPLICATE = "Duplicate"


class BugType(str, Enum):
    """Types of bugs"""
    FUNCTIONAL = "Functional"
    UI = "UI/UX"
    PERFORMANCE = "Performance"
    SECURITY = "Security"
    COMPATIBILITY = "Compatibility"
    DATA = "Data"
    API = "API"
    CRASH = "Crash"


class BugReport(BaseModel):
    """
    Bug Report model with all necessary information for tracking defects
    """
    # Core identification
    id: Optional[str] = Field(default=None, description="Bug ID (e.g., BUG-001)")
    title: str = Field(..., description="Brief bug title")

    # Bug details
    description: str = Field(..., description="Detailed bug description")
    steps_to_reproduce: List[str] = Field(
        ...,
        description="Step-by-step reproduction steps"
    )
    expected_behavior: str = Field(..., description="What should happen")
    actual_behavior: str = Field(..., description="What actually happens")

    # Classification
    severity: BugSeverity = Field(default=BugSeverity.MEDIUM)
    priority: BugPriority = Field(default=BugPriority.MEDIUM)
    bug_type: BugType = Field(default=BugType.FUNCTIONAL)
    status: BugStatus = Field(default=BugStatus.NEW)

    # Context
    environment: Optional[str] = Field(
        default=None,
        description="Environment where bug was found (e.g., Dev, QA, Staging, Prod)"
    )
    browser: Optional[str] = Field(
        default=None,
        description="Browser/client if applicable"
    )
    os: Optional[str] = Field(
        default=None,
        description="Operating system"
    )
    version: Optional[str] = Field(
        default=None,
        description="Application version"
    )

    # Relationships
    user_story_id: Optional[str] = None
    test_case_id: Optional[str] = None
    related_bugs: List[str] = Field(
        default_factory=list,
        description="Related bug IDs"
    )

    # Attachments and evidence
    screenshots: List[str] = Field(
        default_factory=list,
        description="Paths to screenshot files"
    )
    logs: Optional[str] = Field(
        default=None,
        description="Relevant log excerpts"
    )
    video_url: Optional[str] = None

    # People
    reported_by: Optional[str] = None
    assigned_to: Optional[str] = None
    verified_by: Optional[str] = None

    # Dates
    reported_date: Optional[datetime] = None
    assigned_date: Optional[datetime] = None
    fixed_date: Optional[datetime] = None
    verified_date: Optional[datetime] = None
    closed_date: Optional[datetime] = None

    # Additional info
    notes: Optional[str] = None
    workaround: Optional[str] = None
    root_cause: Optional[str] = None
    fix_description: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "BUG-001",
                "title": "Login fails with valid credentials",
                "description": "Users cannot login despite entering correct email and password",
                "steps_to_reproduce": [
                    "Navigate to login page",
                    "Enter valid email: user@example.com",
                    "Enter valid password",
                    "Click Login button"
                ],
                "expected_behavior": "User should be logged in and redirected to dashboard",
                "actual_behavior": "Error message 'Invalid credentials' is shown, user remains on login page",
                "severity": "Critical",
                "priority": "Urgent",
                "bug_type": "Functional",
                "environment": "QA",
                "browser": "Chrome 120",
                "os": "Windows 11",
                "user_story_id": "US-001"
            }
        }

    def to_markdown(self) -> str:
        """Convert bug report to markdown format"""
        lines = [
            f"# {self.title}",
            "",
            f"**Bug ID:** {self.id or 'TBD'}",
            f"**Status:** {self.status.value}",
            f"**Severity:** {self.severity.value}",
            f"**Priority:** {self.priority.value}",
            f"**Type:** {self.bug_type.value}",
            "",
            "## Description",
            self.description,
            "",
            "## Steps to Reproduce",
        ]

        for i, step in enumerate(self.steps_to_reproduce, 1):
            lines.append(f"{i}. {step}")

        lines.extend([
            "",
            "## Expected Behavior",
            self.expected_behavior,
            "",
            "## Actual Behavior",
            self.actual_behavior,
            "",
            "## Environment",
            f"- **Environment:** {self.environment or 'N/A'}",
            f"- **Browser:** {self.browser or 'N/A'}",
            f"- **OS:** {self.os or 'N/A'}",
            f"- **Version:** {self.version or 'N/A'}",
        ])

        if self.workaround:
            lines.extend([
                "",
                "## Workaround",
                self.workaround
            ])

        if self.notes:
            lines.extend([
                "",
                "## Additional Notes",
                self.notes
            ])

        return "\n".join(lines)

    def get_summary(self) -> dict:
        """Get bug summary for reporting"""
        return {
            "id": self.id,
            "title": self.title,
            "severity": self.severity.value,
            "priority": self.priority.value,
            "status": self.status.value,
            "type": self.bug_type.value,
            "reported_date": self.reported_date.isoformat() if self.reported_date else None,
            "assigned_to": self.assigned_to,
        }

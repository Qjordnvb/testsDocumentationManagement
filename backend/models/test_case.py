"""
Test Case data models including Gherkin scenarios
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class TestType(str, Enum):
    """Types of tests"""
    FUNCTIONAL = "Functional"
    INTEGRATION = "Integration"
    UI = "UI"
    API = "API"
    REGRESSION = "Regression"
    SMOKE = "Smoke"
    E2E = "End-to-End"
    PERFORMANCE = "Performance"
    SECURITY = "Security"
    ACCESSIBILITY = "Accessibility"


class TestPriority(str, Enum):
    """Test priority levels"""
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class TestStatus(str, Enum):
    """Test execution status"""
    NOT_RUN = "Not Run"
    PASSED = "Passed"
    FAILED = "Failed"
    BLOCKED = "Blocked"
    SKIPPED = "Skipped"


class TestStep(BaseModel):
    """Individual test step"""
    step_number: int
    action: str
    expected_result: str
    actual_result: Optional[str] = None
    status: TestStatus = TestStatus.NOT_RUN


class GherkinScenario(BaseModel):
    """
    Gherkin BDD scenario (Given-When-Then format)
    """
    scenario_name: str
    given_steps: List[str] = Field(
        default_factory=list,
        description="Given steps (preconditions)"
    )
    when_steps: List[str] = Field(
        default_factory=list,
        description="When steps (actions)"
    )
    then_steps: List[str] = Field(
        default_factory=list,
        description="Then steps (expected outcomes)"
    )
    tags: List[str] = Field(
        default_factory=list,
        description="Scenario tags (e.g., @smoke, @regression)"
    )

    def to_gherkin(self) -> str:
        """Convert scenario to Gherkin format"""
        lines = []

        # Add tags
        if self.tags:
            lines.append(" ".join(f"@{tag}" for tag in self.tags))

        # Add scenario name
        lines.append(f"Scenario: {self.scenario_name}")

        # Add Given steps
        for i, step in enumerate(self.given_steps):
            keyword = "Given" if i == 0 else "And"
            lines.append(f"  {keyword} {step}")

        # Add When steps
        for i, step in enumerate(self.when_steps):
            keyword = "When" if i == 0 else "And"
            lines.append(f"  {keyword} {step}")

        # Add Then steps
        for i, step in enumerate(self.then_steps):
            keyword = "Then" if i == 0 else "And"
            lines.append(f"  {keyword} {step}")

        return "\n".join(lines)


class TestCase(BaseModel):
    """
    Complete test case with optional Gherkin scenarios
    """
    # Core identification
    id: str = Field(..., description="Test case ID (e.g., TC-001)")
    title: str = Field(..., description="Test case title")
    description: str = Field(..., description="Test case description")

    # Related user story
    user_story_id: str = Field(..., description="Related user story ID")

    # Test metadata
    test_type: TestType = Field(default=TestType.FUNCTIONAL)
    priority: TestPriority = Field(default=TestPriority.MEDIUM)
    status: TestStatus = Field(default=TestStatus.NOT_RUN)

    # Test details
    preconditions: List[str] = Field(
        default_factory=list,
        description="Prerequisites before test execution"
    )
    test_steps: List[TestStep] = Field(
        default_factory=list,
        description="Manual test steps"
    )

    # Gherkin scenarios for BDD
    gherkin_scenarios: List[GherkinScenario] = Field(
        default_factory=list,
        description="BDD scenarios in Gherkin format"
    )

    # Additional metadata
    estimated_time_minutes: Optional[int] = None
    actual_time_minutes: Optional[int] = None
    automated: bool = False
    automation_script: Optional[str] = None

    # Tracking
    created_date: Optional[datetime] = None
    last_executed: Optional[datetime] = None
    executed_by: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "TC-001",
                "title": "Verify successful user login",
                "description": "Test that a user can successfully login with valid credentials",
                "user_story_id": "US-001",
                "test_type": "Functional",
                "priority": "High",
                "preconditions": [
                    "User account exists in the system",
                    "User knows their email and password"
                ],
                "gherkin_scenarios": [
                    {
                        "scenario_name": "Successful login with valid credentials",
                        "given_steps": ["the user is on the login page", "the user has valid credentials"],
                        "when_steps": ["the user enters their email", "the user enters their password", "the user clicks the login button"],
                        "then_steps": ["the user should be redirected to the dashboard", "the user should see a welcome message"]
                    }
                ]
            }
        }

    def generate_feature_file(self, feature_name: str) -> str:
        """Generate complete Gherkin .feature file content"""
        lines = [
            f"Feature: {feature_name}",
            f"  {self.description}",
            ""
        ]

        for scenario in self.gherkin_scenarios:
            lines.append(scenario.to_gherkin())
            lines.append("")  # Empty line between scenarios

        return "\n".join(lines)

    def get_execution_summary(self) -> dict:
        """Get summary of test execution"""
        return {
            "test_id": self.id,
            "title": self.title,
            "status": self.status.value,
            "total_steps": len(self.test_steps),
            "passed_steps": sum(1 for step in self.test_steps if step.status == TestStatus.PASSED),
            "failed_steps": sum(1 for step in self.test_steps if step.status == TestStatus.FAILED),
            "estimated_time": self.estimated_time_minutes,
            "actual_time": self.actual_time_minutes
        }
class StepExecutionResult(BaseModel):
    step_index: int
    keyword: str  # Given, When, Then
    text: str
    status: TestStatus # PASSED, FAILED, SKIPPED
    actual_result: Optional[str] = None
    evidence_file: Optional[str] = None # Path al archivo subido
    comment: Optional[str] = None

class TestExecutionCreate(BaseModel):
    test_case_id: str
    executed_by: str
    status: TestStatus
    environment: str = "QA"
    version: Optional[str] = None
    execution_time_seconds: int
    step_results: List[StepExecutionResult]
    notes: Optional[str] = None
    failure_reason: Optional[str] = None
    evidence_files: List[str] = [] # Lista global de evidencias
    bug_ids: List[str] = []

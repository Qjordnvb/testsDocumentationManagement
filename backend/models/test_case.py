"""
Test Case data models including Gherkin scenarios
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any, Literal
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
    NOT_RUN = "NOT_RUN"
    PASSED = "PASSED"
    FAILED = "FAILED"
    BLOCKED = "BLOCKED"
    SKIPPED = "SKIPPED"


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
    """
    Schema estricto para step execution results.
    IMPORTANTE: scenario_name es REQUERIDO para evitar crashes en reportes.
    """
    step_index: int = Field(..., ge=0, description="Step index (0-based)")
    keyword: Literal["Given", "When", "Then", "And", "But"] = Field(..., description="Gherkin keyword")
    text: str = Field(..., min_length=1, description="Step text (cannot be empty)")
    status: TestStatus = Field(..., description="Step execution status")
    scenario_name: str = Field(..., min_length=1, description="Scenario name (REQUIRED for grouping)")
    actual_result: Optional[str] = Field(None, description="Actual result for failed steps")
    evidence_file: Optional[str] = Field(None, description="Path to evidence file")
    comment: Optional[str] = Field(None, description="Optional comment")

    @validator('scenario_name')
    def scenario_name_not_empty(cls, v):
        """Ensure scenario_name is not empty or whitespace"""
        if not v or not v.strip():
            raise ValueError("scenario_name cannot be empty or whitespace")
        return v.strip()

    @validator('text')
    def text_not_empty(cls, v):
        """Ensure step text is not empty"""
        if not v or not v.strip():
            raise ValueError("step text cannot be empty or whitespace")
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "step_index": 0,
                "keyword": "Given",
                "text": "the user is on the login page",
                "status": "PASSED",
                "scenario_name": "User login with valid credentials",
                "actual_result": None,
                "evidence_file": None,
                "comment": None
            }
        }

class TestExecutionCreate(BaseModel):
    """
    Schema para crear una ejecución de test con validación estricta.
    Valida que step_results tenga datos consistentes y completos.
    """
    test_case_id: str = Field(..., min_length=1, description="Test case ID")
    executed_by: str = Field(..., min_length=1, description="User who executed the test")
    status: TestStatus = Field(..., description="Overall execution status")
    environment: str = Field("QA", description="Execution environment")
    version: Optional[str] = Field(None, description="Application version")
    execution_time_seconds: int = Field(..., ge=0, description="Total execution time in seconds")
    step_results: List[StepExecutionResult] = Field(..., min_items=1, description="Step execution results")
    notes: Optional[str] = Field(None, description="Optional notes")
    failure_reason: Optional[str] = Field(None, description="Failure reason if test failed")
    evidence_files: Optional[List[str]] = Field(default=None, description="Global evidence file paths")
    bug_ids: Optional[List[str]] = Field(default=None, description="Related bug IDs")

    @validator('step_results')
    def validate_step_results(cls, v):
        """
        Validaciones adicionales para step_results:
        1. Al menos un step
        2. Todos los steps tienen scenario_name
        3. Step indices son válidos
        """
        if not v:
            raise ValueError("Must have at least one step result")

        # Verificar que todos los steps tengan scenario_name
        scenarios = {step.scenario_name for step in v if step.scenario_name}
        if len(scenarios) == 0:
            raise ValueError("All steps must have a scenario_name")

        # Verificar que step_index sean únicos y consecutivos
        indices = [step.step_index for step in v]
        if len(indices) != len(set(indices)):
            raise ValueError("Step indices must be unique")

        return v

    @validator('test_case_id', 'executed_by')
    def not_empty(cls, v):
        """Ensure required string fields are not empty"""
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "test_case_id": "TC-001",
                "executed_by": "qa.tester@example.com",
                "status": "PASSED",
                "environment": "QA",
                "version": "1.0.0",
                "execution_time_seconds": 120,
                "step_results": [
                    {
                        "step_index": 0,
                        "keyword": "Given",
                        "text": "the user is on the login page",
                        "status": "PASSED",
                        "scenario_name": "User login with valid credentials"
                    },
                    {
                        "step_index": 1,
                        "keyword": "When",
                        "text": "the user enters valid credentials",
                        "status": "PASSED",
                        "scenario_name": "User login with valid credentials"
                    }
                ],
                "notes": "Test executed successfully",
                "failure_reason": None,
                "evidence_files": [],
                "bug_ids": []
            }
        }

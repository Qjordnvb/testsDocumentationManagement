"""
SQLAlchemy database models for tracking
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .db import Base
from backend.models import Priority, Status, TestType, TestPriority, TestStatus, BugSeverity, BugPriority, BugStatus, BugType


class ProjectStatus(str, enum.Enum):
    """Project status enum"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"


class ProjectDB(Base):
    """Project database model - Multi-project support"""
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Client/Team info
    client = Column(String, nullable=True)
    team_members = Column(Text, nullable=True)  # JSON array of emails/names

    # Project metadata
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.ACTIVE)

    # Configuration
    default_test_types = Column(Text, nullable=True)  # JSON array of test types

    # Dates
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_date = Column(DateTime, default=datetime.now)
    updated_date = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Integration IDs
    notion_database_id = Column(String, nullable=True)
    azure_project_id = Column(String, nullable=True)

    # Relationships
    user_stories = relationship("UserStoryDB", back_populates="project", cascade="all, delete-orphan")
    test_cases = relationship("TestCaseDB", back_populates="project", cascade="all, delete-orphan")
    bug_reports = relationship("BugReportDB", back_populates="project", cascade="all, delete-orphan")


class UserStoryDB(Base):
    """User Story database model"""
    __tablename__ = "user_stories"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    # Metadata
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM)
    status = Column(SQLEnum(Status), default=Status.BACKLOG)
    epic = Column(String, nullable=True)
    sprint = Column(String, nullable=True)
    story_points = Column(Integer, nullable=True)
    assigned_to = Column(String, nullable=True)

    # Dates
    created_date = Column(DateTime, default=datetime.now)
    updated_date = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Acceptance Criteria (stored as JSON)
    acceptance_criteria = Column(Text, nullable=True)  # JSON array of AcceptanceCriteria objects

    # Completion tracking
    total_criteria = Column(Integer, default=0)
    completed_criteria = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)

    # Integration IDs
    notion_page_id = Column(String, nullable=True)
    azure_work_item_id = Column(String, nullable=True)

    # Relationships
    project = relationship("ProjectDB", back_populates="user_stories")
    test_cases = relationship("TestCaseDB", back_populates="user_story")
    bug_reports = relationship("BugReportDB", back_populates="user_story")


class TestCaseDB(Base):
    """Test Case database model"""
    __tablename__ = "test_cases"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    # Related user story
    user_story_id = Column(String, ForeignKey("user_stories.id"), nullable=False)

    # Test metadata
    test_type = Column(SQLEnum(TestType), default=TestType.FUNCTIONAL)
    priority = Column(SQLEnum(TestPriority), default=TestPriority.MEDIUM)
    status = Column(SQLEnum(TestStatus), default=TestStatus.NOT_RUN)

    # Execution tracking
    estimated_time_minutes = Column(Integer, nullable=True)
    actual_time_minutes = Column(Integer, nullable=True)
    automated = Column(Boolean, default=False)

    # Dates
    created_date = Column(DateTime, default=datetime.now)
    last_executed = Column(DateTime, nullable=True)
    executed_by = Column(String, nullable=True)

    # Generated files
    gherkin_file_path = Column(String, nullable=True)

    # Integration IDs
    notion_page_id = Column(String, nullable=True)
    azure_test_case_id = Column(String, nullable=True)

    # Relationships
    project = relationship("ProjectDB", back_populates="test_cases")
    user_story = relationship("UserStoryDB", back_populates="test_cases")
    executions = relationship("TestExecutionDB", back_populates="test_case")


class BugReportDB(Base):
    """Bug Report database model"""
    __tablename__ = "bug_reports"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    # Bug details (stored as JSON or newline-separated)
    steps_to_reproduce = Column(Text, nullable=True)  # JSON array or newline-separated
    expected_behavior = Column(Text, nullable=True)
    actual_behavior = Column(Text, nullable=True)

    # Classification
    severity = Column(SQLEnum(BugSeverity), default=BugSeverity.MEDIUM)
    priority = Column(SQLEnum(BugPriority), default=BugPriority.MEDIUM)
    bug_type = Column(SQLEnum(BugType), default=BugType.FUNCTIONAL)
    status = Column(SQLEnum(BugStatus), default=BugStatus.NEW)

    # Context
    environment = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)
    version = Column(String, nullable=True)

    # Relationships
    user_story_id = Column(String, ForeignKey("user_stories.id"), nullable=True)
    test_case_id = Column(String, nullable=True)

    # Evidence (stored as JSON array)
    screenshots = Column(Text, nullable=True)  # JSON array of file paths
    logs = Column(Text, nullable=True)

    # Additional details
    notes = Column(Text, nullable=True)
    workaround = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    fix_description = Column(Text, nullable=True)

    # People
    reported_by = Column(String, nullable=True)
    assigned_to = Column(String, nullable=True)
    verified_by = Column(String, nullable=True)

    # Dates
    reported_date = Column(DateTime, default=datetime.now)
    assigned_date = Column(DateTime, nullable=True)
    fixed_date = Column(DateTime, nullable=True)
    verified_date = Column(DateTime, nullable=True)
    closed_date = Column(DateTime, nullable=True)

    # Generated document
    document_path = Column(String, nullable=True)

    # Integration IDs
    notion_page_id = Column(String, nullable=True)
    azure_bug_id = Column(String, nullable=True)

    # Relationships
    project = relationship("ProjectDB", back_populates="bug_reports")
    user_story = relationship("UserStoryDB", back_populates="bug_reports")


class TestExecutionDB(Base):
    """Test Execution tracking with detailed steps"""
    __tablename__ = "test_executions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    test_case_id = Column(String, ForeignKey("test_cases.id"), nullable=False)

    # Execution details
    executed_by = Column(String, nullable=False) # Por ahora email o nombre
    execution_date = Column(DateTime, default=datetime.now)
    status = Column(SQLEnum(TestStatus), nullable=False)

    # Environment context (NUEVO)
    environment = Column(String, default="QA") # QA, STG, PROD
    version = Column(String, nullable=True)    # v1.0.2, build #123

    # Metrics
    execution_time_minutes = Column(Float, nullable=True) # Cambiado a Float para mayor precisión (segundos/60)
    passed_steps = Column(Integer, default=0)
    failed_steps = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)

    # Detailed Results (NUEVO)
    # Guardaremos JSON como Texto porque SQLite no tiene tipo JSON nativo estricto
    # Estructura: [{"step_id": 1, "keyword": "Given", "text": "...", "status": "PASSED", "actual": "..."}]
    step_results = Column(Text, nullable=True)

    # Evidence (NUEVO)
    # Estructura: ["/uploads/PROJ-1/exec/img1.png", ...]
    evidence_files = Column(Text, nullable=True)

    # Notes and results
    notes = Column(Text, nullable=True)
    failure_reason = Column(Text, nullable=True)

    # Related bugs
    bug_ids = Column(String, nullable=True)  # Comma-separated: "BUG-001,BUG-002"

    # Relationships
    test_case = relationship("TestCaseDB", back_populates="executions")

"""
SQLAlchemy database models for tracking

ARCHITECTURE: Multi-Tenant with Project Isolation
- Each organization (tenant) is completely isolated
- Each project within an organization is isolated
- Composite Foreign Keys enforce referential integrity at both levels
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum, Float, PrimaryKeyConstraint, ForeignKeyConstraint
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


class OrganizationDB(Base):
    """
    Organization (Tenant) model - Multi-tenant support
    Each organization represents a separate company/entity
    """
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, index=True)  # ORG-001, ORG-002
    name = Column(String, nullable=False)
    subdomain = Column(String, unique=True, nullable=True)  # acme, techstart
    domain = Column(String, nullable=True)  # acme.com (for email validation)

    # Settings
    settings = Column(Text, nullable=True)  # JSON
    max_users = Column(Integer, default=50)
    max_projects = Column(Integer, default=100)

    # Billing
    plan = Column(String, default='free')  # free, pro, enterprise
    subscription_status = Column(String, default='active')

    # Security
    is_active = Column(Boolean, default=True)

    # Metadata
    created_date = Column(DateTime, default=datetime.now)
    updated_date = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships
    users = relationship("UserDB", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("ProjectDB", back_populates="organization", cascade="all, delete-orphan")


class ProjectDB(Base):
    """
    Project database model - Multi-project support with organization isolation
    PK: (id, organization_id)
    """
    __tablename__ = "projects"
    __table_args__ = (
        PrimaryKeyConstraint('id', 'organization_id'),
        {},
    )

    id = Column(String, nullable=False, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
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
    organization = relationship("OrganizationDB", back_populates="projects")
    user_stories = relationship("UserStoryDB", back_populates="project", cascade="all, delete-orphan")
    test_cases = relationship("TestCaseDB", back_populates="project", cascade="all, delete-orphan")
    bug_reports = relationship("BugReportDB", back_populates="project", cascade="all, delete-orphan")


class UserStoryDB(Base):
    """
    User Story database model with multi-tenant and multi-project isolation
    PK: (id, project_id, organization_id)
    FK: (project_id, organization_id) → projects
    """
    __tablename__ = "user_stories"
    __table_args__ = (
        PrimaryKeyConstraint('id', 'project_id', 'organization_id'),
        ForeignKeyConstraint(
            ['project_id', 'organization_id'],
            ['projects.id', 'projects.organization_id'],
            ondelete='CASCADE'
        ),
        {},
    )

    id = Column(String, nullable=False, index=True)
    project_id = Column(String, nullable=False, index=True)
    organization_id = Column(String, nullable=False, index=True)

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

    # --- FIX: Added overlaps to silence SAWarnings ---
    test_cases = relationship(
        "TestCaseDB",
        back_populates="user_story",
        cascade="all, delete-orphan",
        overlaps="project,test_cases"
    )
    bug_reports = relationship(
        "BugReportDB",
        back_populates="user_story",
        overlaps="project,bug_reports"
    )


class TestCaseDB(Base):
    """
    Test Case database model with complete isolation
    PK: (id, project_id, organization_id)
    FK: (project_id, organization_id) → projects
    FK: (user_story_id, project_id, organization_id) → user_stories

    CRITICAL FIX: Composite FK ensures test cases are isolated by both organization AND project
    """
    __tablename__ = "test_cases"
    __table_args__ = (
        PrimaryKeyConstraint('id', 'project_id', 'organization_id'),
        ForeignKeyConstraint(
            ['project_id', 'organization_id'],
            ['projects.id', 'projects.organization_id'],
            ondelete='CASCADE'
        ),
        ForeignKeyConstraint(
            ['user_story_id', 'project_id', 'organization_id'],
            ['user_stories.id', 'user_stories.project_id', 'user_stories.organization_id'],
            ondelete='CASCADE'
        ),
        {},
    )

    id = Column(String, nullable=False, index=True)
    project_id = Column(String, nullable=False, index=True)
    organization_id = Column(String, nullable=False, index=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    # Related user story (part of composite FK)
    user_story_id = Column(String, nullable=False)

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
    # --- FIX: Added overlaps to silence SAWarnings ---
    project = relationship("ProjectDB", back_populates="test_cases", overlaps="test_cases")
    user_story = relationship("UserStoryDB", back_populates="test_cases", overlaps="project,test_cases")

    executions = relationship("TestExecutionDB", back_populates="test_case", cascade="all, delete-orphan")


class BugReportDB(Base):
    """
    Bug Report database model with complete isolation
    PK: (id, project_id, organization_id)
    FK: (project_id, organization_id) → projects
    FK: (user_story_id, project_id, organization_id) → user_stories (optional)
    FK: (test_case_id, project_id, organization_id) → test_cases (optional)
    """
    __tablename__ = "bug_reports"
    __table_args__ = (
        PrimaryKeyConstraint('id', 'project_id', 'organization_id'),
        ForeignKeyConstraint(
            ['project_id', 'organization_id'],
            ['projects.id', 'projects.organization_id'],
            ondelete='CASCADE'
        ),
        # Optional FKs - CASCADE for test_case (delete bugs when test deleted)
        ForeignKeyConstraint(
            ['user_story_id', 'project_id', 'organization_id'],
            ['user_stories.id', 'user_stories.project_id', 'user_stories.organization_id'],
            ondelete='SET NULL'  # User story can be deleted without deleting bugs
        ),
        ForeignKeyConstraint(
            ['test_case_id', 'project_id', 'organization_id'],
            ['test_cases.id', 'test_cases.project_id', 'test_cases.organization_id'],
            ondelete='CASCADE'  # CRITICAL: Cascade delete bugs when test case is deleted
        ),
        {},
    )

    id = Column(String, nullable=False, index=True)
    project_id = Column(String, nullable=False, index=True)
    organization_id = Column(String, nullable=False, index=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    # Bug classification
    severity = Column(SQLEnum(BugSeverity), nullable=False)
    priority = Column(SQLEnum(BugPriority), nullable=False)
    bug_type = Column(SQLEnum(BugType), nullable=False)

    # --- FIX: Ensure default is NEW (OPEN does not exist in Enum) ---
    status = Column(SQLEnum(BugStatus), default=BugStatus.NEW)

    # Related entities (optional, part of composite FKs)
    user_story_id = Column(String, nullable=True)
    test_case_id = Column(String, nullable=True)
    execution_id = Column(Integer, nullable=True)  # Simple FK, no composite needed

    # Assignment
    reported_by = Column(String, nullable=False)
    assigned_to = Column(String, nullable=True)

    # Environment
    environment = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)
    version = Column(String, nullable=True)  # Added version

    # Steps to reproduce
    steps_to_reproduce = Column(Text, nullable=True)
    scenario_name = Column(String, nullable=True)  # Added scenario_name
    expected_behavior = Column(Text, nullable=True)
    actual_behavior = Column(Text, nullable=True)

    # Attachments
    screenshot_path = Column(String, nullable=True)
    log_file_path = Column(String, nullable=True)
    attachments = Column(Text, nullable=True)  # JSON array

    # Workflow tracking - QA ↔ DEV process
    fix_description = Column(Text, nullable=True)  # DEV explains the fix
    root_cause = Column(Text, nullable=True)  # Root cause analysis
    workaround = Column(Text, nullable=True)  # Temporary solution
    notes = Column(Text, nullable=True)  # General notes
    verified_by = Column(String, nullable=True)  # QA who verified the fix

    # Dates - Bug lifecycle tracking
    reported_date = Column(DateTime, default=datetime.now)  # RENAMED from created_date
    assigned_date = Column(DateTime, nullable=True)  # When bug was assigned to DEV
    fixed_date = Column(DateTime, nullable=True)  # When DEV marked as fixed
    verified_date = Column(DateTime, nullable=True)  # When QA verified the fix
    closed_date = Column(DateTime, nullable=True)  # When bug was closed
    updated_date = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    resolved_date = Column(DateTime, nullable=True)  # Legacy: kept for backwards compatibility

    # Relationships
    # --- FIX: Added overlaps to silence SAWarnings ---
    project = relationship("ProjectDB", back_populates="bug_reports", overlaps="bug_reports")
    user_story = relationship("UserStoryDB", back_populates="bug_reports", overlaps="bug_reports,project")


class BugCommentDB(Base):
    """
    Bug Comment database model for QA-DEV communication
    PK: (id, project_id, organization_id)
    FK: (bug_id, project_id, organization_id) → bug_reports

    Enables threaded discussions on bugs with author tracking and soft delete
    """
    __tablename__ = "bug_comments"
    __table_args__ = (
        PrimaryKeyConstraint('id', 'project_id', 'organization_id'),
        ForeignKeyConstraint(
            ['project_id', 'organization_id'],
            ['projects.id', 'projects.organization_id'],
            ondelete='CASCADE'
        ),
        ForeignKeyConstraint(
            ['bug_id', 'project_id', 'organization_id'],
            ['bug_reports.id', 'bug_reports.project_id', 'bug_reports.organization_id'],
            ondelete='CASCADE'  # Delete comments when bug is deleted
        ),
        {},
    )

    id = Column(String, nullable=False, index=True)  # CMT-{timestamp}-{random}
    project_id = Column(String, nullable=False, index=True)
    organization_id = Column(String, nullable=False, index=True)

    # Foreign Key to bug_reports (part of composite FK)
    bug_id = Column(String, nullable=False, index=True)

    # Author information
    author_email = Column(String, nullable=False)
    author_name = Column(String, nullable=False)
    author_role = Column(String, nullable=False)  # "qa", "dev", "manager", "admin"

    # Content
    text = Column(Text, nullable=False)

    # Mentions (JSON array of emails)
    mentions = Column(Text, nullable=True)  # JSON: ["dev@company.com", "qa@company.com"]

    # Attachment (single file, similar to bug_reports)
    attachment_path = Column(String, nullable=True)

    # Dates - Standard lifecycle tracking
    created_date = Column(DateTime, default=datetime.now)
    updated_date = Column(DateTime, nullable=True)

    # Soft delete
    is_deleted = Column(Boolean, default=False)


class TestExecutionDB(Base):
    """
    Test Execution database model
    PK: id (auto-increment, simple)
    FK: (test_case_id, project_id, organization_id) → test_cases
    """
    __tablename__ = "test_executions"
    __table_args__ = (
        ForeignKeyConstraint(
            ['test_case_id', 'project_id', 'organization_id'],
            ['test_cases.id', 'test_cases.project_id', 'test_cases.organization_id'],
            ondelete='CASCADE'
        ),
        {},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Composite FK to test_cases
    test_case_id = Column(String, nullable=False, index=True)
    project_id = Column(String, nullable=False, index=True)
    organization_id = Column(String, nullable=False, index=True)

    # Execution details
    status = Column(String, nullable=False)  # PASSED, FAILED, BLOCKED, SKIPPED
    executed_by = Column(String, nullable=False)
    execution_date = Column(DateTime, default=datetime.now)
    duration_seconds = Column(Integer, nullable=True)

    # Results
    notes = Column(Text, nullable=True)
    steps_results = Column(Text, nullable=True)  # JSON array of step results
    screenshot_path = Column(String, nullable=True)
    log_file_path = Column(String, nullable=True)

    # Environment
    environment = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)

    # Relationships
    test_case = relationship("TestCaseDB", back_populates="executions")


class Role(str, enum.Enum):
    """User roles"""
    ADMIN = "admin"
    QA = "qa"
    DEV = "dev"
    MANAGER = "manager"


class UserDB(Base):
    """
    User database model with organization isolation
    PK: id
    FK: organization_id → organizations

    UNIQUE: (email, organization_id) - Same email can exist in different orgs
    """
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)

    email = Column(String, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(Role), default=Role.QA)

    # Account status
    is_active = Column(Boolean, default=True)
    is_registered = Column(Boolean, default=False)

    # Invitation tracking
    invited_by = Column(String, nullable=True)
    invited_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.now)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    organization = relationship("OrganizationDB", back_populates="users")

    __table_args__ = (
        # Same email can exist in different organizations
        {'sqlite_autoincrement': True},
    )

    # Note: Unique constraint (email, organization_id) will be added in migration

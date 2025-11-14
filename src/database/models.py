"""
SQLAlchemy database models for tracking
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .db import Base
from src.models import Priority, Status, TestType, TestPriority, TestStatus, BugSeverity, BugPriority, BugStatus, BugType


class UserStoryDB(Base):
    """User Story database model"""
    __tablename__ = "user_stories"

    id = Column(String, primary_key=True, index=True)
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

    # Completion tracking
    total_criteria = Column(Integer, default=0)
    completed_criteria = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)

    # Integration IDs
    notion_page_id = Column(String, nullable=True)
    azure_work_item_id = Column(String, nullable=True)

    # Relationships
    test_cases = relationship("TestCaseDB", back_populates="user_story")
    bug_reports = relationship("BugReportDB", back_populates="user_story")


class TestCaseDB(Base):
    """Test Case database model"""
    __tablename__ = "test_cases"

    id = Column(String, primary_key=True, index=True)
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
    user_story = relationship("UserStoryDB", back_populates="test_cases")
    executions = relationship("TestExecutionDB", back_populates="test_case")


class BugReportDB(Base):
    """Bug Report database model"""
    __tablename__ = "bug_reports"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)

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
    user_story = relationship("UserStoryDB", back_populates="bug_reports")


class TestExecutionDB(Base):
    """Test Execution tracking"""
    __tablename__ = "test_executions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    test_case_id = Column(String, ForeignKey("test_cases.id"), nullable=False)

    # Execution details
    executed_by = Column(String, nullable=False)
    execution_date = Column(DateTime, default=datetime.now)
    status = Column(SQLEnum(TestStatus), nullable=False)

    # Metrics
    execution_time_minutes = Column(Integer, nullable=True)
    passed_steps = Column(Integer, default=0)
    failed_steps = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)

    # Notes and results
    notes = Column(Text, nullable=True)
    failure_reason = Column(Text, nullable=True)

    # Related bugs
    bug_ids = Column(String, nullable=True)  # Comma-separated bug IDs

    # Relationships
    test_case = relationship("TestCaseDB", back_populates="executions")

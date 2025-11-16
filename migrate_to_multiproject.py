#!/usr/bin/env python3
"""
Database Migration Script: Multi-Project Architecture
Drops existing tables and recreates them with project_id support
"""
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.database.db import Base, engine
from backend.database.models import ProjectDB, UserStoryDB, TestCaseDB, BugReportDB, TestExecutionDB
from backend.config import settings


def migrate_database():
    """Drop all existing tables and recreate with multi-project support"""
    print("=" * 60)
    print("DATABASE MIGRATION: Multi-Project Architecture")
    print("=" * 60)
    print()
    print("⚠️  WARNING: This will DELETE ALL existing data!")
    print("   - All user stories")
    print("   - All test cases")
    print("   - All bug reports")
    print("   - All test executions")
    print()

    confirm = input("Are you sure you want to proceed? (type 'yes' to confirm): ")
    if confirm.lower() != 'yes':
        print("❌ Migration cancelled.")
        return

    print()
    print("📁 Ensuring required directories exist...")
    try:
        settings.ensure_directories()
        print("✅ Directories created/verified")
    except Exception as e:
        print(f"❌ Error creating directories: {e}")
        sys.exit(1)

    print()
    print("🗑️  Dropping existing tables...")
    try:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        print("✅ All existing tables dropped successfully")
    except Exception as e:
        print(f"⚠️  Error dropping tables (may not exist): {e}")

    print()
    print("🏗️  Creating new tables with multi-project support...")
    try:
        # Create all tables with new schema
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully:")
        print("   ✓ projects (NEW)")
        print("   ✓ user_stories (with project_id)")
        print("   ✓ test_cases (with project_id)")
        print("   ✓ bug_reports (with project_id)")
        print("   ✓ test_executions")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)

    print()
    print("=" * 60)
    print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Start the backend server: python backend/main.py")
    print("2. Create your first project via API: POST /api/v1/projects")
    print("3. Upload user stories to the project")
    print()


if __name__ == "__main__":
    migrate_database()

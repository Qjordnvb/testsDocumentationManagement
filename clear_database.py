#!/usr/bin/env python3
"""
Clear Database Script
Deletes ALL data and optionally drops/recreates tables
"""
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.database.db import Base, engine, SessionLocal
from backend.database.models import ProjectDB, UserStoryDB, TestCaseDB, BugReportDB, TestExecutionDB
from backend.config import settings


def clear_all_data():
    """Delete all data but keep table structure"""
    print("=" * 60)
    print("DATABASE CLEAR: Delete All Data (Keep Tables)")
    print("=" * 60)
    print()
    print("⚠️  WARNING: This will DELETE ALL data!")
    print("   - All projects")
    print("   - All user stories")
    print("   - All test cases")
    print("   - All bug reports")
    print("   - All test executions")
    print()
    print("📋 Table structure will be preserved (no schema changes)")
    print()

    confirm = input("Are you sure you want to proceed? (type 'yes' to confirm): ")
    if confirm.lower() != 'yes':
        print("❌ Operation cancelled.")
        return

    db = SessionLocal()
    try:
        print()
        print("🗑️  Deleting all data...")

        # Delete in correct order (children first, parents last)
        # to avoid foreign key constraint errors
        test_exec_count = db.query(TestExecutionDB).delete()
        print(f"   ✓ Deleted {test_exec_count} test executions")

        bug_count = db.query(BugReportDB).delete()
        print(f"   ✓ Deleted {bug_count} bug reports")

        test_case_count = db.query(TestCaseDB).delete()
        print(f"   ✓ Deleted {test_case_count} test cases")

        user_story_count = db.query(UserStoryDB).delete()
        print(f"   ✓ Deleted {user_story_count} user stories")

        project_count = db.query(ProjectDB).delete()
        print(f"   ✓ Deleted {project_count} projects")

        db.commit()
        print()
        print("✅ All data deleted successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting data: {e}")
        sys.exit(1)
    finally:
        db.close()

    print()
    print("=" * 60)
    print("✅ DATABASE CLEARED SUCCESSFULLY!")
    print("=" * 60)
    print()


def drop_and_recreate_tables():
    """Drop all tables and recreate them (complete reset)"""
    print("=" * 60)
    print("DATABASE RESET: Drop and Recreate Tables")
    print("=" * 60)
    print()
    print("⚠️  WARNING: This will:")
    print("   1. DELETE ALL data")
    print("   2. DROP all tables")
    print("   3. RECREATE tables with current schema")
    print()

    confirm = input("Are you sure you want to proceed? (type 'yes' to confirm): ")
    if confirm.lower() != 'yes':
        print("❌ Operation cancelled.")
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
        Base.metadata.drop_all(bind=engine)
        print("✅ All existing tables dropped successfully")
    except Exception as e:
        print(f"⚠️  Error dropping tables (may not exist): {e}")

    print()
    print("🏗️  Creating new tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully:")
        print("   ✓ projects")
        print("   ✓ user_stories")
        print("   ✓ test_cases")
        print("   ✓ bug_reports")
        print("   ✓ test_executions")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)

    print()
    print("=" * 60)
    print("✅ DATABASE RESET COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print()


def delete_database_file():
    """Delete the SQLite database file completely"""
    print("=" * 60)
    print("DATABASE DELETE: Remove Database File")
    print("=" * 60)
    print()

    # Extract database file path from URL
    db_url = settings.database_url
    if db_url.startswith("sqlite:///"):
        db_file = db_url.replace("sqlite:///", "")
        db_file = db_file.replace("./", "")
    else:
        print(f"⚠️  Cannot delete non-SQLite database: {db_url}")
        return

    if not os.path.exists(db_file):
        print(f"ℹ️  Database file does not exist: {db_file}")
        print("   Nothing to delete.")
        return

    print(f"⚠️  WARNING: This will DELETE the database file:")
    print(f"   📂 {db_file}")
    print()

    confirm = input("Are you sure you want to proceed? (type 'yes' to confirm): ")
    if confirm.lower() != 'yes':
        print("❌ Operation cancelled.")
        return

    try:
        os.remove(db_file)
        print(f"✅ Database file deleted: {db_file}")
        print()
        print("💡 Next time you start the backend, a new empty database will be created.")
    except Exception as e:
        print(f"❌ Error deleting file: {e}")
        sys.exit(1)

    print()
    print("=" * 60)
    print("✅ DATABASE FILE DELETED SUCCESSFULLY!")
    print("=" * 60)
    print()


def main():
    print("\n" + "=" * 60)
    print("         DATABASE MANAGEMENT TOOL")
    print("=" * 60)
    print()
    print("Choose an option:")
    print()
    print("1. Clear all data (keep table structure)")
    print("   - Fastest option")
    print("   - Deletes all records")
    print("   - Preserves table schema")
    print()
    print("2. Drop and recreate tables")
    print("   - Deletes all data")
    print("   - Drops all tables")
    print("   - Creates tables again (fresh schema)")
    print()
    print("3. Delete database file completely")
    print("   - NUCLEAR option")
    print("   - Deletes the .db file")
    print("   - New DB created on next backend start")
    print()
    print("4. Exit")
    print()

    choice = input("Enter your choice (1-4): ").strip()

    if choice == "1":
        clear_all_data()
    elif choice == "2":
        drop_and_recreate_tables()
    elif choice == "3":
        delete_database_file()
    elif choice == "4":
        print("👋 Exiting...")
    else:
        print("❌ Invalid choice. Exiting.")
        sys.exit(1)


if __name__ == "__main__":
    main()

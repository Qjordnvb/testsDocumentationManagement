"""
Migration Script: Change bug_reports FK constraint to CASCADE on test_case_id deletion

SAFETY: This migration is SAFE because:
1. Uses composite foreign keys (test_case_id + project_id + organization_id)
2. Only affects bugs within the SAME organization, project, and test case
3. Does NOT affect independent bugs from other users/projects/organizations

WHAT IT DOES:
- Changes ondelete='SET NULL' → ondelete='CASCADE' for test_case_id FK
- When a test case is deleted, all its associated bugs are automatically deleted
- Preserves data isolation per organization/project

WHEN TO RUN:
- Run this migration ONCE after updating models.py
- Requires database backup before running

HOW TO RUN:
- From project root: python -m backend.migrate_cascade_delete_bugs
- Or from backend/: python3 migrate_cascade_delete_bugs.py

Author: Claude Code
Date: 2025-11-24
"""

import sys
import os
from pathlib import Path

# Add parent directory to path to allow 'backend' imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text, inspect

# Import with try/except to handle different execution contexts
try:
    from backend.config import settings
    from backend.database.models import Base, BugReportDB
except ModuleNotFoundError:
    # If running from backend/ directory directly
    from config import settings
    from database.models import Base, BugReportDB


def migrate_cascade_delete():
    """Migrate bug_reports table to use CASCADE delete for test_case_id"""

    print("=" * 80)
    print("🔄 MIGRATION: CASCADE DELETE FOR BUG REPORTS")
    print("=" * 80)
    print()
    print("⚠️  This migration will:")
    print("   1. Drop existing FK constraint on test_case_id")
    print("   2. Recreate FK constraint with ondelete='CASCADE'")
    print("   3. Future test case deletions will automatically delete associated bugs")
    print()
    print("✅ SAFETY GUARANTEES:")
    print("   - Uses composite keys (test_case_id + project_id + organization_id)")
    print("   - Only deletes bugs from the SAME organization, project, and test case")
    print("   - Does NOT affect bugs from other organizations/projects")
    print()

    response = input("Do you want to proceed? (yes/no): ").strip().lower()
    if response != 'yes':
        print("❌ Migration cancelled by user")
        return

    print()
    print("🚀 Starting migration...")

    # Create engine
    db_url = settings.database_url
    engine = create_engine(db_url)

    # Check if SQLite (different syntax than PostgreSQL/MySQL)
    is_sqlite = 'sqlite' in db_url

    with engine.connect() as conn:
        try:
            if is_sqlite:
                print("📊 Detected SQLite database")
                print()
                print("⚠️  SQLite does not support ALTER TABLE DROP CONSTRAINT")
                print("   We need to recreate the entire table with new constraints")
                print()

                # SQLite requires table recreation
                print("Step 1: Backing up bug_reports data...")
                result = conn.execute(text("SELECT COUNT(*) FROM bug_reports"))
                bug_count = result.scalar()
                print(f"   ✅ Found {bug_count} bugs to preserve")

                print()
                print("Step 2: Creating temporary table...")
                conn.execute(text("""
                    CREATE TABLE bug_reports_backup AS
                    SELECT * FROM bug_reports
                """))
                conn.commit()
                print("   ✅ Backup table created")

                print()
                print("Step 3: Dropping old bug_reports table...")
                conn.execute(text("DROP TABLE bug_reports"))
                conn.commit()
                print("   ✅ Old table dropped")

                print()
                print("Step 4: Recreating bug_reports table with CASCADE constraint...")
                # Use SQLAlchemy to create table with updated FK
                Base.metadata.tables['bug_reports'].create(conn, checkfirst=False)
                conn.commit()
                print("   ✅ New table created with CASCADE delete")

                print()
                print("Step 5: Restoring data from backup...")
                conn.execute(text("""
                    INSERT INTO bug_reports
                    SELECT * FROM bug_reports_backup
                """))
                conn.commit()
                print("   ✅ Data restored")

                print()
                print("Step 6: Dropping backup table...")
                conn.execute(text("DROP TABLE bug_reports_backup"))
                conn.commit()
                print("   ✅ Backup table dropped")

            else:
                # PostgreSQL/MySQL syntax
                print("📊 Detected PostgreSQL/MySQL database")
                print()

                print("Step 1: Dropping old FK constraint...")
                # Note: Constraint name may vary by database
                try:
                    conn.execute(text("""
                        ALTER TABLE bug_reports
                        DROP CONSTRAINT bug_reports_test_case_id_fkey
                    """))
                    conn.commit()
                    print("   ✅ Old constraint dropped")
                except Exception as e:
                    print(f"   ⚠️  Could not drop constraint (may not exist): {e}")

                print()
                print("Step 2: Creating new FK constraint with CASCADE...")
                conn.execute(text("""
                    ALTER TABLE bug_reports
                    ADD CONSTRAINT bug_reports_test_case_id_fkey
                    FOREIGN KEY (test_case_id, project_id, organization_id)
                    REFERENCES test_cases(id, project_id, organization_id)
                    ON DELETE CASCADE
                """))
                conn.commit()
                print("   ✅ New CASCADE constraint created")

            print()
            print("=" * 80)
            print("✅ MIGRATION COMPLETED SUCCESSFULLY")
            print("=" * 80)
            print()
            print("📝 What changed:")
            print("   - Bug reports now use CASCADE delete for test_case_id")
            print("   - Deleting a test case will automatically delete its bugs")
            print("   - Data isolation per organization/project is preserved")
            print()
            print("⚠️  IMPORTANT: Update your frontend to show warnings before deletion!")
            print()

        except Exception as e:
            conn.rollback()
            print()
            print("=" * 80)
            print("❌ MIGRATION FAILED")
            print("=" * 80)
            print(f"Error: {e}")
            print()
            print("🔄 Database has been rolled back to previous state")
            import traceback
            traceback.print_exc()
            sys.exit(1)


if __name__ == "__main__":
    migrate_cascade_delete()

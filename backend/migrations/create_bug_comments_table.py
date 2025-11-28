"""
CRITICAL DATABASE MIGRATION: Create Bug Comments Table
========================================================

This migration creates the bug_comments table for QA-DEV communication:

1. CREATE TABLE bug_comments:
   - Composite PK: (id, project_id, organization_id)
   - FK to projects: (project_id, organization_id)
   - FK to bug_reports: (bug_id, project_id, organization_id)
   - Columns:
     - id (String): CMT-{timestamp}-{random}
     - bug_id (String): Foreign key to bug_reports
     - author_email, author_name, author_role (String): Comment author
     - text (Text): Comment content
     - mentions (Text): JSON array of mentioned emails
     - attachment_path (String): Optional file attachment
     - created_date, updated_date (DateTime): Lifecycle tracking
     - is_deleted (Boolean): Soft delete flag

SAFETY MEASURES:
- Backup is MANDATORY before running this migration
- Validates table doesn't exist before creation
- Uses SQLAlchemy (not raw SQL) for consistency
- Rollback function included for safety

USAGE:
    docker exec qa_backend python3 migrations/create_bug_comments_table.py

Author: Claude Code (Anthropic)
Date: 2025-11-26
"""

import sys
import os
from pathlib import Path
from datetime import datetime
import shutil

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from database.db import engine, SessionLocal
from database.models import BugCommentDB
from sqlalchemy import text, inspect, Table, Column, String, Text, DateTime, Boolean, MetaData, PrimaryKeyConstraint, ForeignKeyConstraint


class BugCommentsMigration:
    """Migration class for creating bug_comments table"""

    def __init__(self):
        self.db_path = "/app/backend/database/qa.db"
        self.backup_path = None

    def backup_database(self) -> str:
        """
        Create backup of database before migration

        Returns:
            Path to backup file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{self.db_path}.backup_{timestamp}"

        print(f"📦 Creating backup: {backup_path}")

        shutil.copy2(self.db_path, backup_path)

        # Verify backup
        if not os.path.exists(backup_path):
            raise RuntimeError("Backup creation failed!")

        backup_size = os.path.getsize(backup_path)
        original_size = os.path.getsize(self.db_path)

        if backup_size != original_size:
            raise RuntimeError("Backup size mismatch!")

        print(f"✅ Backup created successfully ({backup_size} bytes)")
        self.backup_path = backup_path
        return backup_path

    def check_table_exists(self, table_name: str) -> bool:
        """Check if table exists in database"""
        inspector = inspect(engine)
        return table_name in inspector.get_table_names()

    def migrate_up(self):
        """
        Apply migration: Create bug_comments table
        """
        print("\n" + "="*70)
        print("🚀 STARTING MIGRATION: Create Bug Comments Table")
        print("="*70 + "\n")

        # Step 1: Validate current state
        print("Step 1/4: Validating current state...")

        if self.check_table_exists('bug_comments'):
            print("⚠️  WARNING: bug_comments table already exists!")
            print("   This migration may have been run before.")
            response = input("   Continue anyway? (yes/no): ")
            if response.lower() != 'yes':
                print("❌ Migration aborted by user")
                return False

        # Verify bug_reports table exists (required for FK)
        if not self.check_table_exists('bug_reports'):
            print("❌ ERROR: bug_reports table does not exist!")
            print("   Cannot create bug_comments without bug_reports table.")
            return False

        print("   ✅ Validation passed")

        # Step 2: Create backup
        print("\nStep 2/4: Creating backup...")
        self.backup_database()

        # Step 3: Create table using SQLAlchemy
        print("\nStep 3/4: Creating bug_comments table...")

        try:
            metadata = MetaData()

            bug_comments = Table(
                'bug_comments',
                metadata,
                Column('id', String, nullable=False, index=True),
                Column('project_id', String, nullable=False, index=True),
                Column('organization_id', String, nullable=False, index=True),
                Column('bug_id', String, nullable=False, index=True),
                Column('author_email', String, nullable=False),
                Column('author_name', String, nullable=False),
                Column('author_role', String, nullable=False),
                Column('text', Text, nullable=False),
                Column('mentions', Text, nullable=True),
                Column('attachment_path', String, nullable=True),
                Column('created_date', DateTime, default=datetime.now),
                Column('updated_date', DateTime, nullable=True),
                Column('is_deleted', Boolean, default=False),

                # Composite Primary Key
                PrimaryKeyConstraint('id', 'project_id', 'organization_id'),

                # Foreign Keys
                ForeignKeyConstraint(
                    ['project_id', 'organization_id'],
                    ['projects.id', 'projects.organization_id'],
                    ondelete='CASCADE'
                ),
                ForeignKeyConstraint(
                    ['bug_id', 'project_id', 'organization_id'],
                    ['bug_reports.id', 'bug_reports.project_id', 'bug_reports.organization_id'],
                    ondelete='CASCADE'
                ),
            )

            # Create table
            metadata.create_all(engine, tables=[bug_comments])

            print("   ✅ Table created successfully")

        except Exception as e:
            print(f"   ❌ ERROR creating table: {e}")
            raise

        # Step 4: Validate migration
        print("\nStep 4/4: Validating migration...")

        if not self.check_table_exists('bug_comments'):
            print("   ❌ ERROR: bug_comments table was not created!")
            return False

        # Verify table structure
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('bug_comments')]

        required_columns = [
            'id', 'project_id', 'organization_id', 'bug_id',
            'author_email', 'author_name', 'author_role',
            'text', 'mentions', 'attachment_path',
            'created_date', 'updated_date', 'is_deleted'
        ]

        missing_columns = [col for col in required_columns if col not in columns]
        if missing_columns:
            print(f"   ❌ ERROR: Missing columns: {missing_columns}")
            return False

        print(f"   ✅ Table structure validated")
        print(f"   ✅ Found all {len(required_columns)} required columns")

        print("\n" + "="*70)
        print("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*70)
        print(f"\n💾 Backup saved at: {self.backup_path}")
        print("   Keep this backup until you verify the system works correctly.")
        print("\n⚠️  NEXT STEPS:")
        print("   1. Table bug_comments is ready for use")
        print("   2. Restart backend if needed: uvicorn main:app --reload")
        print("   3. Test comment creation/retrieval")
        print("   4. If everything works, you can delete the backup")

        return True

    def migrate_down(self):
        """
        Rollback migration: Drop bug_comments table

        WARNING: This will DELETE all comments!
        """
        print("\n" + "="*70)
        print("⚠️  ROLLBACK: Dropping Bug Comments Table")
        print("="*70 + "\n")

        print("⚠️  WARNING: This will delete ALL bug comments!")
        response = input("   Are you SURE you want to rollback? (yes/no): ")

        if response.lower() != 'yes':
            print("❌ Rollback aborted by user")
            return False

        # Create backup before rollback
        print("\nCreating backup before rollback...")
        self.backup_database()

        try:
            # Drop table
            print("\nDropping bug_comments table...")

            with engine.connect() as conn:
                conn.execute(text("DROP TABLE IF EXISTS bug_comments"))
                conn.commit()

            print("   ✅ Table dropped successfully")

            # Verify
            if self.check_table_exists('bug_comments'):
                print("   ❌ ERROR: Table still exists after drop!")
                return False

            print("\n" + "="*70)
            print("🎉 ROLLBACK COMPLETED SUCCESSFULLY!")
            print("="*70)
            print(f"\n💾 Backup saved at: {self.backup_path}")

            return True

        except Exception as e:
            print(f"❌ ERROR during rollback: {e}")
            raise


def main():
    """Main execution function"""
    print("\n" + "="*70)
    print("BUG COMMENTS TABLE MIGRATION TOOL")
    print("="*70)
    print("\nThis migration will:")
    print("  1. Create bug_comments table with composite PK")
    print("  2. Add foreign keys to projects and bug_reports")
    print("  3. Enable QA-DEV communication on bugs")
    print("\n⚠️  CRITICAL: Backup will be created automatically")
    print("   Location: backend/database/qa.db.backup_TIMESTAMP")
    print("\n" + "="*70 + "\n")

    response = input("Ready to proceed? (yes/no): ")
    if response.lower() != 'yes':
        print("\n❌ Migration aborted by user")
        sys.exit(0)

    migration = BugCommentsMigration()

    try:
        success = migration.migrate_up()
        if not success:
            print("\n❌ Migration failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ MIGRATION FAILED: {e}")
        print(f"\n💾 Database backup available at: {migration.backup_path}")
        print("   To restore:")
        print("   1. Stop backend")
        print(f"   2. cp {migration.backup_path} backend/database/qa.db")
        print("   3. Restart backend")
        sys.exit(1)


if __name__ == "__main__":
    main()

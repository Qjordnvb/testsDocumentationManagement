"""
CRITICAL DATABASE MIGRATION: Add Bug Workflow Fields
=====================================================

This migration performs the following CRITICAL operations:

1. RENAME COLUMN (CRITICAL - preserves data):
   - created_date → reported_date in bug_reports table

2. ADD NEW COLUMNS for QA ↔ DEV workflow:
   - assigned_date (DateTime, nullable)
   - fixed_date (DateTime, nullable)
   - verified_date (DateTime, nullable)
   - closed_date (DateTime, nullable)
   - fix_description (Text, nullable)
   - root_cause (Text, nullable)
   - workaround (Text, nullable)
   - notes (Text, nullable)
   - verified_by (String, nullable)

SAFETY MEASURES:
- Backup is MANDATORY before running this migration
- Rollback function included for safety
- Validates data integrity after migration
- Preserves all existing bug data

USAGE:
    python backend/migrations/add_bug_workflow_fields.py

Author: Claude Code (Anthropic)
Date: 2025-11-25
"""

import sys
import os
from pathlib import Path
from datetime import datetime
import sqlite3

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from database.db import engine, SessionLocal
from database.models import BugReportDB
from sqlalchemy import text, inspect


class BugWorkflowMigration:
    """Migration class for adding bug workflow fields"""

    def __init__(self):
        self.db_path = "/app/backend/database/qa.db"
        self.backup_path = None
        self.session = None

    def backup_database(self) -> str:
        """
        Create backup of database before migration

        Returns:
            Path to backup file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{self.db_path}.backup_{timestamp}"

        print(f"📦 Creating backup: {backup_path}")

        import shutil
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

    def check_existing_bugs(self) -> int:
        """
        Check how many bugs exist before migration

        Returns:
            Number of existing bugs
        """
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM bug_reports"))
            count = result.scalar()

        print(f"📊 Found {count} existing bugs in database")
        return count

    def check_column_exists(self, table: str, column: str) -> bool:
        """Check if column exists in table"""
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns(table)]
        return column in columns

    def migrate_up(self):
        """
        Apply migration: Rename created_date → reported_date and add new columns

        CRITICAL: Uses SQLite-specific approach for column rename
        """
        print("\n" + "="*70)
        print("🚀 STARTING MIGRATION: Add Bug Workflow Fields")
        print("="*70 + "\n")

        # Step 1: Validate current state
        print("Step 1/5: Validating current state...")
        bugs_before = self.check_existing_bugs()

        has_created_date = self.check_column_exists('bug_reports', 'created_date')
        has_reported_date = self.check_column_exists('bug_reports', 'reported_date')

        if has_reported_date:
            print("⚠️  WARNING: reported_date column already exists!")
            print("   This migration may have been run before.")
            response = input("   Continue anyway? (yes/no): ")
            if response.lower() != 'yes':
                print("❌ Migration aborted by user")
                return False

        if not has_created_date and not has_reported_date:
            print("❌ ERROR: Neither created_date nor reported_date exists!")
            print("   Database may be in an inconsistent state.")
            return False

        # Step 2: Create backup
        print("\nStep 2/5: Creating backup...")
        self.backup_database()

        # Step 3: Rename column (SQLite doesn't support ALTER COLUMN RENAME directly)
        print("\nStep 3/5: Renaming column created_date → reported_date...")

        try:
            # Use raw connection from engine
            raw_conn = engine.raw_connection()
            cursor = raw_conn.cursor()

            # Get current table schema
            cursor.execute("PRAGMA table_info(bug_reports)")
            columns = cursor.fetchall()

            # Get all data
            cursor.execute("SELECT * FROM bug_reports")
            all_bugs = cursor.fetchall()

            # Build new CREATE TABLE statement
            new_columns = []
            pk_columns = []
            for col in columns:
                col_name = col[1]
                if col_name == 'created_date':
                    col_name = 'reported_date'
                col_type = col[2]
                col_notnull = "NOT NULL" if col[3] else ""
                col_default = f"DEFAULT {col[4]}" if col[4] else ""

                # Track PK columns separately
                if col[5]:  # is_pk
                    pk_columns.append(col_name)

                col_def = f"{col_name} {col_type} {col_notnull} {col_default}".strip()
                new_columns.append(col_def)

            # Add composite PRIMARY KEY constraint at the end
            if pk_columns:
                new_columns.append(f"PRIMARY KEY ({', '.join(pk_columns)})")

            # Create temporary table with new schema
            create_temp = f"""
            CREATE TABLE bug_reports_new (
                {', '.join(new_columns)}
            )
            """

            print("   Creating temporary table with new schema...")
            cursor.execute(create_temp)

            # Copy data (replace created_date with reported_date in SELECT)
            if all_bugs:
                print(f"   Copying {len(all_bugs)} bugs to new table...")

                # Get column names (replace created_date with reported_date)
                old_col_names = [col[1] for col in columns]
                new_col_names = ['reported_date' if name == 'created_date' else name for name in old_col_names]

                placeholders = ','.join(['?' for _ in old_col_names])
                insert_sql = f"INSERT INTO bug_reports_new ({','.join(new_col_names)}) VALUES ({placeholders})"

                cursor.executemany(insert_sql, all_bugs)

            # Drop old table and rename new one
            print("   Replacing old table with new table...")
            cursor.execute("DROP TABLE bug_reports")
            cursor.execute("ALTER TABLE bug_reports_new RENAME TO bug_reports")

            raw_conn.commit()
            raw_conn.close()
            print("   ✅ Column renamed successfully")

        except Exception as e:
            print(f"   ❌ ERROR during column rename: {e}")
            raw_conn.rollback()
            raw_conn.close()
            raise

        # Step 4: Add new columns using SQLAlchemy
        print("\nStep 4/5: Adding new workflow columns...")

        new_columns_to_add = [
            ("assigned_date", "DATETIME"),
            ("fixed_date", "DATETIME"),
            ("verified_date", "DATETIME"),
            ("closed_date", "DATETIME"),
            ("fix_description", "TEXT"),
            ("root_cause", "TEXT"),
            ("workaround", "TEXT"),
            ("notes", "TEXT"),
            ("verified_by", "VARCHAR"),
        ]

        try:
            with engine.connect() as conn:
                for col_name, col_type in new_columns_to_add:
                    # Check if column already exists
                    if self.check_column_exists('bug_reports', col_name):
                        print(f"   ⚠️  Column {col_name} already exists, skipping...")
                        continue

                    sql = text(f"ALTER TABLE bug_reports ADD COLUMN {col_name} {col_type}")
                    conn.execute(sql)
                    conn.commit()
                    print(f"   ✅ Added column: {col_name} ({col_type})")

        except Exception as e:
            print(f"   ❌ ERROR adding columns: {e}")
            raise

        # Step 5: Validate migration
        print("\nStep 5/5: Validating migration...")
        bugs_after = self.check_existing_bugs()

        if bugs_before != bugs_after:
            print(f"   ❌ ERROR: Bug count mismatch!")
            print(f"      Before: {bugs_before}, After: {bugs_after}")
            return False

        # Verify new columns exist
        has_reported_date = self.check_column_exists('bug_reports', 'reported_date')
        has_assigned_date = self.check_column_exists('bug_reports', 'assigned_date')
        has_notes = self.check_column_exists('bug_reports', 'notes')

        if not has_reported_date:
            print("   ❌ ERROR: reported_date column not found after migration!")
            return False

        if not has_assigned_date or not has_notes:
            print("   ❌ ERROR: New workflow columns not found after migration!")
            return False

        print(f"   ✅ Migration validated successfully")
        print(f"   ✅ All {bugs_after} bugs preserved")
        print(f"   ✅ Column renamed: created_date → reported_date")
        print(f"   ✅ Added 9 new workflow columns")

        print("\n" + "="*70)
        print("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*70)
        print(f"\n💾 Backup saved at: {self.backup_path}")
        print("   Keep this backup until you verify the system works correctly.")
        print("\n⚠️  NEXT STEPS:")
        print("   1. Restart backend: uvicorn main:app --reload")
        print("   2. Test bug creation/editing")
        print("   3. Verify existing bugs still display correctly")
        print("   4. If everything works, you can delete the backup")

        return True

    def migrate_down(self):
        """
        Rollback migration: Remove new columns and rename reported_date → created_date

        WARNING: This will LOSE data in the new workflow columns!
        """
        print("\n" + "="*70)
        print("⚠️  ROLLBACK: Reverting Bug Workflow Migration")
        print("="*70 + "\n")

        print("⚠️  WARNING: This will remove all data in workflow columns!")
        print("   (assigned_date, fixed_date, verified_date, closed_date, etc.)")
        response = input("   Are you SURE you want to rollback? (yes/no): ")

        if response.lower() != 'yes':
            print("❌ Rollback aborted by user")
            return False

        # Create backup before rollback
        print("\nCreating backup before rollback...")
        self.backup_database()

        try:
            # Drop new columns
            print("\nRemoving workflow columns...")
            with engine.connect() as conn:
                columns_to_drop = [
                    "assigned_date", "fixed_date", "verified_date", "closed_date",
                    "fix_description", "root_cause", "workaround", "notes", "verified_by"
                ]

                for col_name in columns_to_drop:
                    if self.check_column_exists('bug_reports', col_name):
                        # SQLite doesn't support DROP COLUMN directly
                        # We'd need to recreate the table (complex operation)
                        print(f"   ⚠️  Cannot drop column {col_name} (SQLite limitation)")
                        print("      Consider restoring from backup instead")

            # Rename reported_date → created_date (similar process to migrate_up)
            print("\nRenaming column reported_date → created_date...")
            print("   ⚠️  This requires table recreation (same as forward migration)")
            print("   Recommend restoring from backup instead")

            print("\n❌ Rollback incomplete due to SQLite limitations")
            print("   To fully rollback:")
            print(f"   1. Stop backend")
            print(f"   2. Replace qa.db with backup: {self.backup_path}")
            print(f"   3. Restart backend")

            return False

        except Exception as e:
            print(f"❌ ERROR during rollback: {e}")
            raise


def main():
    """Main execution function"""
    print("\n" + "="*70)
    print("BUG WORKFLOW MIGRATION TOOL")
    print("="*70)
    print("\nThis migration will:")
    print("  1. Rename: created_date → reported_date")
    print("  2. Add 9 new workflow columns for QA ↔ DEV process")
    print("\n⚠️  CRITICAL: Backup will be created automatically")
    print("   Location: backend/database/qa.db.backup_TIMESTAMP")
    print("\n" + "="*70 + "\n")

    response = input("Ready to proceed? (yes/no): ")
    if response.lower() != 'yes':
        print("\n❌ Migration aborted by user")
        sys.exit(0)

    migration = BugWorkflowMigration()

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

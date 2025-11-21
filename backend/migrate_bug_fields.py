"""
Migration script to add missing fields to bug_reports table
This adds the fields needed to match the BugReport Pydantic model
"""
import sqlite3
from pathlib import Path

def migrate_bug_reports():
    """Add missing columns to bug_reports table"""
    db_path = Path("data/qa_automation.db")

    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        return

    print(f"📂 Found database at {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get existing columns
    cursor.execute("PRAGMA table_info(bug_reports)")
    existing_columns = {row[1] for row in cursor.fetchall()}
    print(f"✅ Existing columns: {existing_columns}")

    # Fields to add
    new_fields = {
        "steps_to_reproduce": "TEXT",
        "expected_behavior": "TEXT",
        "actual_behavior": "TEXT",
        "screenshots": "TEXT",  # JSON array
        "logs": "TEXT",
        "notes": "TEXT",
        "workaround": "TEXT",
        "root_cause": "TEXT",
        "fix_description": "TEXT"
    }

    added_count = 0
    for field_name, field_type in new_fields.items():
        if field_name not in existing_columns:
            try:
                cursor.execute(f"ALTER TABLE bug_reports ADD COLUMN {field_name} {field_type}")
                print(f"✅ Added column: {field_name} ({field_type})")
                added_count += 1
            except sqlite3.OperationalError as e:
                print(f"⚠️  Error adding {field_name}: {e}")
        else:
            print(f"ℹ️  Column {field_name} already exists")

    conn.commit()
    conn.close()

    print(f"\n{'='*60}")
    print(f"✅ Migration complete! Added {added_count} new columns")
    print(f"{'='*60}")

if __name__ == "__main__":
    print("🔄 Starting bug_reports table migration...")
    print("="*60)
    migrate_bug_reports()

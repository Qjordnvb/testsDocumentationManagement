"""
Migration script to add scenario_name to bug_reports table
"""
import sqlite3
from pathlib import Path

def migrate_add_scenario_name():
    """Add scenario_name column to bug_reports table"""
    db_path = Path("data/qa_automation.db")

    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        print("   The column will be created automatically when you run the backend.")
        return

    print(f"📂 Found database at {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if column already exists
    cursor.execute("PRAGMA table_info(bug_reports)")
    existing_columns = {row[1] for row in cursor.fetchall()}

    if "scenario_name" in existing_columns:
        print("ℹ️  Column 'scenario_name' already exists in bug_reports")
        conn.close()
        return

    try:
        cursor.execute("ALTER TABLE bug_reports ADD COLUMN scenario_name TEXT")
        conn.commit()
        print("✅ Added column 'scenario_name' to bug_reports table")
    except sqlite3.OperationalError as e:
        print(f"⚠️  Error adding column: {e}")
    finally:
        conn.close()

    print("\n" + "="*60)
    print("✅ Migration complete!")
    print("="*60)
    print("\nNext: Restart the backend server to use the new field")

if __name__ == "__main__":
    print("🔄 Starting bug_reports migration: add scenario_name")
    print("="*60)
    migrate_add_scenario_name()

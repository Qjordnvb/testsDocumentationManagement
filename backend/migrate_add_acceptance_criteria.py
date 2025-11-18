"""
Migration script to add acceptance_criteria column to user_stories table
Run this ONCE to update existing database schema
"""
import sqlite3
from pathlib import Path

def migrate():
    """Add acceptance_criteria column to user_stories table"""
    db_path = Path(__file__).parent / "data" / "qa_automation.db"

    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        print("   No migration needed - fresh database will have the column")
        return

    print(f"📁 Connecting to database: {db_path}")
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Check if column already exists
    cursor.execute("PRAGMA table_info(user_stories)")
    columns = [row[1] for row in cursor.fetchall()]

    if 'acceptance_criteria' in columns:
        print("✅ Column 'acceptance_criteria' already exists in user_stories table")
        print("   No migration needed")
        conn.close()
        return

    print("🔧 Adding 'acceptance_criteria' column to user_stories table...")

    try:
        cursor.execute("""
            ALTER TABLE user_stories
            ADD COLUMN acceptance_criteria TEXT
        """)
        conn.commit()
        print("✅ Migration successful!")
        print("   Column 'acceptance_criteria' added to user_stories table")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("\n" + "="*60)
    print("MIGRATION: Add acceptance_criteria column")
    print("="*60 + "\n")
    migrate()
    print("\n" + "="*60 + "\n")

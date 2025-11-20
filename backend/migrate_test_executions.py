"""
Migration script to add missing columns to test_executions table
Adds: environment, version columns
"""
import sqlite3
from pathlib import Path

# Database path - try multiple locations
DB_PATHS = [
    Path(__file__).parent / "data" / "qa_automation.db",
    Path("/home/jordan/proyectos/testDocumentationAutomation/backend/data/qa_automation.db"),
    Path("./data/qa_automation.db"),
]

# Find existing database
DB_PATH = None
for path in DB_PATHS:
    if path.exists():
        DB_PATH = path
        break

if not DB_PATH:
    print(f"❌ Database not found in any of these locations:")
    for p in DB_PATHS:
        print(f"  - {p}")
    exit(1)

def migrate():
    print(f"🔄 Migrating database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check current schema
        cursor.execute("PRAGMA table_info(test_executions)")
        columns = {row[1] for row in cursor.fetchall()}
        print(f"📋 Current columns: {columns}")

        # Add missing columns
        migrations_applied = []

        if 'environment' not in columns:
            print("➕ Adding column: environment")
            cursor.execute("ALTER TABLE test_executions ADD COLUMN environment VARCHAR DEFAULT 'QA'")
            migrations_applied.append('environment')

        if 'version' not in columns:
            print("➕ Adding column: version")
            cursor.execute("ALTER TABLE test_executions ADD COLUMN version VARCHAR")
            migrations_applied.append('version')

        if migrations_applied:
            conn.commit()
            print(f"✅ Migration successful! Added columns: {', '.join(migrations_applied)}")
        else:
            print("✅ No migrations needed, schema is up to date")

        # Verify final schema
        cursor.execute("PRAGMA table_info(test_executions)")
        final_columns = [row[1] for row in cursor.fetchall()]
        print(f"📋 Final columns: {final_columns}")

    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

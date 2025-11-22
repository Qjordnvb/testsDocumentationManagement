"""
Migration script: Add invitation-based registration system to users table

This migration adds support for invitation-based registration:
- Makes password_hash nullable
- Adds is_registered flag
- Adds invitation tracking fields (invited_by, invited_at, registered_at)

For existing users (like admin), sets is_registered=True
"""

import sqlite3
from datetime import datetime
from pathlib import Path

def run_migration():
    """Run the migration to add invitation system columns"""

    # Get database path
    db_path = Path(__file__).parent.parent / "data" / "qa_automation.db"

    print(f"🔄 Starting migration on: {db_path}")

    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        print("ℹ️  Run the application first to create the database")
        return

    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if migration is needed
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'is_registered' in columns:
            print("✅ Migration already applied")
            return

        print("\n📋 Migration Plan:")
        print("  1. Add is_registered column (default False)")
        print("  2. Add invited_by column")
        print("  3. Add invited_at column")
        print("  4. Add registered_at column")
        print("  5. Update existing users to is_registered=True")
        print("  6. Set registered_at for existing users")

        # Add new columns
        print("\n🔧 Adding new columns...")

        # Add is_registered column
        cursor.execute("""
            ALTER TABLE users
            ADD COLUMN is_registered BOOLEAN DEFAULT 0
        """)
        print("  ✅ Added is_registered column")

        # Add invited_by column
        cursor.execute("""
            ALTER TABLE users
            ADD COLUMN invited_by TEXT
        """)
        print("  ✅ Added invited_by column")

        # Add invited_at column
        cursor.execute("""
            ALTER TABLE users
            ADD COLUMN invited_at TIMESTAMP
        """)
        print("  ✅ Added invited_at column")

        # Add registered_at column
        cursor.execute("""
            ALTER TABLE users
            ADD COLUMN registered_at TIMESTAMP
        """)
        print("  ✅ Added registered_at column")

        # Update existing users (they already have passwords, so they're registered)
        print("\n🔄 Updating existing users...")

        now = datetime.now().isoformat()

        cursor.execute("""
            UPDATE users
            SET is_registered = 1,
                registered_at = ?,
                invited_at = created_at
            WHERE password_hash IS NOT NULL
        """, (now,))

        updated_count = cursor.rowcount
        print(f"  ✅ Updated {updated_count} existing users to is_registered=True")

        # Commit changes
        conn.commit()

        # Verify migration
        print("\n🔍 Verifying migration...")
        cursor.execute("SELECT email, is_registered FROM users")
        users = cursor.fetchall()

        for email, is_registered in users:
            status = "✅ Registered" if is_registered else "⏳ Pending"
            print(f"  {status}: {email}")

        print("\n✅ Migration completed successfully!")

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        conn.rollback()
        raise

    finally:
        conn.close()

if __name__ == "__main__":
    print("="*60)
    print("  MIGRATION: Invitation-Based Registration System")
    print("="*60)

    run_migration()

    print("\n"+"="*60)
    print("  Next steps:")
    print("  1. Restart the backend server")
    print("  2. Test login with existing users (admin@qa.com)")
    print("  3. Create new user invitations from admin panel")
    print("="*60)

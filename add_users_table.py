#!/usr/bin/env python3
"""
Database Migration Script: Add Users Table for Authentication
Adds users table without affecting existing data
"""
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.database.db import Base, engine, SessionLocal
from backend.database.models import UserDB
from backend.api.dependencies import hash_password
from backend.config import settings


def add_users_table():
    """Add users table to existing database"""
    print("=" * 60)
    print("DATABASE MIGRATION: Add Users Table")
    print("=" * 60)
    print()

    print("📁 Ensuring required directories exist...")
    try:
        settings.ensure_directories()
        print("✅ Directories created/verified")
    except Exception as e:
        print(f"❌ Error creating directories: {e}")
        sys.exit(1)

    print()
    print("🏗️  Creating users table (if not exists)...")
    try:
        # create_all is smart enough to only create missing tables
        Base.metadata.create_all(bind=engine)
        print("✅ Users table created successfully")
    except Exception as e:
        print(f"❌ Error creating users table: {e}")
        sys.exit(1)

    print()
    print("=" * 60)
    print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Run seed_admin_user.py to create initial admin user")
    print("2. Start the backend server: python backend/main.py")
    print("3. Test login at: POST /api/v1/auth/login")
    print()


if __name__ == "__main__":
    add_users_table()

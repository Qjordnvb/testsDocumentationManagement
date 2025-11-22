#!/usr/bin/env python3
"""
Seed Script: Create Initial Admin User
Creates a default admin user for first-time setup
"""
import os
import sys
from pathlib import Path
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.database.db import SessionLocal
from backend.database.models import UserDB
from backend.api.dependencies import hash_password


def seed_admin_user():
    """Create initial admin user"""
    print("=" * 60)
    print("SEED DATA: Create Initial Admin User")
    print("=" * 60)
    print()

    db = SessionLocal()

    try:
        # Check if any users exist
        existing_users = db.query(UserDB).count()

        if existing_users > 0:
            print(f"⚠️  Database already has {existing_users} user(s)")
            print("   Skipping admin user creation to avoid duplicates.")
            print()
            print("To create the admin user anyway, delete all users first.")
            return

        print("📝 Creating initial admin user...")
        print()

        # Default admin credentials
        admin_email = "admin@qa-system.com"
        admin_password = "admin123"  # CHANGE THIS IN PRODUCTION!
        admin_name = "System Administrator"

        # Create admin user
        admin_user = UserDB(
            id="USR-001",
            email=admin_email,
            password_hash=hash_password(admin_password),
            full_name=admin_name,
            role="admin",  # Must match Role enum value (lowercase)
            is_active=True,
            created_at=datetime.utcnow(),
            created_by=None,  # Self-created
            last_login=None
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print("✅ Admin user created successfully!")
        print()
        print("=" * 60)
        print("ADMIN CREDENTIALS (SAVE THESE!)")
        print("=" * 60)
        print(f"User ID:  {admin_user.id}")
        print(f"Email:    {admin_email}")
        print(f"Password: {admin_password}")
        print(f"Role:     {admin_user.role}")
        print("=" * 60)
        print()
        print("⚠️  IMPORTANT SECURITY NOTICE:")
        print("   1. CHANGE THE ADMIN PASSWORD IMMEDIATELY after first login!")
        print("   2. This default password is for DEVELOPMENT ONLY")
        print("   3. Never use these credentials in production")
        print()
        print("Next steps:")
        print("1. Start the backend server: python backend/main.py")
        print("2. Login with the credentials above")
        print("3. Change admin password via: PUT /api/v1/users/USR-001")
        print("4. Create additional users via: POST /api/v1/users")
        print()

    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin_user()

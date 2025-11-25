# type: uploaded file
# fileName: qaDocumentation/backend/setup_database.py

"""
Database Setup Master Script

Consolidates all database setup, migration, and seeding functionality.
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime
import subprocess

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from database.db import SessionLocal, engine, Base
# Importamos todos los modelos para asegurar que SQLAlchemy los registre antes del create_all
from database.models import UserDB, ProjectDB, UserStoryDB, TestCaseDB, OrganizationDB, BugReportDB, TestExecutionDB, Role, Priority, Status, TestType, TestPriority, TestStatus
from utils import hash_password
import json

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'=' * 80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'=' * 80}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ️  {text}{Colors.ENDC}")

def confirm_action(message, skip_confirmation=False):
    """Ask for user confirmation"""
    if skip_confirmation:
        return True
    print(f"\n{Colors.WARNING}{message}{Colors.ENDC}")
    response = input(f"{Colors.BOLD}Type 'yes' to continue: {Colors.ENDC}").strip().lower()
    return response == 'yes'

def init_fresh_schema():
    """
    Creates the database schema directly from SQLAlchemy Models.
    Used for fresh installs or resets.
    """
    print_header("🏗️ Initializing Fresh Schema")
    try:
        print_info("Creating tables from SQLAlchemy models...")
        Base.metadata.create_all(bind=engine)
        print_success("Schema created successfully (Multi-Tenant ready).")
        return True
    except Exception as e:
        print_error(f"Error creating schema: {e}")
        return False

def create_default_organization(org_id: str, org_name: str):
    """Creates the initial organization entry"""
    print_info(f"Checking/Creating Organization: {org_id}")
    db = SessionLocal()
    try:
        org = db.query(OrganizationDB).filter(OrganizationDB.id == org_id).first()
        if not org:
            org = OrganizationDB(
                id=org_id,
                name=org_name,
                subdomain=org_name.lower().replace(" ", "-"),
                plan='enterprise',
                is_active=True
            )
            db.add(org)
            db.commit()
            print_success(f"Organization {org_id} created.")
        else:
            print_info(f"Organization {org_id} already exists.")
        return True
    except Exception as e:
        db.rollback()
        print_error(f"Error creating organization: {e}")
        return False
    finally:
        db.close()

def run_migration_script():
    """
    Run the multi-tenant migration script for EXISTING databases
    """
    print_header("🔧 Running Multi-Tenant Migration Script")

    migration_script = Path(__file__).parent / "migrate_multi_tenant.py"
    if not migration_script.exists():
        print_error(f"Migration script not found: {migration_script}")
        return False

    try:
        result = subprocess.run(
            [sys.executable, str(migration_script)],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True
        )
        if result.stdout:
            print(result.stdout)
        if result.returncode != 0:
            print_error("Migration failed!")
            if result.stderr:
                print(result.stderr)
            return False

        print_success("Migration script execution completed.")
        return True
    except Exception as e:
        print_error(f"Error executing migration subprocess: {e}")
        return False

def create_admin_user(org_id: str, admin_email: str, skip_confirmation: bool = False):
    print_header(f"👤 Creating Admin User ({admin_email})")
    db = SessionLocal()
    try:
        # Verificar si el email ya existe en CUALQUIER organización
        admin = db.query(UserDB).filter(UserDB.email == admin_email).first()
        if admin:
            print_warning(f"User {admin_email} already exists in {admin.organization_id}!")
            return True

        if not skip_confirmation:
            if not confirm_action(f"Create admin {admin_email} in {org_id}?", skip_confirmation):
                return False

        hashed_password = hash_password("admin123")

        # Generar ID único en formato USR-001
        last_user = db.query(UserDB).order_by(UserDB.id.desc()).first()
        if last_user and last_user.id.startswith("USR-"):
            last_num = int(last_user.id.split('-')[1])
            user_id = f"USR-{last_num + 1:03d}"
        else:
            user_id = "USR-001"

        admin = UserDB(
            id=user_id,
            email=admin_email,
            password_hash=hashed_password,
            full_name=f"Admin {org_id}",  # Nombre descriptivo automático
            role=Role.ADMIN,
            organization_id=org_id,
            is_active=True,
            is_registered=True,
            created_at=datetime.now()
        )
        db.add(admin)
        db.commit()
        print_success(f"Admin {admin_email} created successfully for {org_id}!")
        return True
    except Exception as e:
        db.rollback()
        print_error(f"Error creating admin: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def seed_demo_data(org_id: str, skip_confirmation: bool = False):
    print_header("📦 Loading Demo Data")
    db = SessionLocal()
    try:
        existing_projects = db.query(ProjectDB).filter(ProjectDB.organization_id == org_id).count()
        if existing_projects > 0:
            if not confirm_action(f"Organization {org_id} has projects. Load demo data anyway?", skip_confirmation):
                return False

        # 1. Projects
        p1 = ProjectDB(id="PROJ-001", organization_id=org_id, name="E-Commerce", description="Demo Store", status="active")
        p2 = ProjectDB(id="PROJ-002", organization_id=org_id, name="Mobile App", description="Demo App", status="active")
        db.add(p1)
        db.add(p2)

        # 2. User Stories
        us1 = UserStoryDB(
            id="US-001-001", project_id="PROJ-001", organization_id=org_id,
            title="Login", description="User login flow", priority=Priority.HIGH,
            status=Status.BACKLOG
        )
        db.add(us1)

        # 3. Test Cases
        tc1 = TestCaseDB(
            id="TC-001-001", project_id="PROJ-001", organization_id=org_id,
            user_story_id="US-001-001", title="Valid Login", description="Test valid credentials",
            test_type=TestType.FUNCTIONAL, priority=TestPriority.HIGH
        )
        db.add(tc1)

        db.commit()
        print_success("Demo data loaded successfully.")
        return True
    except Exception as e:
        db.rollback()
        print_error(f"Error loading demo data: {e}")
        return False
    finally:
        db.close()

def reset_database(skip_confirmation: bool = False):
    print_header("⚠️  RESET DATABASE (DESTRUCTIVE)")
    if not skip_confirmation:
        if not confirm_action("Are you ABSOLUTELY SURE you want to DROP ALL DATA?", skip_confirmation):
            return False

    try:
        print_info("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print_success("All tables dropped.")
        # Re-init schema immediately
        return init_fresh_schema()
    except Exception as e:
        print_error(f"Error resetting database: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Database Setup Master Script")
    parser.add_argument("--fresh-install", action="store_true", help="Clean install")
    parser.add_argument("--migrate", action="store_true", help="Migrate existing DB")
    parser.add_argument("--create-admin", action="store_true", help="Create default admin")
    parser.add_argument("--seed-demo", action="store_true", help="Load demo data")
    parser.add_argument("--reset", action="store_true", help="Drop and recreate")
    parser.add_argument("--org-id", default="ORG-001", help="Organization ID")
    parser.add_argument("--org-name", default="Default Organization", help="Organization name")
    parser.add_argument("--admin-email", default="admin@qa-system.com", help="Admin email address")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation prompts")

    args = parser.parse_args()

    if not any([args.fresh_install, args.migrate, args.create_admin, args.seed_demo, args.reset]):
        parser.print_help()
        return

    success = True

    if args.reset:
        success = reset_database(args.yes)
        if success:
            create_default_organization(args.org_id, args.org_name)

    elif args.fresh_install:
        # FIX: Force reset (Drop All) before initializing
        print_info("Fresh Install: Resetting database first...")
        success = reset_database(skip_confirmation=True)

        if success:
            create_default_organization(args.org_id, args.org_name)
            # Pasar el email personalizado
            success = create_admin_user(args.org_id, args.admin_email, args.yes)

            # Agregar mensaje informativo
            print_info("Skipping demo data (Clean environment requested)")

    elif args.migrate:
        success = run_migration_script()

    # Standalone actions
    if args.create_admin and not args.fresh_install:
        create_default_organization(args.org_id, args.org_name)
        # Pasar el email personalizado
        success = create_admin_user(args.org_id, args.admin_email, args.yes)

    if args.seed_demo and not args.fresh_install:
        create_default_organization(args.org_id, args.org_name)
        success = seed_demo_data(args.org_id, args.yes)

    if success:
        print_header("✅ Operation Complete")

if __name__ == "__main__":
    main()

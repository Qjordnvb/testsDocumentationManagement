"""
Multi-Tenant Migration Script

This script migrates the database to support multi-tenancy with complete isolation:
1. Creates organizations table
2. Adds organization_id to all tables
3. Creates default organization for existing data
4. Updates all Foreign Keys to composite keys
5. Ensures project-level isolation within organizations

CRITICAL: This fixes two problems:
- Multi-tenant support (organizations isolation)
- Project isolation (composite FKs with project_id + organization_id)

Run: python migrate_multi_tenant.py
"""

import sqlite3
from pathlib import Path
from datetime import datetime
import json

# Database path
DB_PATH = Path(__file__).parent / "qa_system.db"
DEFAULT_ORG_ID = "ORG-001"
DEFAULT_ORG_NAME = "Default Organization"

print(f"🔧 Multi-Tenant Migration")
print(f"Database: {DB_PATH}")
print(f"=" * 80)

# Connect to database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

try:
    # ============================================================================
    # STEP 1: Create organizations table
    # ============================================================================
    print("\n📦 STEP 1: Creating organizations table...")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS organizations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            subdomain TEXT UNIQUE,
            domain TEXT,

            -- Settings
            settings TEXT,
            max_users INTEGER DEFAULT 50,
            max_projects INTEGER DEFAULT 100,

            -- Billing
            plan TEXT DEFAULT 'free',
            subscription_status TEXT DEFAULT 'active',

            -- Security
            is_active INTEGER DEFAULT 1,

            -- Metadata
            created_date TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_date TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Insert default organization
    cursor.execute("""
        INSERT OR IGNORE INTO organizations
        (id, name, subdomain, plan, is_active, created_date)
        VALUES (?, ?, ?, 'enterprise', 1, ?)
    """, (DEFAULT_ORG_ID, DEFAULT_ORG_NAME, 'default', datetime.now().isoformat()))

    print(f"   ✅ Created default organization: {DEFAULT_ORG_ID}")

    # ============================================================================
    # STEP 2: Add organization_id to users table
    # ============================================================================
    print("\n👤 STEP 2: Migrating users table...")

    # Check if column exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'organization_id' not in columns:
        cursor.execute(f"""
            ALTER TABLE users
            ADD COLUMN organization_id TEXT DEFAULT '{DEFAULT_ORG_ID}' NOT NULL
        """)
        print(f"   ✅ Added organization_id to users")

        # Update all existing users
        cursor.execute(f"""
            UPDATE users SET organization_id = '{DEFAULT_ORG_ID}'
            WHERE organization_id IS NULL OR organization_id = ''
        """)
        print(f"   ✅ Assigned all users to {DEFAULT_ORG_ID}")
    else:
        print(f"   ℹ️  organization_id already exists in users")

    # ============================================================================
    # STEP 3: Migrate projects table
    # ============================================================================
    print("\n📁 STEP 3: Migrating projects table...")

    cursor.execute("PRAGMA table_info(projects)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'organization_id' not in columns:
        # SQLite doesn't support adding columns with composite PK directly
        # We need to recreate the table

        print("   🔄 Recreating projects table with composite PK...")

        # Get existing data
        cursor.execute("SELECT * FROM projects")
        existing_projects = cursor.fetchall()
        cursor.execute("PRAGMA table_info(projects)")
        project_columns = [col[1] for col in cursor.fetchall()]

        # Rename old table
        cursor.execute("ALTER TABLE projects RENAME TO projects_old")

        # Create new table with composite PK
        cursor.execute("""
            CREATE TABLE projects (
                id TEXT NOT NULL,
                organization_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                client TEXT,
                team_members TEXT,
                status TEXT DEFAULT 'active',
                default_test_types TEXT,
                start_date TEXT,
                end_date TEXT,
                created_date TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_date TEXT DEFAULT CURRENT_TIMESTAMP,
                notion_database_id TEXT,
                azure_project_id TEXT,

                PRIMARY KEY (id, organization_id),
                FOREIGN KEY (organization_id) REFERENCES organizations(id)
            )
        """)

        # Migrate data
        for project in existing_projects:
            project_dict = dict(zip(project_columns, project))
            cursor.execute("""
                INSERT INTO projects (
                    id, organization_id, name, description, client, team_members,
                    status, default_test_types, start_date, end_date,
                    created_date, updated_date, notion_database_id, azure_project_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                project_dict.get('id'),
                DEFAULT_ORG_ID,
                project_dict.get('name'),
                project_dict.get('description'),
                project_dict.get('client'),
                project_dict.get('team_members'),
                project_dict.get('status', 'active'),
                project_dict.get('default_test_types'),
                project_dict.get('start_date'),
                project_dict.get('end_date'),
                project_dict.get('created_date'),
                project_dict.get('updated_date'),
                project_dict.get('notion_database_id'),
                project_dict.get('azure_project_id')
            ))

        # Drop old table
        cursor.execute("DROP TABLE projects_old")
        print(f"   ✅ Migrated {len(existing_projects)} projects")
    else:
        print(f"   ℹ️  organization_id already exists in projects")

    # ============================================================================
    # STEP 4: Migrate user_stories table
    # ============================================================================
    print("\n📝 STEP 4: Migrating user_stories table...")

    cursor.execute("PRAGMA table_info(user_stories)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'organization_id' not in columns:
        print("   🔄 Recreating user_stories table with composite PK/FK...")

        # Get existing data
        cursor.execute("SELECT * FROM user_stories")
        existing_stories = cursor.fetchall()
        cursor.execute("PRAGMA table_info(user_stories)")
        story_columns = [col[1] for col in cursor.fetchall()]

        # Rename old table
        cursor.execute("ALTER TABLE user_stories RENAME TO user_stories_old")

        # Create new table
        cursor.execute("""
            CREATE TABLE user_stories (
                id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                organization_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                priority TEXT DEFAULT 'Medium',
                status TEXT DEFAULT 'Backlog',
                epic TEXT,
                sprint TEXT,
                story_points INTEGER,
                assigned_to TEXT,
                created_date TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_date TEXT DEFAULT CURRENT_TIMESTAMP,
                acceptance_criteria TEXT,
                total_criteria INTEGER DEFAULT 0,
                completed_criteria INTEGER DEFAULT 0,
                completion_percentage REAL DEFAULT 0.0,
                notion_page_id TEXT,
                azure_work_item_id TEXT,

                PRIMARY KEY (id, project_id, organization_id),
                FOREIGN KEY (project_id, organization_id)
                    REFERENCES projects(id, organization_id) ON DELETE CASCADE
            )
        """)

        # Migrate data
        for story in existing_stories:
            story_dict = dict(zip(story_columns, story))
            cursor.execute("""
                INSERT INTO user_stories (
                    id, project_id, organization_id, title, description,
                    priority, status, epic, sprint, story_points, assigned_to,
                    created_date, updated_date, acceptance_criteria,
                    total_criteria, completed_criteria, completion_percentage,
                    notion_page_id, azure_work_item_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                story_dict.get('id'),
                story_dict.get('project_id'),
                DEFAULT_ORG_ID,
                story_dict.get('title'),
                story_dict.get('description'),
                story_dict.get('priority', 'Medium'),
                story_dict.get('status', 'Backlog'),
                story_dict.get('epic'),
                story_dict.get('sprint'),
                story_dict.get('story_points'),
                story_dict.get('assigned_to'),
                story_dict.get('created_date'),
                story_dict.get('updated_date'),
                story_dict.get('acceptance_criteria'),
                story_dict.get('total_criteria', 0),
                story_dict.get('completed_criteria', 0),
                story_dict.get('completion_percentage', 0.0),
                story_dict.get('notion_page_id'),
                story_dict.get('azure_work_item_id')
            ))

        cursor.execute("DROP TABLE user_stories_old")
        print(f"   ✅ Migrated {len(existing_stories)} user stories")
    else:
        print(f"   ℹ️  organization_id already exists in user_stories")

    # ============================================================================
    # STEP 5: Migrate test_cases table (CRITICAL FIX)
    # ============================================================================
    print("\n✅ STEP 5: Migrating test_cases table (FIXING PROJECT ISOLATION)...")

    cursor.execute("PRAGMA table_info(test_cases)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'organization_id' not in columns:
        print("   🔄 Recreating test_cases table with COMPOSITE FK to user_stories...")

        # Get existing data
        cursor.execute("SELECT * FROM test_cases")
        existing_tests = cursor.fetchall()
        cursor.execute("PRAGMA table_info(test_cases)")
        test_columns = [col[1] for col in cursor.fetchall()]

        # Rename old table
        cursor.execute("ALTER TABLE test_cases RENAME TO test_cases_old")

        # Create new table with COMPOSITE FOREIGN KEYS
        cursor.execute("""
            CREATE TABLE test_cases (
                id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                organization_id TEXT NOT NULL,
                user_story_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                test_type TEXT DEFAULT 'FUNCTIONAL',
                priority TEXT DEFAULT 'MEDIUM',
                status TEXT DEFAULT 'NOT_RUN',
                estimated_time_minutes INTEGER,
                actual_time_minutes INTEGER,
                automated INTEGER DEFAULT 0,
                created_date TEXT DEFAULT CURRENT_TIMESTAMP,
                last_executed TEXT,
                executed_by TEXT,
                gherkin_file_path TEXT,
                notion_page_id TEXT,
                azure_test_case_id TEXT,

                PRIMARY KEY (id, project_id, organization_id),
                FOREIGN KEY (project_id, organization_id)
                    REFERENCES projects(id, organization_id) ON DELETE CASCADE,
                FOREIGN KEY (user_story_id, project_id, organization_id)
                    REFERENCES user_stories(id, project_id, organization_id) ON DELETE CASCADE
            )
        """)

        # Migrate data
        for test in existing_tests:
            test_dict = dict(zip(test_columns, test))
            cursor.execute("""
                INSERT INTO test_cases (
                    id, project_id, organization_id, user_story_id,
                    title, description, test_type, priority, status,
                    estimated_time_minutes, actual_time_minutes, automated,
                    created_date, last_executed, executed_by,
                    gherkin_file_path, notion_page_id, azure_test_case_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                test_dict.get('id'),
                test_dict.get('project_id'),
                DEFAULT_ORG_ID,
                test_dict.get('user_story_id'),
                test_dict.get('title'),
                test_dict.get('description'),
                test_dict.get('test_type', 'FUNCTIONAL'),
                test_dict.get('priority', 'MEDIUM'),
                test_dict.get('status', 'NOT_RUN'),
                test_dict.get('estimated_time_minutes'),
                test_dict.get('actual_time_minutes'),
                test_dict.get('automated', 0),
                test_dict.get('created_date'),
                test_dict.get('last_executed'),
                test_dict.get('executed_by'),
                test_dict.get('gherkin_file_path'),
                test_dict.get('notion_page_id'),
                test_dict.get('azure_test_case_id')
            ))

        cursor.execute("DROP TABLE test_cases_old")
        print(f"   ✅ Migrated {len(existing_tests)} test cases")
        print(f"   🎯 CRITICAL FIX APPLIED: Composite FK ensures project isolation")
    else:
        print(f"   ℹ️  organization_id already exists in test_cases")

    # ============================================================================
    # STEP 6: Migrate bug_reports table
    # ============================================================================
    print("\n🐛 STEP 6: Migrating bug_reports table...")

    cursor.execute("PRAGMA table_info(bug_reports)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'organization_id' not in columns:
        print("   🔄 Recreating bug_reports table with composite PK/FK...")

        # Get existing data
        cursor.execute("SELECT * FROM bug_reports")
        existing_bugs = cursor.fetchall()
        cursor.execute("PRAGMA table_info(bug_reports)")
        bug_columns = [col[1] for col in cursor.fetchall()]

        # Rename old table
        cursor.execute("ALTER TABLE bug_reports RENAME TO bug_reports_old")

        # Create new table
        cursor.execute("""
            CREATE TABLE bug_reports (
                id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                organization_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                severity TEXT NOT NULL,
                priority TEXT NOT NULL,
                bug_type TEXT NOT NULL,
                status TEXT DEFAULT 'OPEN',
                user_story_id TEXT,
                test_case_id TEXT,
                execution_id INTEGER,
                reported_by TEXT NOT NULL,
                assigned_to TEXT,
                environment TEXT,
                browser TEXT,
                os TEXT,
                version TEXT,
                steps_to_reproduce TEXT,
                scenario_name TEXT,
                expected_behavior TEXT,
                actual_behavior TEXT,
                screenshot_path TEXT,
                log_file_path TEXT,
                attachments TEXT,
                created_date TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_date TEXT DEFAULT CURRENT_TIMESTAMP,
                resolved_date TEXT,

                PRIMARY KEY (id, project_id, organization_id),
                FOREIGN KEY (project_id, organization_id)
                    REFERENCES projects(id, organization_id) ON DELETE CASCADE,
                FOREIGN KEY (user_story_id, project_id, organization_id)
                    REFERENCES user_stories(id, project_id, organization_id) ON DELETE SET NULL,
                FOREIGN KEY (test_case_id, project_id, organization_id)
                    REFERENCES test_cases(id, project_id, organization_id) ON DELETE SET NULL
            )
        """)

        # Migrate data
        for bug in existing_bugs:
            bug_dict = dict(zip(bug_columns, bug))
            cursor.execute("""
                INSERT INTO bug_reports (
                    id, project_id, organization_id, title, description,
                    severity, priority, bug_type, status,
                    user_story_id, test_case_id, execution_id,
                    reported_by, assigned_to, environment, browser, os, version,
                    steps_to_reproduce, scenario_name, expected_behavior, actual_behavior,
                    screenshot_path, log_file_path, attachments,
                    created_date, updated_date, resolved_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                bug_dict.get('id'),
                bug_dict.get('project_id'),
                DEFAULT_ORG_ID,
                bug_dict.get('title'),
                bug_dict.get('description'),
                bug_dict.get('severity'),
                bug_dict.get('priority'),
                bug_dict.get('bug_type'),
                bug_dict.get('status', 'OPEN'),
                bug_dict.get('user_story_id'),
                bug_dict.get('test_case_id'),
                bug_dict.get('execution_id'),
                bug_dict.get('reported_by'),
                bug_dict.get('assigned_to'),
                bug_dict.get('environment'),
                bug_dict.get('browser'),
                bug_dict.get('os'),
                bug_dict.get('version'),
                bug_dict.get('steps_to_reproduce'),
                bug_dict.get('scenario_name'),
                bug_dict.get('expected_behavior'),
                bug_dict.get('actual_behavior'),
                bug_dict.get('screenshot_path'),
                bug_dict.get('log_file_path'),
                bug_dict.get('attachments'),
                bug_dict.get('created_date'),
                bug_dict.get('updated_date'),
                bug_dict.get('resolved_date')
            ))

        cursor.execute("DROP TABLE bug_reports_old")
        print(f"   ✅ Migrated {len(existing_bugs)} bug reports")
    else:
        print(f"   ℹ️  organization_id already exists in bug_reports")

    # ============================================================================
    # STEP 7: Migrate test_executions table
    # ============================================================================
    print("\n✅ STEP 7: Migrating test_executions table...")

    cursor.execute("PRAGMA table_info(test_executions)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'organization_id' not in columns:
        print("   🔄 Recreating test_executions table with composite FK...")

        # Get existing data
        cursor.execute("SELECT * FROM test_executions")
        existing_executions = cursor.fetchall()
        cursor.execute("PRAGMA table_info(test_executions)")
        exec_columns = [col[1] for col in cursor.fetchall()]

        # Rename old table
        cursor.execute("ALTER TABLE test_executions RENAME TO test_executions_old")

        # Create new table
        cursor.execute("""
            CREATE TABLE test_executions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                test_case_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                organization_id TEXT NOT NULL,
                status TEXT NOT NULL,
                executed_by TEXT NOT NULL,
                execution_date TEXT DEFAULT CURRENT_TIMESTAMP,
                duration_seconds INTEGER,
                notes TEXT,
                steps_results TEXT,
                screenshot_path TEXT,
                log_file_path TEXT,
                environment TEXT,
                browser TEXT,
                os TEXT,

                FOREIGN KEY (test_case_id, project_id, organization_id)
                    REFERENCES test_cases(id, project_id, organization_id) ON DELETE CASCADE
            )
        """)

        # Migrate data
        for execution in existing_executions:
            exec_dict = dict(zip(exec_columns, execution))
            cursor.execute("""
                INSERT INTO test_executions (
                    test_case_id, project_id, organization_id,
                    status, executed_by, execution_date, duration_seconds,
                    notes, steps_results, screenshot_path, log_file_path,
                    environment, browser, os
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                exec_dict.get('test_case_id'),
                exec_dict.get('project_id'),
                DEFAULT_ORG_ID,
                exec_dict.get('status'),
                exec_dict.get('executed_by'),
                exec_dict.get('execution_date'),
                exec_dict.get('duration_seconds'),
                exec_dict.get('notes'),
                exec_dict.get('steps_results'),
                exec_dict.get('screenshot_path'),
                exec_dict.get('log_file_path'),
                exec_dict.get('environment'),
                exec_dict.get('browser'),
                exec_dict.get('os')
            ))

        cursor.execute("DROP TABLE test_executions_old")
        print(f"   ✅ Migrated {len(existing_executions)} test executions")
    else:
        print(f"   ℹ️  organization_id already exists in test_executions")

    # ============================================================================
    # COMMIT CHANGES
    # ============================================================================
    conn.commit()
    print("\n" + "=" * 80)
    print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
    print(f"\nSummary:")
    print(f"  - Created organizations table")
    print(f"  - Created default organization: {DEFAULT_ORG_ID}")
    print(f"  - Migrated all tables with organization_id")
    print(f"  - ✨ FIXED: Composite Foreign Keys for project isolation")
    print(f"  - All existing data assigned to: {DEFAULT_ORG_NAME}")
    print("\n🎯 Your system now supports:")
    print("  1. Multiple organizations (multi-tenant)")
    print("  2. Project isolation within organizations")
    print("  3. Same Excel can be loaded in different projects without conflicts")
    print("=" * 80)

except Exception as e:
    conn.rollback()
    print(f"\n❌ MIGRATION FAILED: {e}")
    import traceback
    print(traceback.format_exc())
    raise

finally:
    conn.close()

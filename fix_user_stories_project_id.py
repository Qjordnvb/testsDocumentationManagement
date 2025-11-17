#!/usr/bin/env python3
"""
Script to fix user stories that don't have project_id
Assigns them to a specified project
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.database.db import SessionLocal
from backend.database.models import UserStoryDB, ProjectDB


def fix_user_stories_without_project():
    """Assign user stories without project_id to a project"""
    db = SessionLocal()

    try:
        # Get all user stories without project_id
        stories_without_project = db.query(UserStoryDB).filter(
            (UserStoryDB.project_id == None) | (UserStoryDB.project_id == '')
        ).all()

        if not stories_without_project:
            print("✅ All user stories already have project_id")
            return

        print(f"Found {len(stories_without_project)} user stories without project_id:")
        for story in stories_without_project:
            print(f"  - {story.id}: {story.title}")

        print()

        # Get all projects
        projects = db.query(ProjectDB).all()

        if not projects:
            print("❌ No projects found in database")
            print("Please create a project first using the API: POST /api/v1/projects")
            return

        # Show projects
        print("Available projects:")
        for i, project in enumerate(projects, 1):
            print(f"  {i}. {project.id} - {project.name}")

        print()

        # Ask user to select project
        choice = input(f"Select project (1-{len(projects)}) to assign these user stories: ")

        try:
            choice_idx = int(choice) - 1
            if choice_idx < 0 or choice_idx >= len(projects):
                print("❌ Invalid choice")
                return

            selected_project = projects[choice_idx]

            # Confirm
            confirm = input(f"\nAssign {len(stories_without_project)} user stories to '{selected_project.name}' ({selected_project.id})? (yes/no): ")
            if confirm.lower() != 'yes':
                print("❌ Operation cancelled")
                return

            # Update user stories
            for story in stories_without_project:
                story.project_id = selected_project.id

            db.commit()

            print()
            print(f"✅ Successfully assigned {len(stories_without_project)} user stories to project {selected_project.id}")
            print()
            print("Updated user stories:")
            for story in stories_without_project:
                print(f"  ✓ {story.id}: {story.title} → {selected_project.id}")

        except ValueError:
            print("❌ Invalid input, please enter a number")
            return

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Fix User Stories Without Project ID")
    print("=" * 60)
    print()

    fix_user_stories_without_project()

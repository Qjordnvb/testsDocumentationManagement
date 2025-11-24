#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/jordan/proyectos/testsDocumentationManagement/backend')

from backend.database.db import SessionLocal
from backend.database.models import UserStoryDB

db = SessionLocal()

# Check stories
stories = db.query(UserStoryDB).filter(UserStoryDB.id.in_(['444277', '444248'])).all()
print("STORIES:")
for s in stories:
    print(f"  {s.id}: project={s.project_id}, org={s.organization_id}")

# Check all stories in PROJ-002
print("\nAll stories in PROJ-002 (Coca):")
stories_proj2 = db.query(UserStoryDB).filter(
    UserStoryDB.project_id == 'PROJ-002',
    UserStoryDB.organization_id == 'ORG-COCA'
).all()
print(f"  Found {len(stories_proj2)} stories")
for s in stories_proj2[:3]:
    print(f"    {s.id}: {s.title[:50]}")

db.close()

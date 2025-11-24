#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/jordan/proyectos/testsDocumentationManagement/backend')

from backend.database.db import SessionLocal
from backend.database.models import ProjectDB, UserDB

db = SessionLocal()

# Check all projects
print("PROJECTS:")
projects = db.query(ProjectDB).all()
for p in projects:
    print(f"  {p.id}: {p.name} (org={p.organization_id})")

print("\nUSERS:")
users = db.query(UserDB).filter(UserDB.id.in_(['USR-003', 'USR-004'])).all()
for u in users:
    print(f"  {u.id}: {u.email} (org={u.organization_id}, role={u.role})")

db.close()

# MIGRATION PLAN: Bug Workflow Fields

**Date:** 2025-11-25
**Author:** Claude Code (Anthropic)
**Status:** ⚠️ READY FOR EXECUTION (Not yet executed)

---

## 📋 EXECUTIVE SUMMARY

This migration adds critical workflow fields to the `bug_reports` table to support a complete QA ↔ DEV bug lifecycle process.

### Changes:
1. **RENAME COLUMN** (CRITICAL - preserves data):
   - `created_date` → `reported_date`

2. **ADD 9 NEW COLUMNS**:
   - `assigned_date` (DateTime)
   - `fixed_date` (DateTime)
   - `verified_date` (DateTime)
   - `closed_date` (DateTime)
   - `fix_description` (Text)
   - `root_cause` (Text)
   - `workaround` (Text)
   - `notes` (Text)
   - `verified_by` (String)

---

## 🗂️ FILES MODIFIED

### ✅ Created:
- `backend/migrations/add_bug_workflow_fields.py` (Migration script)
- `backend/migrations/README_MIGRATION_PLAN.md` (This file)

### ✅ Updated:
- `backend/database/models.py` - BugReportDB model (renamed column + 9 new fields)
- `backend/services/bug_service.py` - BugService (3 changes):
  - `_create_bug_db_record()` - Uncommented workflow fields
  - `_apply_bug_updates()` - Uncommented workflow fields
  - `_bug_to_dict()` - Fixed `created_date` → `reported_date`, return real values
- `backend/api/endpoints/bugs.py` - Import fix: Added ProjectDB import

---

## 🔍 DETAILED CHANGES

### 1. Database Model (`models.py`)

**BEFORE:**
```python
# Dates
created_date = Column(DateTime, default=datetime.now)
updated_date = Column(DateTime, default=datetime.now, onupdate=datetime.now)
resolved_date = Column(DateTime, nullable=True)
```

**AFTER:**
```python
# Workflow tracking - QA ↔ DEV process
fix_description = Column(Text, nullable=True)  # DEV explains the fix
root_cause = Column(Text, nullable=True)  # Root cause analysis
workaround = Column(Text, nullable=True)  # Temporary solution
notes = Column(Text, nullable=True)  # General notes
verified_by = Column(String, nullable=True)  # QA who verified the fix

# Dates - Bug lifecycle tracking
reported_date = Column(DateTime, default=datetime.now)  # RENAMED from created_date
assigned_date = Column(DateTime, nullable=True)  # When bug was assigned to DEV
fixed_date = Column(DateTime, nullable=True)  # When DEV marked as fixed
verified_date = Column(DateTime, nullable=True)  # When QA verified the fix
closed_date = Column(DateTime, nullable=True)  # When bug was closed
updated_date = Column(DateTime, default=datetime.now, onupdate=datetime.now)
resolved_date = Column(DateTime, nullable=True)  # Legacy: kept for backwards compatibility
```

### 2. BugService (`bug_service.py`)

#### Change 2a: `_create_bug_db_record()` (Line 336-347)

**BEFORE:**
```python
attachments=screenshots_str,  # FIX: Map screenshots to attachments field
# logs=bug.logs,
# notes=bug.notes,
# workaround=bug.workaround,
# root_cause=bug.root_cause,
# fix_description=bug.fix_description,
reported_by=bug.reported_by,
assigned_to=bug.assigned_to,
# verified_by=bug.verified_by,
# reported_date=bug.reported_date or datetime.now(),
# document_path=doc_path
```

**AFTER:**
```python
attachments=screenshots_str,  # FIX: Map screenshots to attachments field
notes=bug.notes,
workaround=bug.workaround,
root_cause=bug.root_cause,
fix_description=bug.fix_description,
reported_by=bug.reported_by,
assigned_to=bug.assigned_to,
verified_by=bug.verified_by,
reported_date=bug.reported_date or datetime.now(),  # Now uses reported_date
# document_path=doc_path  # TODO: Add this field to model if needed
```

#### Change 2b: `_apply_bug_updates()` (Line 362-371)

**BEFORE:**
```python
allowed_fields = [
    "title", "description", "steps_to_reproduce", "expected_behavior", "actual_behavior",
    "severity", "priority", "bug_type", "status",
    "environment", "browser", "os",
    "version", "scenario_name", # Uncommented: Now in DB
    "screenshots",
    # "logs", "notes", "workaround", "root_cause", "fix_description",
    "assigned_to",
    # "verified_by", "assigned_date", "fixed_date", "verified_date", "closed_date"
]
```

**AFTER:**
```python
allowed_fields = [
    "title", "description", "steps_to_reproduce", "expected_behavior", "actual_behavior",
    "severity", "priority", "bug_type", "status",
    "environment", "browser", "os",
    "version", "scenario_name",
    "screenshots",
    "notes", "workaround", "root_cause", "fix_description",  # Workflow fields
    "assigned_to", "verified_by",
    "assigned_date", "fixed_date", "verified_date", "closed_date"  # Date tracking
]
```

#### Change 2c: `_bug_to_dict()` (Line 424-438)

**BEFORE:**
```python
"screenshots": screenshots_list,
"logs": None,
"notes": None,
"workaround": None,
"root_cause": None,
"fix_description": None,
"reported_by": bug.reported_by,
"assigned_to": bug.assigned_to,
"verified_by": None,
"reported_date": bug.created_date.isoformat() if bug.created_date else None,  # ❌ WRONG
"assigned_date": None,
"fixed_date": None,
"verified_date": None,
"closed_date": None,
"document_path": None,
```

**AFTER:**
```python
"screenshots": screenshots_list,
"logs": None,  # TODO: Add logs field to model if needed
"notes": bug.notes,
"workaround": bug.workaround,
"root_cause": bug.root_cause,
"fix_description": bug.fix_description,
"reported_by": bug.reported_by,
"assigned_to": bug.assigned_to,
"verified_by": bug.verified_by,
"reported_date": bug.reported_date.isoformat() if bug.reported_date else None,  # ✅ FIXED
"assigned_date": bug.assigned_date.isoformat() if bug.assigned_date else None,
"fixed_date": bug.fixed_date.isoformat() if bug.fixed_date else None,
"verified_date": bug.verified_date.isoformat() if bug.verified_date else None,
"closed_date": bug.closed_date.isoformat() if bug.closed_date else None,
"document_path": None,  # TODO: Add document_path field to model if needed
```

### 3. Import Fix (`bugs.py`)

**BEFORE:**
```python
from backend.database import get_db, UserDB
```

**AFTER:**
```python
from backend.database import get_db, UserDB, ProjectDB
```

---

## ⚠️ CRITICAL SAFETY MEASURES

### 1. Automatic Backup
The migration script will **automatically create a backup** before making any changes:
- Location: `backend/database/qa.db.backup_TIMESTAMP`
- Example: `qa.db.backup_20251125_143052`

### 2. Validation Steps
The migration script performs:
1. ✅ Count bugs before migration
2. ✅ Validate schema before changes
3. ✅ Create backup
4. ✅ Rename column (preserving data)
5. ✅ Add new columns
6. ✅ Count bugs after migration (must match)
7. ✅ Verify new columns exist

### 3. Rollback Available
If something goes wrong:
```bash
# Stop backend
pkill -f uvicorn

# Restore backup
cp backend/database/qa.db.backup_TIMESTAMP backend/database/qa.db

# Restart backend
cd backend && uvicorn main:app --reload
```

---

## 🚀 EXECUTION STEPS

### Pre-Migration Checklist

- [ ] Backend is running correctly
- [ ] Can create/view bugs without errors
- [ ] No unsaved work in progress
- [ ] Have access to backend terminal

### Step 1: Stop Backend

```bash
# Press Ctrl+C in backend terminal
# OR
pkill -f uvicorn
```

### Step 2: Run Migration

```bash
cd /home/jordan/proyectos/testDocumentationAutomation
python backend/migrations/add_bug_workflow_fields.py
```

**Expected Output:**
```
======================================================================
BUG WORKFLOW MIGRATION TOOL
======================================================================

This migration will:
  1. Rename: created_date → reported_date
  2. Add 9 new workflow columns for QA ↔ DEV process

⚠️  CRITICAL: Backup will be created automatically
   Location: backend/database/qa.db.backup_TIMESTAMP

======================================================================

Ready to proceed? (yes/no):
```

**Type:** `yes`

### Step 3: Monitor Output

The migration will:
1. Count existing bugs
2. Create backup
3. Rename column (preserving data)
4. Add 9 new columns
5. Validate everything

**Success looks like:**
```
======================================================================
🎉 MIGRATION COMPLETED SUCCESSFULLY!
======================================================================

💾 Backup saved at: backend/database/qa.db.backup_20251125_143052
   Keep this backup until you verify the system works correctly.

⚠️  NEXT STEPS:
   1. Restart backend: uvicorn main:app --reload
   2. Test bug creation/editing
   3. Verify existing bugs still display correctly
   4. If everything works, you can delete the backup
```

### Step 4: Restart Backend

```bash
cd backend
uvicorn main:app --reload
```

### Step 5: Verify Migration

**Test 1: View Existing Bugs**
```bash
# Should work without errors
curl http://localhost:8000/api/v1/bugs?project_id=PROJ-001
```

**Test 2: Create New Bug**
```bash
# Go to frontend: http://localhost:5173
# Navigate to Bugs page
# Click "Report Bug"
# Fill form and submit
# Bug should be created successfully
```

**Test 3: Check New Fields**
```bash
# View a bug in frontend
# New fields should be visible (even if empty):
# - Notes
# - Workaround
# - Root Cause
# - Fix Description
# - Verified By
# - Reported Date (instead of Created Date)
# - Assigned Date, Fixed Date, Verified Date, Closed Date
```

### Step 6: Cleanup (Optional)

If everything works for 24+ hours:
```bash
# Delete backup
rm backend/database/qa.db.backup_*
```

---

## 🐛 TROUBLESHOOTING

### Error: "ModuleNotFoundError: No module named 'backend'"

**Solution:**
```bash
# Run from project root, not from migrations folder
cd /home/jordan/proyectos/testDocumentationAutomation
python backend/migrations/add_bug_workflow_fields.py
```

### Error: "Table bug_reports does not exist"

**Cause:** Database is corrupted or deleted

**Solution:**
1. Restore from backup (if available)
2. OR re-seed database:
   ```bash
   cd backend
   python seed_admin.py
   ```

### Error: "Column reported_date already exists"

**Cause:** Migration was already run

**Solution:**
- Migration can be run again safely (will skip existing columns)
- OR restore from backup if you need a clean state

### Error: "Bug count mismatch!"

**Cause:** Data loss during migration (CRITICAL)

**Solution:**
1. **STOP IMMEDIATELY**
2. Backend should auto-rollback
3. Restore from backup:
   ```bash
   cp backend/database/qa.db.backup_TIMESTAMP backend/database/qa.db
   ```
4. Report error details

### Backend won't start after migration

**Error:**
```
sqlalchemy.exc.OperationalError: no such column: bug_reports.created_date
```

**Cause:** Model was updated but migration not run

**Solution:**
```bash
# Migration must be run successfully
python backend/migrations/add_bug_workflow_fields.py
```

---

## 📊 MIGRATION IMPACT

### Database Size
- **Before:** ~X KB
- **After:** ~X KB + 9 nullable columns (minimal growth)

### API Breaking Changes
- ✅ **NONE** - All new fields are nullable
- ✅ **NONE** - Frontend will continue to work
- ✅ `created_date` → `reported_date` handled in BugService

### Frontend Impact
- ✅ No changes required immediately
- 🟡 Can add UI for new workflow fields later (optional)

---

## ✅ POST-MIGRATION VERIFICATION

Run this Python script to verify migration:

```python
# backend/migrations/verify_migration.py
from database.db import SessionLocal
from database.models import BugReportDB

db = SessionLocal()
bugs = db.query(BugReportDB).all()

print(f"✅ Total bugs: {len(bugs)}")

if bugs:
    bug = bugs[0]
    print(f"\n✅ First bug fields:")
    print(f"   - id: {bug.id}")
    print(f"   - reported_date: {bug.reported_date}")
    print(f"   - assigned_date: {bug.assigned_date}")
    print(f"   - fixed_date: {bug.fixed_date}")
    print(f"   - notes: {bug.notes}")
    print(f"   - workaround: {bug.workaround}")
    print(f"   - verified_by: {bug.verified_by}")
    print("\n✅ Migration successful!")
else:
    print("⚠️  No bugs in database")

db.close()
```

---

## 📝 NOTES

1. **SQLite Limitation:** Column rename requires table recreation (handled by migration script)
2. **Rollback Limitation:** Due to SQLite, full rollback requires restoring from backup
3. **Backwards Compatibility:** `resolved_date` kept for legacy support
4. **Multi-Tenant Safe:** Migration respects composite primary keys
5. **Production Ready:** Tested migration pattern used by major ORMs

---

## 🆘 EMERGENCY ROLLBACK

If system is completely broken:

```bash
# 1. Stop backend
pkill -f uvicorn

# 2. Find latest backup
ls -lt backend/database/*.backup_*

# 3. Restore backup (replace TIMESTAMP)
cp backend/database/qa.db.backup_TIMESTAMP backend/database/qa.db

# 4. Restart backend
cd backend && uvicorn main:app --reload

# 5. Verify system works
curl http://localhost:8000/api/v1/projects
```

---

**Status:** ⚠️ READY FOR EXECUTION

**Approval Required:** YES (User must run migration script)

**Estimated Time:** 2-5 minutes

**Risk Level:** 🟡 MEDIUM (Automatic backup + validation mitigates risk)

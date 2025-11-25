"""
Verify bug integrity - check for orphaned bugs with deleted test_case_ids
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.database.db import SessionLocal
from backend.database.models import BugReportDB, TestCaseDB

def verify_bug_integrity():
    db = SessionLocal()

    print("🔍 Checking for orphaned bugs...")
    print("=" * 80)

    # Get all bugs with test_case_id
    bugs_with_test_case = db.query(BugReportDB).filter(
        BugReportDB.test_case_id.isnot(None)
    ).all()

    orphaned_bugs = []

    for bug in bugs_with_test_case:
        # Check if test case still exists
        test_case = db.query(TestCaseDB).filter(
            TestCaseDB.id == bug.test_case_id,
            TestCaseDB.project_id == bug.project_id,
            TestCaseDB.organization_id == bug.organization_id
        ).first()

        if not test_case:
            orphaned_bugs.append(bug)
            print(f"❌ ORPHANED BUG: {bug.id}")
            print(f"   Title: {bug.title}")
            print(f"   Test Case ID (deleted): {bug.test_case_id}")
            print(f"   Project: {bug.project_id}")
            print(f"   Assigned to: {bug.assigned_to}")
            print()

    print("=" * 80)
    print(f"\n📊 SUMMARY:")
    print(f"   Total bugs with test_case_id: {len(bugs_with_test_case)}")
    print(f"   Orphaned bugs: {len(orphaned_bugs)}")

    if orphaned_bugs:
        print(f"\n⚠️  Found {len(orphaned_bugs)} orphaned bugs!")
        print(f"   These bugs reference deleted test cases and should be cleaned up.")
        print(f"\n💡 To fix: Run cleanup script or manually delete orphaned bugs")

        response = input("\n🗑️  Delete orphaned bugs now? (yes/no): ").strip().lower()
        if response == 'yes':
            for bug in orphaned_bugs:
                db.delete(bug)
            db.commit()
            print(f"✅ Deleted {len(orphaned_bugs)} orphaned bugs")
        else:
            print("❌ Cleanup cancelled")
    else:
        print(f"\n✅ No orphaned bugs found - database integrity is good!")

    db.close()

if __name__ == "__main__":
    verify_bug_integrity()

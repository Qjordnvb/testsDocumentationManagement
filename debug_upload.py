#!/usr/bin/env python3
"""
Debug script: Verificar qué datos tiene la BD después de upload
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from database.db import SessionLocal
from database.models import UserStoryDB, ProjectDB
import json

def debug_data():
    db = SessionLocal()

    print("=" * 70)
    print("🔍 DEBUG: Datos en la Base de Datos")
    print("=" * 70)
    print()

    # 1. Proyectos
    projects = db.query(ProjectDB).all()
    print(f"📁 Total Proyectos: {len(projects)}")
    for p in projects:
        print(f"   - {p.id}: {p.name}")
    print()

    if not projects:
        print("❌ No hay proyectos. Primero crea un proyecto.")
        print("   Ir a: http://localhost:5173/ → Nuevo Proyecto")
        db.close()
        return

    # 2. User Stories
    total_stories = db.query(UserStoryDB).count()
    print(f"📊 Total User Stories: {total_stories}")
    print()

    if total_stories == 0:
        print("❌ No hay user stories. Upload un Excel con datos.")
        print("   Ir a: /projects/PROJ-XXX/stories → Subir Excel/CSV")
        db.close()
        return

    # 3. Detalles de cada story
    stories = db.query(UserStoryDB).all()

    print("📋 DETALLES DE USER STORIES:")
    print("=" * 70)

    stories_with_criteria = 0
    total_criteria_count = 0

    for s in stories:
        print(f"\n{s.id}: {s.title}")
        print(f"  Project: {s.project_id}")
        print(f"  Status: {s.status}")

        # Verificar acceptance_criteria
        print(f"\n  🔍 Acceptance Criteria (BD raw):")
        print(f"     acceptance_criteria field: {repr(s.acceptance_criteria)[:100]}...")
        print(f"     total_criteria: {s.total_criteria}")
        print(f"     completed_criteria: {s.completed_criteria}")
        print(f"     completion_percentage: {s.completion_percentage}%")

        # Parse JSON
        if s.acceptance_criteria:
            try:
                criteria = json.loads(s.acceptance_criteria)
                print(f"\n  ✅ Parsed JSON: {len(criteria)} criterios")
                stories_with_criteria += 1
                total_criteria_count += len(criteria)

                # Mostrar primeros 3
                for i, c in enumerate(criteria[:3], 1):
                    status = "✓" if c.get('completed', False) else "○"
                    desc = c.get('description', 'N/A')
                    print(f"     {i}. {status} {desc[:60]}")

                if len(criteria) > 3:
                    print(f"     ... y {len(criteria) - 3} más")

            except json.JSONDecodeError as e:
                print(f"  ❌ ERROR parseando JSON: {e}")
                print(f"     Raw value: {s.acceptance_criteria[:200]}")
        else:
            print(f"  ❌ Campo acceptance_criteria es NULL o vacío")

        print("-" * 70)

    # Resumen
    print(f"\n📈 RESUMEN:")
    print(f"   Total stories: {total_stories}")
    print(f"   Stories con criterios: {stories_with_criteria}")
    print(f"   Stories sin criterios: {total_stories - stories_with_criteria}")
    print(f"   Total criterios de aceptación: {total_criteria_count}")

    if stories_with_criteria == 0:
        print(f"\n❌ PROBLEMA: Ninguna story tiene criterios de aceptación")
        print(f"\n🔧 SOLUCIONES POSIBLES:")
        print(f"   1. Verificar que el Excel tiene la columna 'acceptance_criteria'")
        print(f"   2. Verificar que los criterios están separados por: \\n, ;, |, o - ")
        print(f"   3. Ejemplo de formato correcto:")
        print(f"      - User can login\\n- System validates credentials\\n- Redirect to dashboard")
        print(f"   4. Re-upload el Excel con el formato correcto")

    db.close()

if __name__ == "__main__":
    try:
        debug_data()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

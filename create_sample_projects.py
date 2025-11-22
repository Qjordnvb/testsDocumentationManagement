#!/usr/bin/env python3
"""
create_sample_projects.py - Crea proyectos de ejemplo
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from backend.database.db import SessionLocal
from backend.database.models import ProjectDB
from backend.models import ProjectStatus
from datetime import datetime

def create_sample_projects():
    """Create sample projects for testing"""
    db = SessionLocal()

    try:
        # Check if projects already exist
        existing_count = db.query(ProjectDB).count()
        if existing_count > 0:
            print(f"⚠️  Ya existen {existing_count} proyectos en la base de datos")
            print("   ¿Deseas crearlos de todas formas? (algunos IDs pueden duplicarse)")
            response = input("   [y/N]: ").strip().lower()
            if response != 'y':
                print("❌ Cancelado")
                return

        print("📁 Creando proyectos de ejemplo...\n")

        # Project 1
        project1 = ProjectDB(
            id="PROJ-001",
            name="E-commerce Platform QA",
            description="Testing para plataforma de e-commerce con 1M+ usuarios",
            client="MegaStore Inc.",
            team_members='["qa1@example.com", "qa2@example.com"]',
            status=ProjectStatus.ACTIVE.value,
            default_test_types='["FUNCTIONAL", "UI", "API"]',
            start_date=datetime(2025, 1, 1),
            created_date=datetime.now(),
            updated_date=datetime.now()
        )

        # Project 2
        project2 = ProjectDB(
            id="PROJ-002",
            name="Mobile Banking App",
            description="QA para aplicación bancaria móvil con enfoque en seguridad",
            client="SecureBank SA",
            team_members='["qa3@example.com", "security@example.com"]',
            status=ProjectStatus.ACTIVE.value,
            default_test_types='["FUNCTIONAL", "SECURITY", "PERFORMANCE"]',
            start_date=datetime(2025, 2, 1),
            created_date=datetime.now(),
            updated_date=datetime.now()
        )

        # Project 3
        project3 = ProjectDB(
            id="PROJ-003",
            name="Healthcare Portal",
            description="Testing de portal médico con compliance HIPAA",
            client="HealthTech Corp",
            team_members='["qa4@example.com"]',
            status=ProjectStatus.ACTIVE.value,
            default_test_types='["FUNCTIONAL", "SECURITY", "ACCESSIBILITY"]',
            start_date=datetime(2025, 3, 1),
            created_date=datetime.now(),
            updated_date=datetime.now()
        )

        # Add all projects
        db.add_all([project1, project2, project3])
        db.commit()

        print("✅ Proyectos creados exitosamente:\n")
        print("   1. PROJ-001: E-commerce Platform QA")
        print("      - Cliente: MegaStore Inc.")
        print("      - Test Types: FUNCTIONAL, UI, API")
        print("")
        print("   2. PROJ-002: Mobile Banking App")
        print("      - Cliente: SecureBank SA")
        print("      - Test Types: FUNCTIONAL, SECURITY, PERFORMANCE")
        print("")
        print("   3. PROJ-003: Healthcare Portal")
        print("      - Cliente: HealthTech Corp")
        print("      - Test Types: FUNCTIONAL, SECURITY, ACCESSIBILITY")
        print("")
        print("📊 Total: 3 proyectos")
        print("")
        print("Próximos pasos:")
        print("  1. make dev                          # Iniciar servicios")
        print("  2. Subir Excel a PROJ-001 o PROJ-002")
        print("  3. Verificar que NO hay error UNIQUE constraint")
        print("")

    except Exception as e:
        print(f"❌ Error creando proyectos: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_projects()

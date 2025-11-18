#!/usr/bin/env python3
"""Script para inicializar la BD con datos de ejemplo"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from database.db import SessionLocal
from database.models import ProjectDB, UserStoryDB
import json
from datetime import datetime

def create_sample_data():
    db = SessionLocal()

    try:
        # Check if data already exists
        existing_projects = db.query(ProjectDB).count()
        if existing_projects > 0:
            print(f"⚠️  Ya existen {existing_projects} proyectos en la BD")
            response = input("¿Quieres agregar datos de ejemplo de todas formas? (y/n): ")
            if response.lower() != 'y':
                print("❌ Operación cancelada")
                return

        print("\n🚀 Creando datos de ejemplo...\n")

        # 1. Create Project
        project = ProjectDB(
            id="PROJ-001",
            name="E-commerce Platform QA",
            description="Testing project for e-commerce platform",
            client="TechCorp Inc.",
            team_members=json.dumps(["qa1@example.com", "qa2@example.com"]),
            status="active",
            default_test_types=json.dumps(["FUNCTIONAL", "UI", "API"]),
            start_date=datetime(2025, 1, 1),
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        db.add(project)
        db.commit()
        print(f"✅ Proyecto creado: {project.id} - {project.name}")

        # 2. Create User Stories with Acceptance Criteria
        stories_data = [
            {
                "id": "US-001",
                "title": "User Login",
                "description": "Como usuario registrado, quiero poder iniciar sesión en la plataforma para acceder a mi cuenta y realizar compras.",
                "priority": "Critical",
                "status": "In Progress",
                "epic": "Authentication",
                "sprint": "Sprint 1",
                "story_points": 5,
                "assigned_to": "qa1@example.com",
                "acceptance_criteria": [
                    {
                        "id": "AC-1",
                        "description": "El usuario puede ingresar email y password en el formulario de login",
                        "completed": True
                    },
                    {
                        "id": "AC-2",
                        "description": "El sistema valida las credenciales contra la base de datos",
                        "completed": True
                    },
                    {
                        "id": "AC-3",
                        "description": "Login exitoso redirige al dashboard del usuario",
                        "completed": False
                    },
                    {
                        "id": "AC-4",
                        "description": "Login fallido muestra mensaje de error claro",
                        "completed": False
                    }
                ]
            },
            {
                "id": "US-002",
                "title": "Product Search",
                "description": "Como usuario, quiero buscar productos por nombre o categoría para encontrar fácilmente lo que necesito.",
                "priority": "High",
                "status": "To Do",
                "epic": "Shopping Experience",
                "sprint": "Sprint 2",
                "story_points": 8,
                "assigned_to": "qa2@example.com",
                "acceptance_criteria": [
                    {
                        "id": "AC-1",
                        "description": "Barra de búsqueda visible en todas las páginas",
                        "completed": False
                    },
                    {
                        "id": "AC-2",
                        "description": "Búsqueda por nombre devuelve resultados relevantes",
                        "completed": False
                    },
                    {
                        "id": "AC-3",
                        "description": "Filtros por categoría, precio y rating disponibles",
                        "completed": False
                    }
                ]
            },
            {
                "id": "US-003",
                "title": "Add to Cart",
                "description": "Como usuario, quiero agregar productos al carrito para comprarlos más tarde.",
                "priority": "High",
                "status": "Backlog",
                "epic": "Shopping Experience",
                "sprint": "Sprint 2",
                "story_points": 3,
                "acceptance_criteria": [
                    {
                        "id": "AC-1",
                        "description": "Botón 'Agregar al carrito' visible en página de producto",
                        "completed": False
                    },
                    {
                        "id": "AC-2",
                        "description": "Carrito muestra cantidad actualizada después de agregar",
                        "completed": False
                    }
                ]
            },
            {
                "id": "US-004",
                "title": "Checkout Process",
                "description": "Como usuario, quiero completar el proceso de checkout para finalizar mi compra de forma segura.",
                "priority": "Critical",
                "status": "Testing",
                "epic": "Payment",
                "sprint": "Sprint 1",
                "story_points": 13,
                "assigned_to": "qa1@example.com",
                "acceptance_criteria": [
                    {
                        "id": "AC-1",
                        "description": "Usuario puede ingresar dirección de envío",
                        "completed": True
                    },
                    {
                        "id": "AC-2",
                        "description": "Usuario puede seleccionar método de pago",
                        "completed": True
                    },
                    {
                        "id": "AC-3",
                        "description": "Sistema valida datos de tarjeta de crédito",
                        "completed": True
                    },
                    {
                        "id": "AC-4",
                        "description": "Confirmación de compra enviada por email",
                        "completed": False
                    },
                    {
                        "id": "AC-5",
                        "description": "Integración con gateway de pago funciona correctamente",
                        "completed": True
                    }
                ]
            },
            {
                "id": "US-005",
                "title": "User Registration",
                "description": "Como nuevo usuario, quiero registrarme en la plataforma para poder realizar compras.",
                "priority": "High",
                "status": "Done",
                "epic": "Authentication",
                "sprint": "Sprint 1",
                "story_points": 5,
                "assigned_to": "qa2@example.com",
                "acceptance_criteria": [
                    {
                        "id": "AC-1",
                        "description": "Formulario de registro solicita email, password y nombre",
                        "completed": True
                    },
                    {
                        "id": "AC-2",
                        "description": "Email de verificación enviado después del registro",
                        "completed": True
                    },
                    {
                        "id": "AC-3",
                        "description": "Usuario puede confirmar cuenta mediante link en email",
                        "completed": True
                    }
                ]
            }
        ]

        created_count = 0
        for story_data in stories_data:
            criteria = story_data.pop("acceptance_criteria")

            story = UserStoryDB(
                **story_data,
                project_id=project.id,
                acceptance_criteria=json.dumps(criteria),
                total_criteria=len(criteria),
                completed_criteria=sum(1 for c in criteria if c["completed"]),
                completion_percentage=(sum(1 for c in criteria if c["completed"]) / len(criteria) * 100) if criteria else 0,
                created_date=datetime.now(),
                updated_date=datetime.now()
            )
            db.add(story)
            created_count += 1

            # Show criteria details
            completed = sum(1 for c in criteria if c["completed"])
            print(f"✅ User Story: {story.id} - {story.title}")
            print(f"   Criterios: {completed}/{len(criteria)} completados ({story.completion_percentage:.0f}%)")

        db.commit()

        print(f"\n📊 Resumen:")
        print(f"   Proyectos creados: 1")
        print(f"   User Stories creadas: {created_count}")
        print(f"   Total criterios de aceptación: {sum(len(s['acceptance_criteria']) for s in stories_data)}")

        print(f"\n🎯 Siguiente paso:")
        print(f"   1. Iniciar backend: cd backend && python main.py")
        print(f"   2. Iniciar frontend: cd frontend && npm run dev")
        print(f"   3. Abrir: http://localhost:5173/projects/PROJ-001/stories")
        print(f"   4. Click en el chevron > para expandir filas y ver criterios")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("  SEED DATA - Datos de Ejemplo para QA Automation System")
    print("=" * 60)
    create_sample_data()

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import json
import os
from datetime import datetime

from backend.database import get_db, ProjectDB, UserStoryDB, TestCaseDB
from backend.models import UserStory, AcceptanceCriteria, TestCase, TestType, TestPriority, TestStatus
from backend.generators import GherkinGenerator
from backend.integrations import GeminiClient
from backend.config import settings
from backend.api.dependencies import get_gemini_client

router = APIRouter()

@router.post("/generate-test-cases/{story_id}")
async def generate_test_cases(
    story_id: str,
    use_ai: bool = True,
    num_scenarios: int = 3,
    db: Session = Depends(get_db),
    gemini_client: GeminiClient = Depends(get_gemini_client)
):
    """
    Generate test cases with Gherkin scenarios for a user story
    """
    # Get user story from database
    story_db = db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
    if not story_db:
        raise HTTPException(status_code=404, detail="User story not found")

    # Validate user story has project_id
    if not story_db.project_id:
        raise HTTPException(
            status_code=400,
            detail=f"User story {story_id} is not associated with a project. Please re-import user stories with project_id."
        )

    # Parse acceptance criteria from JSON
    acceptance_criteria = []
    if story_db.acceptance_criteria:
        try:
            criteria_data = json.loads(story_db.acceptance_criteria)
            acceptance_criteria = [AcceptanceCriteria(**ac) for ac in criteria_data]
        except Exception as e:
            print(f"Warning: Failed to parse acceptance criteria for {story_id}: {e}")

    # Convert to UserStory model with full data including acceptance criteria
    user_story = UserStory(
        id=story_db.id,
        title=story_db.title,
        description=story_db.description,
        acceptance_criteria=acceptance_criteria,
        priority=story_db.priority,
        status=story_db.status,
        epic=story_db.epic,
        sprint=story_db.sprint,
        story_points=story_db.story_points,
        assigned_to=story_db.assigned_to
    )

    # Generate scenarios
    gherkin_gen = GherkinGenerator(gemini_client if use_ai else None)

    settings.ensure_directories()

    try:
        gherkin_file = gherkin_gen.generate_from_user_story(
            user_story=user_story,
            output_dir=settings.output_dir,
            use_ai=use_ai,
            num_scenarios=num_scenarios
        )
    except Exception as e:
        # Handle API errors (e.g., API key issues)
        error_msg = str(e)
        if "403" in error_msg or "API key" in error_msg:
            raise HTTPException(
                status_code=403,
                detail="Gemini API error: Invalid or leaked API key. Please update your GEMINI_API_KEY in .env file. Get a new key at https://aistudio.google.com/app/apikey"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Error generating test scenarios: {error_msg}"
            )

    # UPSERT: Create or update test case record in database
    test_case_id = f"TC-{story_id}-001"

    # Check if test case already exists
    existing_test_case = db.query(TestCaseDB).filter(TestCaseDB.id == test_case_id).first()

    if existing_test_case:
        # Update existing test case
        print(f"  Updating test case: {test_case_id}")
        existing_test_case.title = f"Test for {user_story.title}"
        existing_test_case.description = f"Automated test scenarios for {user_story.id}"
        existing_test_case.gherkin_file_path = gherkin_file
        action = "updated"
    else:
        # Create new test case
        print(f"  Creating new test case: {test_case_id}")
        db_test_case = TestCaseDB(
            id=test_case_id,
            project_id=story_db.project_id,  # Inherit from user story
            title=f"Test for {user_story.title}",
            description=f"Automated test scenarios for {user_story.id}",
            user_story_id=story_id,
            gherkin_file_path=gherkin_file,
            created_date=datetime.now()
        )
        db.add(db_test_case)
        action = "created"

    db.commit()
    db.refresh(existing_test_case if existing_test_case else db_test_case)

    # Get the saved/updated test case for response
    test_case = existing_test_case if existing_test_case else db_test_case

    # Return in format expected by frontend
    return {
        "message": f"Test cases {action} successfully",
        "test_cases": [{
            "id": test_case.id,
            "title": test_case.title,
            "description": test_case.description,
            "user_story_id": test_case.user_story_id,
            "test_type": test_case.test_type.value if test_case.test_type else None,
            "priority": test_case.priority.value if test_case.priority else None,
            "status": test_case.status.value if test_case.status else None,
            "estimated_time_minutes": test_case.estimated_time_minutes,
            "actual_time_minutes": test_case.actual_time_minutes,
            "automated": test_case.automated,
            "created_date": test_case.created_date.isoformat() if test_case.created_date else None,
            "gherkin_file_path": test_case.gherkin_file_path,
        }],
        "action": action,
        "gherkin_file": gherkin_file
    }


@router.get("/test-cases")
async def get_test_cases(
    project_id: str = Query(..., description="Filter test cases by project ID"),
    db: Session = Depends(get_db)
):
    """Get all test cases for a specific project"""
    # Validate project exists
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Filter test cases by project
    test_cases = db.query(TestCaseDB).filter(TestCaseDB.project_id == project_id).all()
    return {
        "test_cases": [
            {
                "id": tc.id,
                "title": tc.title,
                "description": tc.description,
                "user_story_id": tc.user_story_id,
                "test_type": tc.test_type.value if tc.test_type else None,
                "priority": tc.priority.value if tc.priority else None,
                "status": tc.status.value if tc.status else None,
                "estimated_time_minutes": tc.estimated_time_minutes,
                "actual_time_minutes": tc.actual_time_minutes,
                "automated": tc.automated,
                "created_date": tc.created_date.isoformat() if tc.created_date else None,
                "last_executed": tc.last_executed.isoformat() if tc.last_executed else None,
                "executed_by": tc.executed_by,
                "gherkin_file_path": tc.gherkin_file_path,
            }
            for tc in test_cases
        ]
    }


@router.post("/generate-test-cases/{story_id}/preview")
async def preview_test_cases(
    story_id: str,
    num_test_cases: int = Query(default=5, ge=1, le=10),
    scenarios_per_test: int = Query(default=3, ge=1, le=10),
    test_types: List[str] = Query(default=["FUNCTIONAL", "UI"]),
    use_ai: bool = True,
    db: Session = Depends(get_db),
    gemini_client: GeminiClient = Depends(get_gemini_client)
):
    """
    Generate test case suggestions (PREVIEW - does NOT save to DB)
    QA will review before saving
    """
    # Get user story
    story_db = db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
    if not story_db:
        raise HTTPException(status_code=404, detail="User story not found")

    # Validate user story has project_id
    if not story_db.project_id:
        raise HTTPException(
            status_code=400,
            detail=f"User story {story_id} is not associated with a project. Please re-import user stories with project_id."
        )

    # Parse acceptance criteria from JSON
    acceptance_criteria = []
    if story_db.acceptance_criteria:
        try:
            criteria_data = json.loads(story_db.acceptance_criteria)
            acceptance_criteria = [AcceptanceCriteria(**ac) for ac in criteria_data]
        except Exception as e:
            print(f"Warning: Failed to parse acceptance criteria for {story_id}: {e}")

    user_story = UserStory(
        id=story_db.id,
        title=story_db.title,
        description=story_db.description,
        acceptance_criteria=acceptance_criteria,
        priority=story_db.priority,
        status=story_db.status,
        epic=story_db.epic,
        sprint=story_db.sprint,
        story_points=story_db.story_points,
        assigned_to=story_db.assigned_to
    )

    # Generate multiple test cases with AI
    suggested_test_cases = []

    # Generate Gherkin scenarios using AI if enabled
    gherkin_scenarios = []
    if use_ai:
        try:
            total_scenarios_needed = scenarios_per_test * num_test_cases

            # Use batched generation for better reliability and performance
            gherkin_scenarios = gemini_client.generate_gherkin_scenarios_batched(
                user_story,
                num_scenarios=total_scenarios_needed,
                batch_size=15  # Generate max 15 scenarios per API call
            )
        except Exception as e:
            import traceback
            print(f"❌ AI generation failed with error:")
            print(f"   Error type: {type(e).__name__}")
            print(f"   Error message: {str(e)}")
            print(f"   Traceback:")
            traceback.print_exc()
            print(f"⚠️  Using fallback generation instead")
            use_ai = False

    # Distribute scenarios across test cases
    scenarios_per_tc = len(gherkin_scenarios) // num_test_cases if gherkin_scenarios else scenarios_per_test

    for i in range(num_test_cases):
        # Determine test type for this test case
        test_type = test_types[i % len(test_types)] if test_types else "FUNCTIONAL"

        # Generate title based on test type and position
        titles = {
            "FUNCTIONAL": f"Functional tests for {user_story.title}",
            "UI": f"UI validation for {user_story.title}",
            "SECURITY": f"Security tests for {user_story.title}",
            "API": f"API tests for {user_story.title}",
            "INTEGRATION": f"Integration tests for {user_story.title}",
        }
        title = titles.get(test_type, f"Test case {i+1} for {user_story.title}")

        # Get scenarios for this test case
        start_idx = i * scenarios_per_tc
        end_idx = start_idx + scenarios_per_tc
        test_scenarios = gherkin_scenarios[start_idx:end_idx] if gherkin_scenarios else []

        # Generate Gherkin content
        if test_scenarios:
            gherkin_lines = [
                f"Feature: {title}",
                f"  {user_story.description[:200]}..." if len(user_story.description) > 200 else f"  {user_story.description}",
                "",
                f"  User Story: {user_story.id}",
                f"  Test Type: {test_type}",
                "",
            ]

            for scenario in test_scenarios:
                gherkin_lines.append(scenario.to_gherkin())
                gherkin_lines.append("")  # Empty line between scenarios

            gherkin_content = "\n".join(gherkin_lines)
        else:
            # Fallback: Generate multiple scenarios based on test type (NO AI) - EN ESPAÑOL
            gherkin_lines = [
                f"Feature: {title}",
                f"  {user_story.description}",
                "",
                f"  Historia de Usuario: {user_story.id}",
                f"  Tipo de Prueba: {test_type}",
                f"  Nota: Generación con IA no disponible - usando escenarios de plantilla",
                "",
            ]

            # Generate scenarios_per_test scenarios based on test type
            for s in range(1, scenarios_per_test + 1):
                scenario_type = "Camino Feliz" if s == 1 else ("Negativo" if s == 2 else f"Caso Extremo {s-2}")
                scenario_type_en = "Happy Path" if s == 1 else ("Negative" if s == 2 else f"Edge Case {s-2}")

                if test_type == "FUNCTIONAL":
                    gherkin_lines.extend([
                        f"@{test_type.lower()} @{scenario_type_en.lower().replace(' ', '_')}",
                        f"Scenario {s}: {scenario_type} - {user_story.title[:50]}",
                        f"  Given el sistema está configurado para {user_story.id}",
                        f"  And todos los prerequisitos están cumplidos",
                        f"  When {'se realiza la acción válida' if s == 1 else 'se intenta una acción inválida' if s == 2 else 'se presentan condiciones de caso extremo'}",
                        f"  Then {'se logra el resultado esperado' if s == 1 else 'ocurre el manejo de errores apropiado' if s == 2 else 'se manejan correctamente las condiciones de frontera'}",
                        f"  And el estado del sistema {'se actualiza correctamente' if s == 1 else 'permanece consistente'}",
                        ""
                    ])
                elif test_type == "UI":
                    gherkin_lines.extend([
                        f"@{test_type.lower()} @{scenario_type_en.lower().replace(' ', '_')}",
                        f"Scenario {s}: UI {scenario_type} - {user_story.title[:50]}",
                        f"  Given el usuario está en la página relevante para {user_story.id}",
                        f"  And los elementos de UI están cargados",
                        f"  When el usuario {'realiza la acción principal de UI' if s == 1 else 'intenta una interacción de UI inválida' if s == 2 else 'prueba casos extremos de UI'}",
                        f"  Then {'la UI responde correctamente' if s == 1 else 'aparecen mensajes de validación apropiados' if s == 2 else 'la UI maneja casos extremos apropiadamente'}",
                        f"  And el estado visual se actualiza apropiadamente",
                        ""
                    ])
                elif test_type == "API":
                    gherkin_lines.extend([
                        f"@{test_type.lower()} @{scenario_type_en.lower().replace(' ', '_')}",
                        f"Scenario {s}: API {scenario_type} - {user_story.title[:50]}",
                        f"  Given el endpoint de API está disponible para {user_story.id}",
                        f"  And la autenticación es {'válida' if s == 1 else 'inválida' if s == 2 else 'caso extremo'}",
                        f"  When se realiza una petición API {'válida' if s == 1 else 'inválida' if s == 2 else 'de frontera'}",
                        f"  Then el código de respuesta es {'200 OK' if s == 1 else '400/401' if s == 2 else 'apropiado'}",
                        f"  And los datos de respuesta coinciden con el esquema esperado",
                        ""
                    ])
                else:
                    gherkin_lines.extend([
                        f"@{test_type.lower()} @{scenario_type_en.lower().replace(' ', '_')}",
                        f"Scenario {s}: {scenario_type} - {user_story.title[:50]}",
                        f"  Given el sistema está listo para probar {user_story.id}",
                        f"  And todas las precondiciones están satisfechas",
                        f"  When se ejecuta la acción de prueba",
                        f"  Then se verifica el resultado esperado",
                        f"  And no ocurren efectos secundarios inesperados",
                        ""
                    ])

            gherkin_content = "\n".join(gherkin_lines)

        suggested_test_cases.append({
            "suggested_id": f"TC-{story_id}-{str(i+1).zfill(3)}",
            "title": title,
            "description": f"{test_type} test scenarios for {user_story.id}",
            "test_type": test_type,
            "priority": "MEDIUM",
            "status": "NOT_RUN",
            "scenarios_count": len(test_scenarios) if test_scenarios else scenarios_per_test,
            "gherkin_content": gherkin_content,
            "can_edit": True,
            "can_delete": True
        })

    response = {
        "project_id": story_db.project_id,  # Include project_id for frontend
        "user_story_id": story_id,
        "user_story_title": user_story.title,
        "suggested_test_cases": suggested_test_cases,
        "total_suggested": len(suggested_test_cases),
        "can_edit_before_save": True,
        "can_add_more": True,
        "ai_generated": len(gherkin_scenarios) > 0
    }

    # Add warning if AI generation failed
    if use_ai and len(gherkin_scenarios) == 0:
        response["warning"] = {
            "message": "AI generation unavailable - using template scenarios",
            "reason": "Gemini API key may be invalid, expired, or blocked. Check backend logs for details.",
            "action": "Generate a new API key at: https://makersuite.google.com/app/apikey"
        }

    return response

@router.post("/test-cases/batch")
async def create_test_cases_batch(
    test_cases_data: dict,
    db: Session = Depends(get_db)
):
    """
    Create multiple test cases at once (after QA review)
    """
    print("=" * 80)
    print("🚀 BATCH CREATE TEST CASES - START")
    print(f"📦 Received data: {test_cases_data}")
    print("=" * 80)

    test_cases = test_cases_data.get("test_cases", [])
    user_story_id = test_cases_data.get("user_story_id")

    print(f"📊 Number of test cases to create: {len(test_cases)}")
    print(f"📝 User story ID: {user_story_id}")

    if not user_story_id:
        raise HTTPException(status_code=400, detail="user_story_id is required")

    # Get user story to inherit project_id
    user_story = db.query(UserStoryDB).filter(UserStoryDB.id == user_story_id).first()
    if not user_story:
        raise HTTPException(status_code=404, detail=f"User story {user_story_id} not found")

    print(f"✅ User story found: {user_story.id} - {user_story.title}")
    print(f"📁 Project ID: {user_story.project_id}")

    if not user_story.project_id:
        raise HTTPException(
            status_code=400,
            detail=f"User story {user_story_id} is not associated with a project"
        )

    created_test_cases = []

    # Get initial count ONCE before the loop to generate sequential IDs
    initial_count = db.query(TestCaseDB).filter(
        TestCaseDB.user_story_id == user_story_id
    ).count()
    print(f"📊 Initial test case count for story {user_story_id}: {initial_count}")

    for i, tc_data in enumerate(test_cases, 1):
        try:
            print(f"\n📝 Processing test case {i}/{len(test_cases)}...")
            print(f"   Data: {tc_data}")

            # Generate unique ID if not provided
            if "id" not in tc_data or not tc_data["id"]:
                # Use initial_count + current index to generate unique sequential IDs
                tc_data["id"] = f"TC-{user_story_id}-{str(initial_count + i).zfill(3)}"
                print(f"   Generated ID: {tc_data['id']}")

            # Save Gherkin content to file if provided
            gherkin_file_path = None
            if "gherkin_content" in tc_data:
                settings.ensure_directories()
                gherkin_file = f"{settings.output_dir}/{tc_data['id']}.feature"
                with open(gherkin_file, 'w') as f:
                    f.write(tc_data["gherkin_content"])
                gherkin_file_path = gherkin_file
                print(f"   ✅ Gherkin file saved: {gherkin_file}")

            # Parse enum values safely
            test_type_str = tc_data.get("test_type", "FUNCTIONAL")
            priority_str = tc_data.get("priority", "MEDIUM")
            status_str = tc_data.get("status", "NOT_RUN")

            print(f"   Enum values: type={test_type_str}, priority={priority_str}, status={status_str}")

            # Try to get enum by name (FUNCTIONAL), fallback to getting by value
            try:
                test_type = TestType[test_type_str]
            except KeyError:
                print(f"   ⚠️ TestType KeyError for '{test_type_str}', using fallback")
                # If name lookup fails, try value lookup
                test_type = next((t for t in TestType if t.name == test_type_str), TestType.FUNCTIONAL)

            try:
                priority = TestPriority[priority_str]
            except KeyError:
                print(f"   ⚠️ TestPriority KeyError for '{priority_str}', using fallback")
                priority = next((p for p in TestPriority if p.name == priority_str), TestPriority.MEDIUM)

            try:
                status = TestStatus[status_str]
            except KeyError:
                print(f"   ⚠️ TestStatus KeyError for '{status_str}', using fallback")
                status = next((s for s in TestStatus if s.name == status_str), TestStatus.NOT_RUN)

            print(f"   ✅ Enums resolved: {test_type}, {priority}, {status}")

            # Create test case
            db_test_case = TestCaseDB(
                id=tc_data["id"],
                project_id=user_story.project_id,  # Inherit from user story
                title=tc_data.get("title", "Untitled Test Case"),
                description=tc_data.get("description", ""),
                user_story_id=tc_data["user_story_id"],
                test_type=test_type,
                priority=priority,
                status=status,
                gherkin_file_path=gherkin_file_path,
                created_date=datetime.now()
            )

            db.add(db_test_case)
            created_test_cases.append(db_test_case)
            print(f"   ✅ Test case {tc_data['id']} added to session")

        except Exception as e:
            print(f"   ❌ ERROR processing test case {i}: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Error creating test case {i}: {str(e)}"
            )

    print(f"\n💾 Committing {len(created_test_cases)} test cases to database...")
    db.commit()
    print(f"✅ Commit successful!")

    print("=" * 80)
    print("🎉 BATCH CREATE TEST CASES - COMPLETE")
    print(f"✅ Created {len(created_test_cases)} test cases successfully")
    print("=" * 80)

    return {
        "message": f"Created {len(created_test_cases)} test cases successfully",
        "created_count": len(created_test_cases),
        "test_cases": [
            {
                "id": tc.id,
                "title": tc.title,
                "user_story_id": tc.user_story_id,
                "test_type": tc.test_type.value,
                "status": tc.status.value
            }
            for tc in created_test_cases
        ]
    }

@router.get("/test-cases/{test_id}")
async def get_test_case(test_id: str, db: Session = Depends(get_db)):
    """Get specific test case by ID"""
    tc = db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    return {
        "id": tc.id,
        "title": tc.title,
        "description": tc.description,
        "user_story_id": tc.user_story_id,
        "test_type": tc.test_type.value if tc.test_type else None,
        "priority": tc.priority.value if tc.priority else None,
        "status": tc.status.value if tc.status else None,
        "estimated_time_minutes": tc.estimated_time_minutes,
        "actual_time_minutes": tc.actual_time_minutes,
        "automated": tc.automated,
        "created_date": tc.created_date.isoformat() if tc.created_date else None,
        "last_executed": tc.last_executed.isoformat() if tc.last_executed else None,
        "executed_by": tc.executed_by,
        "gherkin_file_path": tc.gherkin_file_path,
    }

@router.put("/test-cases/{test_id}")
async def update_test_case(
    test_id: str,
    updates: dict,
    db: Session = Depends(get_db)
):
    """Update existing test case"""
    tc = db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    # Update allowed fields
    allowed_fields = [
        "title", "description", "test_type", "priority", "status",
        "estimated_time_minutes", "actual_time_minutes", "automated",
        "executed_by"
    ]

    for field, value in updates.items():
        if field in allowed_fields and value is not None:
            if field in ["test_type", "priority", "status"]:
                # Convert string to enum
                if field == "test_type":
                    value = TestType[value]
                elif field == "priority":
                    value = TestPriority[value]
                elif field == "status":
                    value = TestStatus[value]
            setattr(tc, field, value)

    db.commit()
    db.refresh(tc)

    return {
        "message": "Test case updated successfully",
        "test_case": {
            "id": tc.id,
            "title": tc.title,
            "description": tc.description,
            "test_type": tc.test_type.value if tc.test_type else None,
            "priority": tc.priority.value if tc.priority else None,
            "status": tc.status.value if tc.status else None,
        }
    }

# IMPORTANT: /batch endpoint MUST come BEFORE /{test_id} to avoid path matching conflicts
@router.delete("/test-cases/batch")
async def delete_test_cases_batch(
    test_case_ids: dict,
    db: Session = Depends(get_db)
):
    """Delete multiple test cases at once

    Accepts: {"test_case_ids": ["TC-001", "TC-002", ...]}
    """
    ids_to_delete = test_case_ids.get("test_case_ids", [])

    if not ids_to_delete:
        raise HTTPException(status_code=400, detail="No test case IDs provided")

    deleted_count = 0
    deleted_ids = []
    errors = []

    for test_id in ids_to_delete:
        try:
            tc = db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
            if tc:
                # Delete associated Gherkin file if exists
                if tc.gherkin_file_path and os.path.exists(tc.gherkin_file_path):
                    try:
                        os.remove(tc.gherkin_file_path)
                    except Exception as e:
                        print(f"Warning: Could not delete Gherkin file {tc.gherkin_file_path}: {e}")

                db.delete(tc)
                deleted_count += 1
                deleted_ids.append(test_id)
            else:
                errors.append(f"Test case {test_id} not found")
        except Exception as e:
            errors.append(f"Error deleting {test_id}: {str(e)}")

    db.commit()

    return {
        "message": f"Deleted {deleted_count} test case(s) successfully",
        "deleted_count": deleted_count,
        "deleted_ids": deleted_ids,
        "errors": errors if errors else None
    }

@router.delete("/test-cases/{test_id}")
async def delete_test_case(test_id: str, db: Session = Depends(get_db)):
    """Delete single test case"""
    tc = db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    # Delete associated Gherkin file if exists
    if tc.gherkin_file_path and os.path.exists(tc.gherkin_file_path):
        os.remove(tc.gherkin_file_path)

    db.delete(tc)
    db.commit()

    return {
        "message": "Test case deleted successfully",
        "deleted_id": test_id
    }

@router.get("/test-cases/{test_id}/gherkin")
async def get_gherkin_content(test_id: str, db: Session = Depends(get_db)):
    """Get Gherkin file content for a test case"""
    tc = db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    if not tc.gherkin_file_path or not os.path.exists(tc.gherkin_file_path):
        raise HTTPException(status_code=404, detail="Gherkin file not found")

    with open(tc.gherkin_file_path, 'r') as f:
        content = f.read()

    return {
        "test_case_id": test_id,
        "file_path": tc.gherkin_file_path,
        "gherkin_content": content
    }

@router.put("/test-cases/{test_id}/gherkin")
async def update_gherkin_content(
    test_id: str,
    content_data: dict,
    db: Session = Depends(get_db)
):
    """Update Gherkin file content for a test case"""
    tc = db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    gherkin_content = content_data.get("gherkin_content", "")

    # Create file if doesn't exist
    if not tc.gherkin_file_path:
        settings.ensure_directories()
        tc.gherkin_file_path = f"{settings.output_dir}/{test_id}.feature"

    # Write content to file
    with open(tc.gherkin_file_path, 'w') as f:
        f.write(gherkin_content)

    db.commit()

    return {
        "message": "Gherkin content updated successfully",
        "file_path": tc.gherkin_file_path
    }

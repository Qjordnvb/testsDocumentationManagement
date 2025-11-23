"""
Test Case Service Layer

Handles business logic for test case management operations following SOLID principles:
- Single Responsibility: Only handles test case-related business logic
- Dependency Inversion: Depends on Session abstraction
- Open/Closed: Easy to extend with new test case operations
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import os

from backend.database import ProjectDB, UserStoryDB, TestCaseDB
from backend.models import UserStory, AcceptanceCriteria, TestType, TestPriority, TestStatus
from backend.generators import GherkinGenerator
from backend.integrations import GeminiClient
from backend.config import settings


class TestCaseService:
    """Service class for test case-related business logic"""

    def __init__(self, db: Session, gemini_client: Optional[GeminiClient] = None):
        """Initialize service with database session and optional AI client"""
        self.db = db
        self.gemini_client = gemini_client

    def generate_test_cases(
        self,
        story_id: str,
        use_ai: bool = True,
        num_scenarios: int = 3
    ) -> Dict[str, Any]:
        """
        Generate test cases with Gherkin scenarios for a user story

        Args:
            story_id: User story ID
            use_ai: Whether to use AI generation
            num_scenarios: Number of scenarios to generate

        Returns:
            Dictionary with generated test cases info

        Raises:
            ValueError: If user story not found or missing project_id
        """
        # Get user story from database
        story_db = self.db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
        if not story_db:
            raise ValueError("User story not found")

        # Validate user story has project_id
        if not story_db.project_id:
            raise ValueError(
                f"User story {story_id} is not associated with a project. "
                "Please re-import user stories with project_id."
            )

        # Parse acceptance criteria
        user_story = self._parse_user_story(story_db)

        # Generate scenarios
        gherkin_gen = GherkinGenerator(self.gemini_client if use_ai else None)
        settings.ensure_directories()

        try:
            gherkin_file = gherkin_gen.generate_from_user_story(
                user_story=user_story,
                output_dir=settings.output_dir,
                use_ai=use_ai,
                num_scenarios=num_scenarios
            )
        except Exception as e:
            # Handle API errors
            error_msg = str(e)
            if "403" in error_msg or "API key" in error_msg:
                raise ValueError(
                    "Gemini API error: Invalid or leaked API key. "
                    "Please update your GEMINI_API_KEY in .env file. "
                    "Get a new key at https://aistudio.google.com/app/apikey"
                )
            else:
                raise ValueError(f"Error generating test scenarios: {error_msg}")

        # UPSERT: Create or update test case record
        test_case_id = f"TC-{story_id}-001"
        existing_test_case = self.db.query(TestCaseDB).filter(TestCaseDB.id == test_case_id).first()

        if existing_test_case:
            # Update existing test case
            print(f"  Updating test case: {test_case_id}")
            existing_test_case.title = f"Test for {user_story.title}"
            existing_test_case.description = f"Automated test scenarios for {user_story.id}"
            existing_test_case.gherkin_file_path = gherkin_file
            action = "updated"
            test_case = existing_test_case
        else:
            # Create new test case
            print(f"  Creating new test case: {test_case_id}")
            test_case = TestCaseDB(
                id=test_case_id,
                project_id=story_db.project_id,
                title=f"Test for {user_story.title}",
                description=f"Automated test scenarios for {user_story.id}",
                user_story_id=story_id,
                gherkin_file_path=gherkin_file,
                created_date=datetime.now()
            )
            self.db.add(test_case)
            action = "created"

        self.db.commit()
        self.db.refresh(test_case)

        return {
            "message": f"Test cases {action} successfully",
            "test_cases": [self._test_case_to_dict(test_case)],
            "action": action,
            "gherkin_file": gherkin_file
        }

    def get_test_cases_by_project(self, project_id: str) -> List[Dict[str, Any]]:
        """
        Get all test cases for a specific project

        Args:
            project_id: Project ID to filter test cases

        Returns:
            List of test case dictionaries

        Raises:
            ValueError: If project not found
        """
        # Validate project exists
        project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        # Filter test cases by project
        test_cases = self.db.query(TestCaseDB).filter(TestCaseDB.project_id == project_id).all()
        return [self._test_case_to_dict(tc) for tc in test_cases]

    def preview_test_cases(
        self,
        story_id: str,
        num_test_cases: int = 5,
        scenarios_per_test: int = 3,
        test_types: List[str] = None,
        use_ai: bool = True
    ) -> Dict[str, Any]:
        """
        Generate test case suggestions (PREVIEW - does NOT save to DB)

        Args:
            story_id: User story ID
            num_test_cases: Number of test cases to generate
            scenarios_per_test: Number of scenarios per test case
            test_types: List of test types (e.g., ["FUNCTIONAL", "UI"])
            use_ai: Whether to use AI generation

        Returns:
            Dictionary with suggested test cases

        Raises:
            ValueError: If user story not found or missing project_id
        """
        if test_types is None:
            test_types = ["FUNCTIONAL", "UI"]

        # Get user story
        story_db = self.db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
        if not story_db:
            raise ValueError("User story not found")

        # Validate user story has project_id
        if not story_db.project_id:
            raise ValueError(
                f"User story {story_id} is not associated with a project. "
                "Please re-import user stories with project_id."
            )

        # Parse user story
        user_story = self._parse_user_story(story_db)

        # Generate multiple test cases with AI
        suggested_test_cases = []
        gherkin_scenarios = []
        ai_failed = False

        # Generate Gherkin scenarios using AI if enabled
        if use_ai and self.gemini_client:
            try:
                total_scenarios_needed = scenarios_per_test * num_test_cases

                # Use batched generation for better reliability
                gherkin_scenarios = self.gemini_client.generate_gherkin_scenarios_batched(
                    user_story,
                    num_scenarios=total_scenarios_needed,
                    batch_size=15
                )
            except Exception as e:
                import traceback
                print(f"❌ AI generation failed with error:")
                print(f"   Error type: {type(e).__name__}")
                print(f"   Error message: {str(e)}")
                print(f"   Traceback:")
                traceback.print_exc()
                print(f"⚠️  Using fallback generation instead")
                ai_failed = True

        # Distribute scenarios across test cases
        scenarios_per_tc = len(gherkin_scenarios) // num_test_cases if gherkin_scenarios else scenarios_per_test

        for i in range(num_test_cases):
            # Determine test type for this test case
            test_type = test_types[i % len(test_types)] if test_types else "FUNCTIONAL"

            # Generate title based on test type
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
                gherkin_content = self._build_gherkin_from_scenarios(
                    title, user_story, test_type, test_scenarios
                )
            else:
                gherkin_content = self._build_fallback_gherkin(
                    title, user_story, test_type, scenarios_per_test
                )

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
            "project_id": story_db.project_id,
            "user_story_id": story_id,
            "user_story_title": user_story.title,
            "suggested_test_cases": suggested_test_cases,
            "total_suggested": len(suggested_test_cases),
            "can_edit_before_save": True,
            "can_add_more": True,
            "ai_generated": len(gherkin_scenarios) > 0
        }

        # Add warning if AI generation failed
        if (use_ai and len(gherkin_scenarios) == 0) or ai_failed:
            response["warning"] = {
                "message": "AI generation unavailable - using template scenarios",
                "reason": "Gemini API key may be invalid, expired, or blocked. Check backend logs for details.",
                "action": "Generate a new API key at: https://makersuite.google.com/app/apikey"
            }

        return response

    def create_test_cases_batch(
        self,
        test_cases_data: List[Dict[str, Any]],
        user_story_id: str
    ) -> Dict[str, Any]:
        """
        Create multiple test cases at once (after QA review)

        Args:
            test_cases_data: List of test case data dictionaries
            user_story_id: User story ID

        Returns:
            Dictionary with created test cases

        Raises:
            ValueError: If user story not found or missing project_id
        """
        print("=" * 80)
        print("🚀 BATCH CREATE TEST CASES - START")
        print(f"📊 Number of test cases to create: {len(test_cases_data)}")
        print(f"📝 User story ID: {user_story_id}")

        # Get user story to inherit project_id
        user_story = self.db.query(UserStoryDB).filter(UserStoryDB.id == user_story_id).first()
        if not user_story:
            raise ValueError(f"User story {user_story_id} not found")

        print(f"✅ User story found: {user_story.id} - {user_story.title}")
        print(f"📁 Project ID: {user_story.project_id}")

        if not user_story.project_id:
            raise ValueError(f"User story {user_story_id} is not associated with a project")

        created_test_cases = []

        # Get initial count for sequential ID generation
        initial_count = self.db.query(TestCaseDB).filter(
            TestCaseDB.user_story_id == user_story_id
        ).count()
        print(f"📊 Initial test case count for story {user_story_id}: {initial_count}")

        for i, tc_data in enumerate(test_cases_data, 1):
            try:
                print(f"\n📝 Processing test case {i}/{len(test_cases_data)}...")

                # Generate unique ID if not provided
                if "id" not in tc_data or not tc_data["id"]:
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

                # Parse enums safely
                test_type = self._parse_enum_safe(tc_data.get("test_type", "FUNCTIONAL"), TestType, TestType.FUNCTIONAL)
                priority = self._parse_enum_safe(tc_data.get("priority", "MEDIUM"), TestPriority, TestPriority.MEDIUM)
                status = self._parse_enum_safe(tc_data.get("status", "NOT_RUN"), TestStatus, TestStatus.NOT_RUN)

                print(f"   ✅ Enums resolved: {test_type}, {priority}, {status}")

                # Create test case
                db_test_case = TestCaseDB(
                    id=tc_data["id"],
                    project_id=user_story.project_id,
                    title=tc_data.get("title", "Untitled Test Case"),
                    description=tc_data.get("description", ""),
                    user_story_id=tc_data.get("user_story_id", user_story_id),
                    test_type=test_type,
                    priority=priority,
                    status=status,
                    gherkin_file_path=gherkin_file_path,
                    created_date=datetime.now()
                )

                self.db.add(db_test_case)
                created_test_cases.append(db_test_case)
                print(f"   ✅ Test case {tc_data['id']} added to session")

            except Exception as e:
                print(f"   ❌ ERROR processing test case {i}: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
                raise ValueError(f"Error creating test case {i}: {str(e)}")

        print(f"\n💾 Committing {len(created_test_cases)} test cases to database...")
        self.db.commit()
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

    def get_test_case_by_id(self, test_id: str) -> Dict[str, Any]:
        """
        Get specific test case by ID

        Args:
            test_id: Test case ID

        Returns:
            Test case dictionary

        Raises:
            ValueError: If test case not found
        """
        tc = self.db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
        if not tc:
            raise ValueError("Test case not found")

        return self._test_case_to_dict(tc)

    def update_test_case(self, test_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update existing test case

        Args:
            test_id: Test case ID to update
            updates: Dictionary with fields to update

        Returns:
            Updated test case dictionary

        Raises:
            ValueError: If test case not found
        """
        tc = self.db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
        if not tc:
            raise ValueError("Test case not found")

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
                        value = self._parse_enum_safe(value, TestType, TestType.FUNCTIONAL)
                    elif field == "priority":
                        value = self._parse_enum_safe(value, TestPriority, TestPriority.MEDIUM)
                    elif field == "status":
                        value = self._parse_enum_safe(value, TestStatus, TestStatus.NOT_RUN)
                setattr(tc, field, value)

        self.db.commit()
        self.db.refresh(tc)

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

    def delete_test_cases_batch(self, test_case_ids: List[str]) -> Dict[str, Any]:
        """
        Delete multiple test cases at once

        Args:
            test_case_ids: List of test case IDs to delete

        Returns:
            Dictionary with deletion results
        """
        if not test_case_ids:
            raise ValueError("No test case IDs provided")

        deleted_count = 0
        deleted_ids = []
        errors = []

        for test_id in test_case_ids:
            try:
                tc = self.db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
                if tc:
                    # Delete associated Gherkin file if exists
                    if tc.gherkin_file_path and os.path.exists(tc.gherkin_file_path):
                        try:
                            os.remove(tc.gherkin_file_path)
                        except Exception as e:
                            print(f"Warning: Could not delete Gherkin file {tc.gherkin_file_path}: {e}")

                    self.db.delete(tc)
                    deleted_count += 1
                    deleted_ids.append(test_id)
                else:
                    errors.append(f"Test case {test_id} not found")
            except Exception as e:
                errors.append(f"Error deleting {test_id}: {str(e)}")

        self.db.commit()

        return {
            "message": f"Deleted {deleted_count} test case(s) successfully",
            "deleted_count": deleted_count,
            "deleted_ids": deleted_ids,
            "errors": errors if errors else None
        }

    def delete_test_case(self, test_id: str) -> bool:
        """
        Delete single test case

        Args:
            test_id: Test case ID to delete

        Returns:
            True if deleted, False if not found
        """
        tc = self.db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
        if not tc:
            return False

        # Delete associated Gherkin file if exists
        if tc.gherkin_file_path and os.path.exists(tc.gherkin_file_path):
            try:
                os.remove(tc.gherkin_file_path)
            except Exception as e:
                print(f"Warning: Could not delete Gherkin file: {e}")

        self.db.delete(tc)
        self.db.commit()

        return True

    def get_gherkin_content(self, test_id: str) -> Dict[str, Any]:
        """
        Get Gherkin file content for a test case

        Args:
            test_id: Test case ID

        Returns:
            Dictionary with Gherkin content

        Raises:
            ValueError: If test case or file not found
        """
        tc = self.db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
        if not tc:
            raise ValueError("Test case not found")

        if not tc.gherkin_file_path or not os.path.exists(tc.gherkin_file_path):
            raise ValueError("Gherkin file not found")

        with open(tc.gherkin_file_path, 'r') as f:
            content = f.read()

        return {
            "test_case_id": test_id,
            "file_path": tc.gherkin_file_path,
            "gherkin_content": content
        }

    def update_gherkin_content(self, test_id: str, gherkin_content: str) -> Dict[str, Any]:
        """
        Update Gherkin file content for a test case

        Args:
            test_id: Test case ID
            gherkin_content: New Gherkin content

        Returns:
            Dictionary with success message

        Raises:
            ValueError: If test case not found
        """
        tc = self.db.query(TestCaseDB).filter(TestCaseDB.id == test_id).first()
        if not tc:
            raise ValueError("Test case not found")

        # Create file if doesn't exist
        if not tc.gherkin_file_path:
            settings.ensure_directories()
            tc.gherkin_file_path = f"{settings.output_dir}/{test_id}.feature"

        # Write content to file
        with open(tc.gherkin_file_path, 'w') as f:
            f.write(gherkin_content)

        self.db.commit()

        return {
            "message": "Gherkin content updated successfully",
            "file_path": tc.gherkin_file_path
        }

    # ========== Private Helper Methods ==========

    def _parse_user_story(self, story_db: UserStoryDB) -> UserStory:
        """Parse UserStoryDB to UserStory model with acceptance criteria"""
        acceptance_criteria = []
        if story_db.acceptance_criteria:
            try:
                criteria_data = json.loads(story_db.acceptance_criteria)
                acceptance_criteria = [AcceptanceCriteria(**ac) for ac in criteria_data]
            except Exception as e:
                print(f"Warning: Failed to parse acceptance criteria for {story_db.id}: {e}")

        return UserStory(
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

    def _parse_enum_safe(self, value: str, enum_class, default):
        """Parse enum value safely with fallback to default"""
        try:
            return enum_class[value]
        except KeyError:
            print(f"   ⚠️ {enum_class.__name__} KeyError for '{value}', using fallback")
            return next((e for e in enum_class if e.name == value), default)

    def _test_case_to_dict(self, tc: TestCaseDB) -> Dict[str, Any]:
        """Convert TestCaseDB to dictionary"""
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

    def _build_gherkin_from_scenarios(
        self,
        title: str,
        user_story: UserStory,
        test_type: str,
        scenarios: List[Any]
    ) -> str:
        """Build Gherkin content from AI-generated scenarios"""
        gherkin_lines = [
            f"Feature: {title}",
            f"  {user_story.description[:200]}..." if len(user_story.description) > 200 else f"  {user_story.description}",
            "",
            f"  User Story: {user_story.id}",
            f"  Test Type: {test_type}",
            "",
        ]

        for scenario in scenarios:
            gherkin_lines.append(scenario.to_gherkin())
            gherkin_lines.append("")

        return "\n".join(gherkin_lines)

    def _build_fallback_gherkin(
        self,
        title: str,
        user_story: UserStory,
        test_type: str,
        scenarios_per_test: int
    ) -> str:
        """Build fallback Gherkin content without AI"""
        gherkin_lines = [
            f"Feature: {title}",
            f"  {user_story.description}",
            "",
            f"  Historia de Usuario: {user_story.id}",
            f"  Tipo de Prueba: {test_type}",
            f"  Nota: Generación con IA no disponible - usando escenarios de plantilla",
            "",
        ]

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

        return "\n".join(gherkin_lines)


def get_test_case_service(db: Session, gemini_client: Optional[GeminiClient] = None) -> TestCaseService:
    """Dependency injection helper for FastAPI"""
    return TestCaseService(db, gemini_client)

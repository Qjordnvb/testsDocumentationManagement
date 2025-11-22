"""
Celery tasks for background processing
"""
from celery import Task
from backend.celery_app import celery_app
from backend.database.db import SessionLocal
from backend.database.models import UserStoryDB
from backend.models import UserStory, AcceptanceCriteria, TestType, TestPriority, TestStatus
from backend.integrations.gemini_client import GeminiClient
from backend.config import Settings
import json
from typing import List, Dict
from datetime import datetime
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Load settings
settings = Settings()


class DatabaseTask(Task):
    """Base task with database session"""
    _db = None

    @property
    def db(self):
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(bind=True, base=DatabaseTask)
def generate_test_cases_task(
    self,
    story_id: str,
    num_test_cases: int = 5,
    scenarios_per_test: int = 3,
    test_types: List[str] = None,
    use_ai: bool = True
):
    """
    Background task to generate test cases with AI

    Args:
        self: Celery task instance (bound)
        story_id: User story ID
        num_test_cases: Number of test cases to generate
        scenarios_per_test: Scenarios per test case
        test_types: List of test types (e.g., ["FUNCTIONAL", "UI"])
        use_ai: Whether to use AI for generation

    Returns:
        dict: Result with status and suggested test cases
    """
    if test_types is None:
        test_types = ["FUNCTIONAL", "UI"]

    try:
        # Update progress: Starting
        self.update_state(state='PROGRESS', meta={'progress': 5, 'status': 'Starting...'})

        # Get user story from database
        story_db = self.db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
        if not story_db:
            return {
                'status': 'failed',
                'error': f'User story {story_id} not found'
            }

        # Validate project_id
        if not story_db.project_id:
            return {
                'status': 'failed',
                'error': f'User story {story_id} is not associated with a project'
            }

        # Update progress: Loading story
        self.update_state(state='PROGRESS', meta={'progress': 10, 'status': 'Loading user story...'})

        # Parse acceptance criteria
        acceptance_criteria = []
        if story_db.acceptance_criteria:
            try:
                criteria_data = json.loads(story_db.acceptance_criteria)
                acceptance_criteria = [AcceptanceCriteria(**ac) for ac in criteria_data]
            except Exception as e:
                print(f"Warning: Failed to parse acceptance criteria: {e}")

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

        # Update progress: Initializing AI
        self.update_state(state='PROGRESS', meta={'progress': 20, 'status': 'Initializing AI...'})

        # Initialize Gemini client
        gemini_client = GeminiClient(api_key=settings.gemini_api_key)

        # Calculate total scenarios needed
        total_scenarios_needed = scenarios_per_test * num_test_cases

        # Update progress: Generating scenarios
        self.update_state(state='PROGRESS', meta={
            'progress': 30,
            'status': f'Generating {total_scenarios_needed} scenarios with AI...'
        })

        # Generate Gherkin scenarios with AI (PARALLEL BATCHES)
        gherkin_scenarios = []
        if use_ai:
            try:
                # Use async parallelization
                gherkin_scenarios = asyncio.run(
                    generate_scenarios_parallel(
                        gemini_client,
                        user_story,
                        total_scenarios_needed,
                        batch_size=15,
                        task_instance=self  # Pass task for progress updates
                    )
                )
            except Exception as e:
                print(f"❌ AI generation failed: {e}")
                use_ai = False

        # Update progress: Building test cases
        self.update_state(state='PROGRESS', meta={
            'progress': 70,
            'status': 'Building test cases...'
        })

        # Distribute scenarios across test cases
        scenarios_per_tc = len(gherkin_scenarios) // num_test_cases if gherkin_scenarios else scenarios_per_test

        suggested_test_cases = []

        for i in range(num_test_cases):
            # Determine test type
            test_type = test_types[i % len(test_types)] if test_types else "FUNCTIONAL"

            # Generate title based on test type
            type_prefix = {
                "FUNCTIONAL": "Verify functional behavior",
                "UI": "Verify UI/UX behavior",
                "API": "Verify API behavior",
                "INTEGRATION": "Verify integration",
                "SECURITY": "Verify security",
            }.get(test_type, "Verify")

            title = f"{type_prefix} - {user_story.title} ({i+1})"

            # Get scenarios for this test case
            start_idx = i * scenarios_per_tc
            end_idx = start_idx + scenarios_per_tc
            test_scenarios = gherkin_scenarios[start_idx:end_idx] if gherkin_scenarios else []

            # Build Gherkin content
            gherkin_content = f"Feature: {user_story.title}\n\n"
            gherkin_content += f"  Background:\n"
            gherkin_content += f"    Given the system is properly configured\n"
            gherkin_content += f"    And the user has necessary permissions\n\n"

            for scenario in test_scenarios:
                gherkin_content += f"  Scenario: {scenario.scenario_name}\n"
                for step in scenario.given_steps:
                    gherkin_content += f"    Given {step}\n"
                for step in scenario.when_steps:
                    gherkin_content += f"    When {step}\n"
                for step in scenario.then_steps:
                    gherkin_content += f"    Then {step}\n"
                gherkin_content += "\n"

            # Build suggested test case
            suggested_test_case = {
                "suggested_id": f"TC-temp-{story_id}-{i+1}",
                "title": title,
                "description": f"Test case for {user_story.title}",
                "test_type": test_type,
                "priority": "HIGH" if user_story.priority in ["Critical", "High"] else "MEDIUM",
                "status": "NOT_RUN",
                "scenarios_count": len(test_scenarios),
                "gherkin_content": gherkin_content,
                "can_edit": True,
                "can_delete": True
            }

            suggested_test_cases.append(suggested_test_case)

        # Update progress: Complete
        self.update_state(state='PROGRESS', meta={
            'progress': 90,
            'status': 'Finalizing...'
        })

        # Return result
        return {
            'status': 'completed',
            'story_id': story_id,
            'story_title': user_story.title,
            'suggested_test_cases': suggested_test_cases,
            'total_suggested': len(suggested_test_cases),
            'generated_at': datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Task error: {e}")
        import traceback
        traceback.print_exc()

        return {
            'status': 'failed',
            'error': str(e),
            'traceback': traceback.format_exc()
        }


async def generate_scenarios_parallel(
    gemini_client: GeminiClient,
    user_story: UserStory,
    num_scenarios: int,
    batch_size: int = 15,
    task_instance=None
) -> List:
    """
    Generate Gherkin scenarios in PARALLEL batches using asyncio

    Args:
        gemini_client: GeminiClient instance
        user_story: UserStory object
        num_scenarios: Total scenarios to generate
        batch_size: Scenarios per batch
        task_instance: Optional Celery task instance for progress updates

    Returns:
        List of GherkinScenario objects
    """
    from backend.models import GherkinScenario

    # If request is small, use single call
    if num_scenarios <= batch_size:
        scenarios = await asyncio.get_event_loop().run_in_executor(
            ThreadPoolExecutor(),
            gemini_client._generate_batch,
            user_story,
            num_scenarios
        )
        return scenarios

    # Calculate batches
    num_batches = (num_scenarios + batch_size - 1) // batch_size

    print(f"📦 Generating {num_scenarios} scenarios in {num_batches} PARALLEL batches...")

    # Create tasks for parallel execution
    tasks = []
    for batch_num in range(num_batches):
        batch_start = batch_num * batch_size
        batch_end = min(batch_start + batch_size, num_scenarios)
        batch_count = batch_end - batch_start

        # Create async task
        task = asyncio.create_task(
            generate_batch_async(
                gemini_client,
                user_story,
                batch_count,
                batch_num + 1,
                num_batches
            )
        )
        tasks.append(task)

    # Update progress if task instance provided
    if task_instance:
        task_instance.update_state(state='PROGRESS', meta={
            'progress': 40,
            'status': f'Generating {num_batches} batches in parallel...'
        })

    # Wait for ALL batches to complete IN PARALLEL
    batch_results = await asyncio.gather(*tasks, return_exceptions=True)

    # Flatten results
    all_scenarios = []
    for i, result in enumerate(batch_results):
        if isinstance(result, Exception):
            print(f"❌ Batch {i+1} error: {result}")
        else:
            all_scenarios.extend(result)

            # Update progress
            if task_instance:
                progress = 40 + int((i + 1) / len(batch_results) * 30)  # 40-70%
                task_instance.update_state(state='PROGRESS', meta={
                    'progress': progress,
                    'status': f'Completed {i+1}/{num_batches} batches...'
                })

    print(f"✅ Generated {len(all_scenarios)}/{num_scenarios} scenarios in parallel")
    return all_scenarios


async def generate_batch_async(
    gemini_client: GeminiClient,
    user_story: UserStory,
    num_scenarios: int,
    batch_num: int,
    total_batches: int
):
    """Async wrapper for _generate_batch"""
    print(f"   🚀 Batch {batch_num}/{total_batches}: Starting {num_scenarios} scenarios...")

    # Run sync Gemini API call in thread pool
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        scenarios = await loop.run_in_executor(
            pool,
            gemini_client._generate_batch,
            user_story,
            num_scenarios
        )

    print(f"   ✅ Batch {batch_num}/{total_batches}: Got {len(scenarios)} scenarios")
    return scenarios

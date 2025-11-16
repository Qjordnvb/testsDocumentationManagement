"""
Gherkin feature file generator
"""
from typing import List, Optional
from pathlib import Path
from datetime import datetime

from backend.models import UserStory, TestCase, GherkinScenario
from backend.integrations import GeminiClient


class GherkinGenerator:
    """Generator for Gherkin .feature files"""

    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        """
        Initialize generator

        Args:
            gemini_client: Optional GeminiClient for AI-powered scenario generation
        """
        self.gemini_client = gemini_client

    def generate_from_user_story(
        self,
        user_story: UserStory,
        output_dir: str,
        use_ai: bool = True,
        num_scenarios: int = 3,
    ) -> str:
        """
        Generate Gherkin feature file from user story

        Args:
            user_story: UserStory object
            output_dir: Directory to save the feature file
            use_ai: Whether to use AI for scenario generation
            num_scenarios: Number of scenarios to generate (if using AI)

        Returns:
            Path to generated feature file
        """
        # Generate scenarios
        if use_ai and self.gemini_client:
            scenarios = self.gemini_client.generate_gherkin_scenarios(
                user_story, num_scenarios
            )
        else:
            scenarios = self._generate_basic_scenarios(user_story)

        # Create feature file content
        feature_content = self._build_feature_file(user_story, scenarios)

        # Save to file
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        filename = self._sanitize_filename(f"{user_story.id}_{user_story.title}.feature")
        file_path = output_path / filename

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(feature_content)

        return str(file_path)

    def generate_from_test_cases(
        self, test_cases: List[TestCase], output_dir: str, feature_name: str
    ) -> str:
        """
        Generate Gherkin feature file from existing test cases

        Args:
            test_cases: List of TestCase objects
            output_dir: Directory to save the feature file
            feature_name: Name of the feature

        Returns:
            Path to generated feature file
        """
        scenarios = []
        for test_case in test_cases:
            scenarios.extend(test_case.gherkin_scenarios)

        # Build feature file
        lines = [
            f"Feature: {feature_name}",
            f"  Automated test scenarios for {feature_name}",
            f"  Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "",
        ]

        for scenario in scenarios:
            lines.append(scenario.to_gherkin())
            lines.append("")  # Empty line between scenarios

        feature_content = "\n".join(lines)

        # Save to file
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        filename = self._sanitize_filename(f"{feature_name}.feature")
        file_path = output_path / filename

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(feature_content)

        return str(file_path)

    def _build_feature_file(
        self, user_story: UserStory, scenarios: List[GherkinScenario]
    ) -> str:
        """Build complete feature file content"""
        lines = [
            f"Feature: {user_story.title}",
            f"  {user_story.description}",
            "",
            f"  User Story: {user_story.id}",
        ]

        if user_story.priority:
            lines.append(f"  Priority: {user_story.priority.value}")

        lines.extend([
            "",
            "  Acceptance Criteria:",
        ])

        for criteria in user_story.acceptance_criteria:
            lines.append(f"  - {criteria.description}")

        lines.append("")
        lines.append(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        lines.append("")

        # Add scenarios
        for scenario in scenarios:
            lines.append(scenario.to_gherkin())
            lines.append("")  # Empty line between scenarios

        return "\n".join(lines)

    def _generate_basic_scenarios(self, user_story: UserStory) -> List[GherkinScenario]:
        """Generate basic scenarios without AI (fallback)"""
        scenarios = []

        # Generate one happy path scenario from acceptance criteria
        if user_story.acceptance_criteria:
            given_steps = ["the system is ready"]
            when_steps = []
            then_steps = []

            for criteria in user_story.acceptance_criteria:
                # Simple heuristic: if criteria mentions action, it's a when, otherwise then
                if any(
                    word in criteria.description.lower()
                    for word in ["enter", "click", "submit", "select", "input"]
                ):
                    when_steps.append(criteria.description)
                else:
                    then_steps.append(criteria.description)

            if when_steps or then_steps:
                scenario = GherkinScenario(
                    scenario_name=f"Verify {user_story.title}",
                    given_steps=given_steps,
                    when_steps=when_steps if when_steps else ["user performs the action"],
                    then_steps=then_steps if then_steps else ["the expected result is achieved"],
                    tags=["smoke", "positive"],
                )
                scenarios.append(scenario)

        # If no scenarios generated, create a basic template
        if not scenarios:
            scenario = GherkinScenario(
                scenario_name=f"Basic test for {user_story.title}",
                given_steps=["the system is ready", "the user has necessary permissions"],
                when_steps=["the user performs the required action"],
                then_steps=["the system responds as expected", "the changes are persisted"],
                tags=["functional"],
            )
            scenarios.append(scenario)

        return scenarios

    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to be filesystem-safe"""
        # Remove or replace invalid characters
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            filename = filename.replace(char, "_")

        # Limit length
        if len(filename) > 200:
            name_part = filename[:-8]  # Remove .feature
            filename = name_part[:191] + ".feature"

        return filename

    def generate_step_definitions_template(
        self, scenarios: List[GherkinScenario], language: str = "python"
    ) -> str:
        """
        Generate template for step definitions (for automation)

        Args:
            scenarios: List of GherkinScenario objects
            language: Programming language (python, javascript, java)

        Returns:
            Step definitions template code
        """
        steps = set()

        # Collect all unique steps
        for scenario in scenarios:
            for step in scenario.given_steps:
                steps.add(("Given", step))
            for step in scenario.when_steps:
                steps.add(("When", step))
            for step in scenario.then_steps:
                steps.add(("Then", step))

        if language == "python":
            return self._generate_python_steps(steps)
        elif language == "javascript":
            return self._generate_javascript_steps(steps)
        else:
            return "# Step definitions template not available for this language"

    def _generate_python_steps(self, steps: set) -> str:
        """Generate Python step definitions (behave/pytest-bdd)"""
        lines = [
            "from behave import given, when, then",
            "from pytest_bdd import scenarios, given, when, then",
            "",
            "# Step Definitions",
            "",
        ]

        for keyword, step_text in sorted(steps):
            decorator = keyword.lower()
            func_name = step_text.replace(" ", "_").replace("'", "").replace('"', "")[:50]

            lines.extend([
                f'@{decorator}(\'{step_text}\')',
                f"def {decorator}_{func_name}(context):",
                f'    """TODO: Implement {keyword} {step_text}"""',
                "    pass",
                "",
            ])

        return "\n".join(lines)

    def _generate_javascript_steps(self, steps: set) -> str:
        """Generate JavaScript step definitions (Cucumber.js)"""
        lines = [
            "const { Given, When, Then } = require('@cucumber/cucumber');",
            "",
            "// Step Definitions",
            "",
        ]

        for keyword, step_text in sorted(steps):
            func_name = step_text.replace(" ", "_").replace("'", "").replace('"', "")[:50]

            lines.extend([
                f"{keyword}('{step_text}', async function () {{",
                f"  // TODO: Implement {keyword} {step_text}",
                "});",
                "",
            ])

        return "\n".join(lines)

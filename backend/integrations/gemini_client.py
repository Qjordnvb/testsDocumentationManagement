"""
Google Gemini AI client for generating test scenarios and improving documentation
"""
import google.generativeai as genai
from typing import List, Optional, Dict
import json

from backend.models import UserStory, GherkinScenario, TestType


class GeminiClient:
    """Client for interacting with Google Gemini API"""

    def __init__(self, api_key: str):
        """Initialize Gemini client with API key"""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def generate_gherkin_scenarios(
        self, user_story: UserStory, num_scenarios: int = 3
    ) -> List[GherkinScenario]:
        """
        Generate Gherkin scenarios from a user story using AI

        Args:
            user_story: UserStory object
            num_scenarios: Number of scenarios to generate

        Returns:
            List of GherkinScenario objects
        """
        prompt = self._build_gherkin_prompt(user_story, num_scenarios)

        try:
            response = self.model.generate_content(prompt)
            scenarios = self._parse_gherkin_response(response.text)
            return scenarios
        except Exception as e:
            print(f"Error generating Gherkin scenarios: {e}")
            return []

    def _build_gherkin_prompt(self, user_story: UserStory, num_scenarios: int) -> str:
        """Build prompt for Gherkin scenario generation"""

        criteria_text = user_story.get_criteria_text()

        prompt = f"""You are an expert QA engineer specializing in BDD (Behavior-Driven Development) and Gherkin syntax.

Generate {num_scenarios} comprehensive Gherkin test scenarios for the following user story:

**User Story ID:** {user_story.id}
**Title:** {user_story.title}
**Description:** {user_story.description}

**Acceptance Criteria:**
{criteria_text}

**CRITICAL REQUIREMENTS:**
1. **READ THE ACCEPTANCE CRITERIA CAREFULLY** - Each criterion contains specific validation rules, field names, and requirements
2. Generate {num_scenarios} different scenarios that DIRECTLY test the acceptance criteria above:
   - At least 1 Happy Path scenario (all validations pass)
   - At least 1 Negative scenario (validation failures from the criteria)
   - At least 1 Edge Case scenario (boundary conditions from the criteria)

3. **BE EXTREMELY SPECIFIC:**
   - Use EXACT field names mentioned in the acceptance criteria
   - Use EXACT validation rules (e.g., if criteria says "DNI must be 8 digits", test with 7 digits for negative case)
   - Use EXACT data formats specified (dates, phone numbers, email patterns, age ranges, etc.)
   - Include specific error messages mentioned in the criteria

4. Use proper Gherkin syntax (Given, When, Then, And)
5. Include appropriate tags based on scenario type:
   - @smoke @regression @positive @happy_path (for successful flows)
   - @regression @negative @validation @error_handling (for error cases)
   - @regression @edge_case (for boundary testing)

6. Each scenario must be:
   - Directly traceable to one or more acceptance criteria
   - Realistic and executable by a QA tester
   - Specific enough that a developer could automate it

**Examples of GOOD vs BAD scenarios:**
❌ BAD (too generic): "When I enter valid data"
✅ GOOD (specific): "When I enter '12345678' into the 'DNI' field"

❌ BAD (vague): "Then I should see an error"
✅ GOOD (exact): "Then I should see an error message 'El DNI debe tener 8 dígitos' next to the 'DNI' field"

**Output Format:**
Return a JSON array with this exact structure (return ONLY valid JSON, no markdown, no extra text):
[
  {{
    "scenario_name": "Descriptive scenario name that references what is being tested (Happy Path)",
    "tags": ["smoke", "positive"],
    "given_steps": ["I am on the [exact page name from criteria]", "additional preconditions"],
    "when_steps": ["I enter '[specific test data]' into the '[exact field name]' field", "more specific actions"],
    "then_steps": ["I should see [exact expected result from criteria]", "additional verifications"]
  }}
]

Generate the scenarios now (return ONLY the JSON array, no additional text):"""

        return prompt

    def _parse_gherkin_response(self, response_text: str) -> List[GherkinScenario]:
        """Parse Gemini response into GherkinScenario objects"""
        try:
            # Extract JSON from response (handle markdown code blocks)
            json_text = response_text.strip()
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0].strip()
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0].strip()

            # Parse JSON
            scenarios_data = json.loads(json_text)

            # Convert to GherkinScenario objects
            scenarios = []
            for scenario_data in scenarios_data:
                scenario = GherkinScenario(
                    scenario_name=scenario_data["scenario_name"],
                    given_steps=scenario_data["given_steps"],
                    when_steps=scenario_data["when_steps"],
                    then_steps=scenario_data["then_steps"],
                    tags=scenario_data.get("tags", []),
                )
                scenarios.append(scenario)

            return scenarios

        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON response: {e}")
            print(f"Response text: {response_text}")
            return []
        except Exception as e:
            print(f"Error parsing Gherkin response: {e}")
            return []

    def suggest_test_types(self, user_story: UserStory) -> List[TestType]:
        """
        Suggest appropriate test types for a user story

        Args:
            user_story: UserStory object

        Returns:
            List of recommended TestType values
        """
        prompt = f"""Analyze this user story and suggest which types of testing are most appropriate:

**User Story:** {user_story.title}
**Description:** {user_story.description}

Available test types:
- Functional: Testing specific functionality
- Integration: Testing interaction between components
- UI: Testing user interface
- API: Testing backend APIs
- Regression: Ensuring existing features still work
- Smoke: Basic critical functionality
- E2E: Complete user workflows
- Performance: Speed and scalability
- Security: Security vulnerabilities
- Accessibility: Accessibility compliance

Return ONLY a JSON array of recommended test types based on the story, e.g.:
["Functional", "UI", "Smoke"]

Return the JSON array now:"""

        try:
            response = self.model.generate_content(prompt)
            test_types_text = response.text.strip()

            # Extract JSON
            if "```json" in test_types_text:
                test_types_text = test_types_text.split("```json")[1].split("```")[0].strip()
            elif "```" in test_types_text:
                test_types_text = test_types_text.split("```")[1].split("```")[0].strip()

            test_types_list = json.loads(test_types_text)
            return [TestType(t) for t in test_types_list if t in TestType.__members__.values()]

        except Exception as e:
            print(f"Error suggesting test types: {e}")
            # Default recommendations
            return [TestType.FUNCTIONAL, TestType.SMOKE]

    def generate_test_data(
        self, user_story: UserStory, scenario: GherkinScenario
    ) -> Dict[str, List[str]]:
        """
        Generate test data suggestions for a scenario

        Args:
            user_story: UserStory object
            scenario: GherkinScenario object

        Returns:
            Dictionary with test data suggestions
        """
        prompt = f"""Generate realistic test data for this test scenario:

**User Story:** {user_story.title}
**Scenario:** {scenario.scenario_name}

**Steps:**
Given: {', '.join(scenario.given_steps)}
When: {', '.join(scenario.when_steps)}
Then: {', '.join(scenario.then_steps)}

Generate test data examples including:
- Valid input data (positive cases)
- Invalid input data (negative cases)
- Edge cases

Return ONLY a JSON object with this structure:
{{
  "valid_data": ["example1", "example2"],
  "invalid_data": ["example1", "example2"],
  "edge_cases": ["example1", "example2"]
}}

Generate the test data now:"""

        try:
            response = self.model.generate_content(prompt)
            data_text = response.text.strip()

            # Extract JSON
            if "```json" in data_text:
                data_text = data_text.split("```json")[1].split("```")[0].strip()
            elif "```" in data_text:
                data_text = data_text.split("```")[1].split("```")[0].strip()

            return json.loads(data_text)

        except Exception as e:
            print(f"Error generating test data: {e}")
            return {"valid_data": [], "invalid_data": [], "edge_cases": []}

    def improve_acceptance_criteria(self, user_story: UserStory) -> List[str]:
        """
        Analyze and suggest improvements to acceptance criteria

        Args:
            user_story: UserStory object

        Returns:
            List of improved/additional acceptance criteria
        """
        criteria_text = user_story.get_criteria_text()

        prompt = f"""Review and improve the acceptance criteria for this user story:

**User Story:** {user_story.title}
**Description:** {user_story.description}

**Current Acceptance Criteria:**
{criteria_text}

Analyze the criteria and:
1. Identify any gaps or missing scenarios
2. Suggest more specific and testable criteria
3. Add edge cases that should be considered
4. Ensure criteria follow SMART principles (Specific, Measurable, Achievable, Relevant, Testable)

Return ONLY a JSON array of improved/additional acceptance criteria:
["criterion 1", "criterion 2", "criterion 3"]

Generate the improved criteria now:"""

        try:
            response = self.model.generate_content(prompt)
            criteria_text = response.text.strip()

            # Extract JSON
            if "```json" in criteria_text:
                criteria_text = criteria_text.split("```json")[1].split("```")[0].strip()
            elif "```" in criteria_text:
                criteria_text = criteria_text.split("```")[1].split("```")[0].strip()

            return json.loads(criteria_text)

        except Exception as e:
            print(f"Error improving acceptance criteria: {e}")
            return []

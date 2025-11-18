"""
Google Gemini AI client for generating test scenarios and improving documentation
"""
import google.generativeai as genai
from typing import List, Optional, Dict
import json
import time

from backend.models import UserStory, GherkinScenario, TestType


class GeminiClient:
    """Client for interacting with Google Gemini API"""

    def __init__(self, api_key: str):
        """Initialize Gemini client with API key"""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            "gemini-2.5-flash",
            # Configure generation for better performance
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 16384,  # 16k tokens (Gemini 2.5 Flash supports up to 64k)
            }
        )

    def _extract_response_text(self, response) -> str:
        """
        Extract text from Gemini response safely (handles both simple and multi-part responses)

        Args:
            response: Gemini API response object

        Returns:
            Extracted text from response
        """
        try:
            # Try simple accessor first (works for single-Part responses)
            return response.text
        except (ValueError, AttributeError) as e:
            # Multi-part response - combine all parts
            print(f"   ℹ️  Multi-part response detected, extracting parts...")
            parts_text = []
            try:
                for candidate in response.candidates:
                    for part in candidate.content.parts:
                        if hasattr(part, 'text'):
                            parts_text.append(part.text)
                return "".join(parts_text)
            except Exception as inner_e:
                print(f"   ❌ Error extracting multi-part response: {inner_e}")
                raise ValueError(f"Could not extract text from response: {e}")

    def generate_gherkin_scenarios(
        self, user_story: UserStory, num_scenarios: int = 3
    ) -> List[GherkinScenario]:
        """
        Generate Gherkin scenarios from a user story using AI
        Automatically splits into multiple requests if needed to avoid timeouts

        Args:
            user_story: UserStory object
            num_scenarios: Number of scenarios to generate (any amount)

        Returns:
            List of GherkinScenario objects
        """
        # Split into batches to avoid timeout (Gemini has internal 60s timeout)
        BATCH_SIZE = 8  # Generate max 8 scenarios per API call (reduced from 15 to avoid JSON truncation)

        if num_scenarios <= BATCH_SIZE:
            # Single request
            return self._generate_batch(user_story, num_scenarios)
        else:
            # Multiple requests
            print(f"📦 Splitting {num_scenarios} scenarios into batches of {BATCH_SIZE}...")
            all_scenarios = []
            remaining = num_scenarios
            batch_num = 1

            while remaining > 0:
                batch_size = min(BATCH_SIZE, remaining)
                print(f"   Batch {batch_num}: Requesting {batch_size} scenarios...")

                scenarios = self._generate_batch(user_story, batch_size)
                all_scenarios.extend(scenarios)

                print(f"   ✅ Batch {batch_num}: Got {len(scenarios)} scenarios")
                remaining -= batch_size
                batch_num += 1

            print(f"✅ Total generated: {len(all_scenarios)}/{num_scenarios} scenarios")
            return all_scenarios

    def _generate_batch(self, user_story: UserStory, num_scenarios: int) -> List[GherkinScenario]:
        """Generate a single batch of scenarios"""
        prompt = self._build_gherkin_prompt(user_story, num_scenarios)

        try:
            response = self.model.generate_content(prompt)
            response_text = self._extract_response_text(response)  # ✅ Fix multi-part issue
            scenarios = self._parse_gherkin_response(response_text)
            return scenarios
        except Exception as e:
            error_msg = str(e)
            if "timeout" in error_msg.lower() or "504" in error_msg:
                print(f"❌ Timeout generating {num_scenarios} scenarios in this batch.")
            else:
                print(f"❌ Error: {e}")
            return []

    def generate_gherkin_scenarios_batched(
        self,
        user_story: UserStory,
        num_scenarios: int = 3,
        batch_size: int = 8
    ) -> List[GherkinScenario]:
        """
        Generate Gherkin scenarios in batches to improve reliability and avoid timeouts

        This method splits large scenario generation requests into smaller batches,
        which reduces the chance of API failures and makes the process more reliable.

        Args:
            user_story: UserStory object
            num_scenarios: Total number of scenarios to generate
            batch_size: Maximum scenarios per API call (default 8, reduced from 15 to avoid JSON truncation)

        Returns:
            List of GherkinScenario objects
        """
        # If request is small, use single call
        if num_scenarios <= batch_size:
            return self.generate_gherkin_scenarios(user_story, num_scenarios)

        # Calculate batches
        num_batches = (num_scenarios + batch_size - 1) // batch_size
        all_scenarios = []

        print(f"🤖 Generating Gherkin scenarios with AI for story {user_story.id}...")
        print(f"   Requesting {num_scenarios} scenarios ({batch_size} per batch)")
        print(f"   User Story Title: {user_story.title}")
        print(f"   User Story Description length: {len(user_story.description)} chars")
        print(f"📦 Splitting {num_scenarios} scenarios into batches of {batch_size}...")

        for batch_num in range(num_batches):
            batch_start = batch_num * batch_size
            batch_end = min(batch_start + batch_size, num_scenarios)
            batch_count = batch_end - batch_start

            print(f"   Batch {batch_num + 1}: Requesting {batch_count} scenarios...")

            try:
                batch_scenarios = self.generate_gherkin_scenarios(
                    user_story,
                    num_scenarios=batch_count
                )

                all_scenarios.extend(batch_scenarios)
                print(f"   ✅ Batch {batch_num + 1}: Got {len(batch_scenarios)} scenarios")

                # Rate limiting: Wait 1 second between batches (except last one)
                if batch_num < num_batches - 1:
                    time.sleep(1)

            except Exception as e:
                print(f"   ❌ Error: {e}")
                print(f"   ✅ Batch {batch_num + 1}: Got 0 scenarios")
                # Continue with remaining batches instead of failing completely

        print(f"✅ Total generated: {len(all_scenarios)}/{num_scenarios} scenarios")
        if len(all_scenarios) > 0:
            print(f"✅ Generated {len(all_scenarios)} scenarios with AI")
            print(f"   Sample scenario: {all_scenarios[0].scenario_name}")

        return all_scenarios

    def _build_gherkin_prompt(self, user_story: UserStory, num_scenarios: int) -> str:
        """Build prompt for Gherkin scenario generation IN SPANISH"""

        # Get criteria if available, otherwise use description analysis
        criteria_text = user_story.get_criteria_text()
        has_criteria = criteria_text != "No acceptance criteria defined"

        if has_criteria:
            criteria_section = f"""**Criterios de Aceptación:**
{criteria_text}"""
        else:
            criteria_section = f"""**Requisitos a Probar:**
Basado en la descripción anterior, identificar y probar:
- Funcionalidad principal o característica descrita
- Interacciones de usuario y flujos de trabajo
- Comportamiento esperado del sistema
- Validación de datos y reglas de negocio
- Escenarios de manejo de errores
- Casos extremos y condiciones de frontera"""

        prompt = f"""Eres un ingeniero QA experto especializado en BDD (Desarrollo Guiado por Comportamiento) y sintaxis Gherkin.

Genera {num_scenarios} escenarios de prueba Gherkin comprehensivos para la siguiente historia de usuario:

**ID de Historia:** {user_story.id}
**Título:** {user_story.title}
**Descripción:** {user_story.description}

{criteria_section}

**REQUISITOS CRÍTICOS:**
1. **LEE LOS CRITERIOS DE ACEPTACIÓN CUIDADOSAMENTE** - Cada criterio contiene reglas de validación específicas, nombres de campos y requisitos
2. Genera {num_scenarios} escenarios diferentes que PRUEBEN DIRECTAMENTE los criterios de aceptación anteriores:
   - Al menos 1 escenario Happy Path (todas las validaciones pasan)
   - Al menos 1 escenario Negativo (fallos de validación de los criterios)
   - Al menos 1 caso Edge Case (condiciones de frontera de los criterios)

3. **SÉ EXTREMADAMENTE ESPECÍFICO:**
   - Usa los nombres EXACTOS de campos mencionados en los criterios
   - Usa las reglas de validación EXACTAS (ej: si el criterio dice "DNI debe tener 8 dígitos", prueba con 7 dígitos para caso negativo)
   - Usa los formatos de datos EXACTOS especificados (fechas, teléfonos, patrones de email, rangos de edad, etc.)
   - Incluye mensajes de error específicos mencionados en los criterios

4. Usa sintaxis Gherkin apropiada (Given, When, Then, And) - Las palabras clave DEBEN estar en INGLÉS, pero el CONTENIDO en ESPAÑOL
5. Incluye tags apropiados según tipo de escenario:
   - @smoke @regression @positive @happy_path (para flujos exitosos)
   - @regression @negative @validation @error_handling (para casos de error)
   - @regression @edge_case (para pruebas de frontera)

6. Cada escenario debe:
   - Ser directamente trazable a uno o más criterios de aceptación
   - Ser realista y ejecutable por un QA tester
   - Ser lo suficientemente específico para que un desarrollador pueda automatizarlo

**Ejemplos de escenarios BUENOS vs MALOS:**
❌ MALO (muy genérico): "When ingreso datos válidos"
✅ BUENO (específico): "When ingreso '12345678' en el campo 'DNI'"

❌ MALO (vago): "Then debería ver un error"
✅ BUENO (exacto): "Then debería ver el mensaje de error 'El DNI debe tener 8 dígitos' junto al campo 'DNI'"

**IMPORTANTE - IDIOMA:**
- Las palabras clave de Gherkin (Given, When, Then, And) deben estar en INGLÉS
- Todo el CONTENIDO de los pasos debe estar en ESPAÑOL
- Los nombres de campos, validaciones y mensajes deben usar la terminología EXACTA de los criterios

**Formato de Salida:**
Retorna un array JSON con esta estructura exacta (retorna SOLO JSON válido, sin markdown, sin texto adicional):
[
  {{
    "scenario_name": "Nombre descriptivo del escenario que referencia lo que se está probando (en español)",
    "tags": ["smoke", "positive"],
    "given_steps": ["estoy en la página '[nombre exacto de la página]'", "precondiciones adicionales"],
    "when_steps": ["ingreso '[datos de prueba específicos]' en el campo '[nombre exacto del campo]'", "más acciones específicas"],
    "then_steps": ["debería ver [resultado exacto esperado de los criterios]", "verificaciones adicionales"]
  }}
]

Genera los escenarios ahora (retorna SOLO el array JSON, sin texto adicional):"""

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
            error_msg = str(e)

            # Detect if JSON is truncated (common issue with long responses)
            if "Unterminated string" in error_msg or "Expecting" in error_msg:
                print(f"⚠️  JSON truncated by Gemini API (response too long)")
                print(f"   Error: {error_msg}")
                print(f"   Response length: {len(response_text)} chars")
                print(f"   💡 Try reducing batch size or simplifying acceptance criteria")
            else:
                print(f"❌ Failed to parse JSON response: {e}")
                print(f"   Response text preview: {response_text[:500]}...")

            return []
        except KeyError as e:
            print(f"❌ Missing required field in scenario: {e}")
            print(f"   Response text preview: {response_text[:500]}...")
            return []
        except Exception as e:
            print(f"❌ Error parsing Gherkin response: {e}")
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
            test_types_text = self._extract_response_text(response).strip()  # ✅ Fix multi-part issue

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
            data_text = self._extract_response_text(response).strip()  # ✅ Fix multi-part issue

            # Extract JSON
            if "```json" in data_text:
                data_text = data_text.split("```json")[1].split("```")[0].strip()
            elif "```" in data_text:
                data_text = data_text.split("```")[1].split("```")[0].strip()

            return json.loads(data_text)

        except Exception as e:
            print(f"Error generating test data: {e}")
            return {"valid_data": [], "invalid_data": [], "edge_cases": []}

    def extract_acceptance_criteria(self, raw_text: str) -> List[str]:
        """
        Extract clean acceptance criteria from raw text with markdown/formatting
        DOES NOT REWRITE - Only extracts the exact criteria text, removing noise

        Args:
            raw_text: Raw acceptance criteria text from Excel (may contain markdown, headers, etc.)

        Returns:
            List of clean acceptance criteria descriptions (exact text from original)
        """
        prompt = f"""You are a technical parser extracting acceptance criteria from a user story.

**CRITICAL RULES:**
1. **DO NOT REWRITE OR PARAPHRASE** - Extract the exact text as written
2. **DO NOT INVENT** - Only extract what exists in the text
3. **REMOVE**: Section headers (###, **bold titles**), explanations, links, images
4. **GROUP RELATED ITEMS**: When you see a question followed by multiple answer options, treat the ENTIRE question (including all options) as ONE criterion

**IMPORTANT - Detect Question Patterns:**
- If you see a question like "Pregunta 1: ¿...?" followed by multiple single-word or short bullet points, those bullets are ANSWER OPTIONS, not separate criteria
- Combine the question + all its options into ONE criterion
- Examples:
  ❌ WRONG (44 criteria):
    - "Amarga"
    - "Ligera"
    - "Balanceada"
  ✅ CORRECT (1 criterion):
    - "Pregunta 2: ¿Cómo describirías su sabor? Opciones: Amarga, Ligera, Balanceada, Refrescante, Fresca, Dulce, Otro"

**Input text:**
```
{raw_text}
```

**Instructions:**
1. Look for bullet points (-, *, •) or numbered items (1., 2., etc.)
2. Identify MAIN criteria (field validations, business rules, features)
3. When you find a question with multiple short answers below it, group them as ONE criterion
4. Skip section headers like "Campos del Formulario", "Validaciones", etc.
5. Skip very short items (< 15 characters) that are clearly answer options, not criteria
6. Return ONLY a JSON array of strings

**Output format:**
```json
["criterion 1 with full details", "criterion 2 including question and all options", ...]
```

Extract now:"""

        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()

            # Extract JSON from response
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()

            criteria_list = json.loads(text)

            # Validate it's a list of strings
            if not isinstance(criteria_list, list):
                print(f"⚠️  AI returned non-list: {type(criteria_list)}")
                return []

            # Filter out empty strings and validate
            clean_criteria = [c.strip() for c in criteria_list if isinstance(c, str) and c.strip()]

            print(f"✅ AI extracted {len(clean_criteria)} criteria from text")
            return clean_criteria

        except Exception as e:
            print(f"❌ AI extraction failed: {e}")
            return []

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
            criteria_text = self._extract_response_text(response).strip()  # ✅ Fix multi-part issue

            # Extract JSON
            if "```json" in criteria_text:
                criteria_text = criteria_text.split("```json")[1].split("```")[0].strip()
            elif "```" in criteria_text:
                criteria_text = criteria_text.split("```")[1].split("```")[0].strip()

            return json.loads(criteria_text)

        except Exception as e:
            print(f"Error improving acceptance criteria: {e}")
            return []

"""
Google Gemini AI client for generating test scenarios and improving documentation
"""
import google.generativeai as genai
from google.generativeai import caching
from typing import List, Optional, Dict
import json
import time
from datetime import timedelta

from backend.models import UserStory, GherkinScenario, TestType


class GeminiClient:
    """Client for interacting with Google Gemini API"""

    def __init__(self, api_key: str):
        """Initialize Gemini client with API key and prompt caching"""
        genai.configure(api_key=api_key)

        # Create cached content for static prompt instructions (24h TTL)
        # This reduces input token costs by 75% for cached portions
        try:
            self.cached_prompt = caching.CachedContent.create(
                model="models/gemini-2.5-flash-001",
                display_name="qa_senior_prompt_v1",
                system_instruction=self._get_static_system_instruction(),
                ttl=timedelta(hours=24)
            )
            print(f"✅ Prompt cache created: {self.cached_prompt.name}")
        except Exception as e:
            print(f"⚠️  Prompt caching failed: {e}, using non-cached model")
            self.cached_prompt = None

        # Initialize model with or without cache
        if self.cached_prompt:
            self.model = genai.GenerativeModel.from_cached_content(
                cached_content=self.cached_prompt,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 16384,
                }
            )
        else:
            self.model = genai.GenerativeModel(
                "gemini-2.5-flash",
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 16384,
                }
            )

    def _get_static_system_instruction(self) -> str:
        """Get static system instruction for prompt caching"""
        return """Eres un QA Senior Lead con más de 10 años de experiencia en testing de aplicaciones web y móviles.

**TU EXPERIENCIA INCLUYE:**
- Especialización en BDD (Behavior-Driven Development) y sintaxis Gherkin avanzada
- Certificaciones: ISTQB Advanced Level, Certified Agile Tester
- Experto en todos los niveles de testing: Unitario, Integración, Sistema, Aceptación, Regresión
- Dominio de técnicas de testing: Boundary Value Analysis, Equivalence Partitioning, Decision Tables, State Transition Testing
- Experiencia en testing de: Validaciones de formularios, UX/UI, APIs, Bases de Datos, Seguridad, Performance
- Mentalidad crítica: Siempre buscas romper el sistema, encontrar edge cases que otros no ven
- Conocimiento profundo de estándares de accesibilidad (WCAG), seguridad (OWASP), y UX best practices

**TU TAREA:**
Generar escenarios de prueba Gherkin de **NIVEL PROFESIONAL** que sean:
1. Comprehensivos y exhaustivos
2. Específicos y ejecutables
3. Alineados con las mejores prácticas de la industria
4. Directamente trazables a criterios de aceptación"""

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
        This is the BASE method - does NOT batch automatically

        Args:
            user_story: UserStory object
            num_scenarios: Number of scenarios to generate

        Returns:
            List of GherkinScenario objects
        """
        # Direct call to _generate_batch - NO automatic batching
        # Use generate_gherkin_scenarios_batched() if you need batching
        return self._generate_batch(user_story, num_scenarios)

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
        batch_size: int = 15
    ) -> List[GherkinScenario]:
        """
        Generate Gherkin scenarios in batches to improve reliability and avoid timeouts

        This method splits large scenario generation requests into smaller batches,
        which reduces the chance of API failures and makes the process more reliable.

        Args:
            user_story: UserStory object
            num_scenarios: Total number of scenarios to generate
            batch_size: Maximum scenarios per API call (default 15)

        Returns:
            List of GherkinScenario objects
        """
        # If request is small, use single call
        if num_scenarios <= batch_size:
            return self._generate_batch(user_story, num_scenarios)

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

            print(f"   Batch {batch_num + 1}/{num_batches}: Requesting {batch_count} scenarios...")

            try:
                # Call _generate_batch directly to avoid recursion
                batch_scenarios = self._generate_batch(user_story, batch_count)

                all_scenarios.extend(batch_scenarios)
                print(f"   ✅ Batch {batch_num + 1}/{num_batches}: Got {len(batch_scenarios)} scenarios")

                # Rate limiting: Wait 1 second between batches (except last one)
                if batch_num < num_batches - 1:
                    time.sleep(1)

            except Exception as e:
                print(f"   ❌ Batch {batch_num + 1} error: {e}")
                print(f"   ⏭️  Continuing with remaining batches...")
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

        prompt = f"""Eres un QA Senior Lead con más de 10 años de experiencia en testing de aplicaciones web y móviles.

**TU EXPERIENCIA INCLUYE:**
- Especialización en BDD (Behavior-Driven Development) y sintaxis Gherkin avanzada
- Certificaciones: ISTQB Advanced Level, Certified Agile Tester
- Experto en todos los niveles de testing: Unitario, Integración, Sistema, Aceptación, Regresión
- Dominio de técnicas de testing: Boundary Value Analysis, Equivalence Partitioning, Decision Tables, State Transition Testing
- Experiencia en testing de: Validaciones de formularios, UX/UI, APIs, Bases de Datos, Seguridad, Performance
- Mentalidad crítica: Siempre buscas romper el sistema, encontrar edge cases que otros no ven
- Conocimiento profundo de estándares de accesibilidad (WCAG), seguridad (OWASP), y UX best practices

**TU TAREA:**
Genera {num_scenarios} escenarios de prueba Gherkin de **NIVEL PROFESIONAL** para la siguiente historia de usuario.

---

**PASO 1: ANÁLISIS PROFUNDO (PIENSA, NO INCLUYAS ESTO EN EL OUTPUT JSON)**

Antes de generar los escenarios, ANALIZA la historia de usuario:

**ID de Historia:** {user_story.id}
**Título:** {user_story.title}
**Descripción:** {user_story.description}

{criteria_section}

**PREGUNTAS DE ANÁLISIS (responde mentalmente, NO incluyas en JSON):**

1. **Contexto de Negocio:**
   - ¿De qué industria/dominio es este formulario? (e-commerce, salud, finanzas, marketing, etc.)
   - ¿Hay regulaciones legales que debo considerar? (edad mínima, protección de datos, etc.)
   - ¿Cuál es el objetivo de negocio? (conversión, lead generation, compliance, etc.)

2. **Riesgos Críticos:**
   - ¿Qué podría salir MAL en producción? (datos corruptos, menores registrándose, fraude, etc.)
   - ¿Qué bugs causarían pérdida de dinero o problemas legales?
   - ¿Qué validaciones son OBLIGATORIAS por ley o negocio?

3. **Campos y Dependencias:**
   - ¿Qué campos son OBLIGATORIOS vs OPCIONALES?
   - ¿Hay campos que dependen de otros? (Ciudad → Distrito, Edad → Producto)
   - ¿Hay grupos de campos que forman una validación compleja? (checkboxes legales, preguntas multi-opción)

4. **Flujos del Usuario:**
   - ¿Cuál es el camino feliz COMPLETO de inicio a fin?
   - ¿Qué puede hacer el usuario INCORRECTAMENTE? (saltar campos, datos falsos, no marcar checkboxes)
   - ¿Qué pasa si el usuario se equivoca y quiere corregir?

5. **Validaciones Esperadas:**
   - ¿Qué formatos de datos debo validar? (email, teléfono, fecha, DNI/ID)
   - ¿Qué rangos numéricos son válidos? (edad, calificación 1-10, longitud de texto)
   - ¿Qué caracteres especiales son permitidos/prohibidos?

---

**PASO 2: PRIORIZACIÓN DE ESCENARIOS**

Basándote en tu análisis anterior, identifica los escenarios MÁS IMPORTANTES:

**ALTA PRIORIDAD (40% de los escenarios):**
- Validaciones críticas que protegen el negocio (edad, checkboxes legales, datos obligatorios)
- Happy path completo
- Escenarios que bloquean el envío del formulario (campos obligatorios vacíos, checkboxes sin marcar)

**MEDIA PRIORIDAD (30% de los escenarios):**
- Validaciones de formato (email, teléfono, fecha)
- Boundary values de campos numéricos y texto
- Combinaciones de errores

**BAJA PRIORIDAD (30% de los escenarios):**
- Edge cases (caracteres especiales, emojis, longitud máxima)
- Flujos alternativos (editar, cancelar)
- Interacciones de UI (botones deshabilitados, mensajes de carga)

---

**PASO 3: GENERACIÓN DE ESCENARIOS**

Ahora, con tu análisis y priorización en mente, genera {num_scenarios} escenarios que:
1. Cubran los riesgos críticos identificados en tu análisis
2. Reflejen el contexto de negocio real
3. Prueben tanto el camino feliz COMO los caminos incorrectos
4. Sean específicos, ejecutables y alineados con los criterios de aceptación

**REQUISITOS CRÍTICOS:**
1. **LEE LOS CRITERIOS DE ACEPTACIÓN CUIDADOSAMENTE** - Cada criterio contiene reglas de validación específicas, nombres de campos y requisitos

2. **APLICA TÉCNICAS DE TESTING PROFESIONALES:**
   - **Boundary Value Analysis (BVA):** Prueba valores en los límites exactos (min-1, min, min+1, max-1, max, max+1)
   - **Equivalence Partitioning:** Agrupa valores similares y prueba un representante de cada grupo
   - **Decision Table Testing:** Cubre todas las combinaciones de condiciones importantes
   - **State Transition Testing:** Prueba diferentes estados del formulario (vacío, parcialmente lleno, completado, enviado)
   - **Error Guessing:** Usa tu experiencia para anticipar errores comunes (copiar-pegar con espacios, tildes, emojis, inyección SQL, XSS)

3. Genera {num_scenarios} escenarios de prueba DIVERSOS y COMPREHENSIVOS.

   **DISTRIBUCIÓN INTELIGENTE (ajusta según lo que encontraste en tu análisis):**

   **a) Escenarios de Validación (30-40% de los escenarios):**

   **SIEMPRE incluye (crítico):**
   - 1 Happy Path: Todas las validaciones pasan, flujo exitoso completo
   - 1 Intento de envío SIN marcar checkboxes obligatorios (Términos, Privacidad)
   - 1 Intento de envío con campos obligatorios VACÍOS
   - 1 Validación de edad mínima (si el producto/servicio lo requiere)
   - 1 Intento de envío con MÚLTIPLES errores simultáneos (DNI inválido + Email sin @ + sin checkboxes)

   **Luego agrega (importante):**
   - Validaciones Negativas: Cada campo crítico con datos inválidos (uno a la vez)
   - Validaciones de Formato: Emails malformados, teléfonos incorrectos, fechas inválidas
   - Validaciones de Rango: Valores fuera de límites (textos muy largos, números negativos, etc.)
   - Validaciones de Boundary Values: Exactamente en min/max permitido
   - Validaciones de Seguridad: SQL injection en campos de texto, XSS

   **b) Escenarios de Flujo de Usuario (20-30% de los escenarios):**
   - Navegación completa del formulario de inicio a fin
   - Flujos alternativos: Editar datos antes de enviar, volver atrás, cancelar
   - Múltiples envíos: ¿Qué pasa si envío el formulario 2 veces?
   - Abandono y recuperación: Cerrar y volver, datos se mantienen o se pierden

   **c) Escenarios de Casos Extremos (20-30% de los escenarios):**
   - Combinaciones de errores: 2+ campos inválidos simultáneamente
   - Valores límite: Textos en longitud mínima/máxima exacta, fechas límite
   - Casos especiales: Nombres con caracteres especiales (ñ, tildes), DNI con todos 0s
   - Estados de UI: Botón deshabilitado hasta completar campos, mensajes de carga

   **d) Escenarios de Integración/Sistema (10-20% de los escenarios):**
   - Interacción entre campos: Seleccionar Ciudad → filtrar Distritos disponibles
   - Checkboxes dependientes: Términos y Condiciones bloqueando envío
   - Mensajes del sistema: Pop-ups, redirects, confirmaciones
   - Manejo de errores del backend: Timeout, error 500, DNI duplicado en BD

4. **PENSAMIENTO CRÍTICO - PREGÚNTATE:**
   - ¿Qué pasaría si el usuario hace algo inesperado? (copiar-pegar, usar autofill del browser, etc.)
   - ¿Qué pasa si la conexión se cae justo al enviar?
   - ¿Qué pasa si el backend demora 30 segundos en responder?
   - ¿Qué pasa si el usuario tiene JavaScript deshabilitado?
   - ¿Qué pasa si abro 2 tabs con el mismo formulario?
   - ¿El formulario es accesible para usuarios con discapacidades? (navegación por teclado, screen readers)
   - ¿Hay riesgos de seguridad? (CSRF, clickjacking, data leakage en URLs)
   - ¿Los mensajes de error revelan información sensible? (DNI existente vs DNI inválido)

5. **SÉ EXTREMADAMENTE ESPECÍFICO:**
   - Usa los nombres EXACTOS de campos mencionados en los criterios
   - Usa las reglas de validación EXACTAS (ej: si el criterio dice "DNI debe tener 8 dígitos", prueba con 7 dígitos para caso negativo)
   - Usa los formatos de datos EXACTOS especificados (fechas, teléfonos, patrones de email, rangos de edad, etc.)
   - Incluye mensajes de error específicos mencionados en los criterios
   - Especifica el COMPORTAMIENTO esperado del UI (botones deshabilitados, campos resaltados, spinners de carga, etc.)
   - Indica el resultado esperado en CADA paso Then (no solo "debería funcionar", sino QUÉ debe pasar exactamente)

6. Usa sintaxis Gherkin apropiada (Given, When, Then, And) - Las palabras clave DEBEN estar en INGLÉS, pero el CONTENIDO en ESPAÑOL

7. Incluye tags apropiados según tipo de escenario:
   - @smoke @regression @positive @happy_path (para flujos exitosos completos)
   - @regression @negative @validation @error_handling (para casos de error)
   - @regression @edge_case @boundary (para pruebas de frontera y valores límite)
   - @integration @ui_interaction (para pruebas de interacción entre componentes)
   - @critical @blocker (para funcionalidad crítica que bloquea el flujo principal)

8. **CALIDAD DE CADA ESCENARIO:**
   Cada escenario DEBE cumplir con los criterios INVEST:
   - **Independent:** No depende de otros escenarios (puede ejecutarse solo)
   - **Negotiable:** Describe el QUÉ, no el CÓMO (permite diferentes implementaciones)
   - **Valuable:** Prueba algo importante para el negocio
   - **Estimable:** Está lo suficientemente claro para estimar esfuerzo
   - **Small:** Focalizado en UNA funcionalidad/validación específica
   - **Testable:** Tiene criterios de éxito/fallo claros y medibles

   Además:
   - Ser directamente trazable a uno o más criterios de aceptación
   - Ser realista y ejecutable por un QA tester
   - Ser lo suficientemente específico para que un desarrollador pueda automatizarlo
   - Tener un PROPÓSITO claro: ¿Qué está probando exactamente este escenario?
   - Seguir la regla: 1 Scenario = 1 Propósito de Testing

**Ejemplos de escenarios BUENOS vs MALOS:**

**Validación:**
❌ MALO (muy genérico): "When ingreso datos válidos"
✅ BUENO (específico): "When ingreso '12345678' en el campo 'DNI'"

❌ MALO (vago): "Then debería ver un error"
✅ BUENO (exacto): "Then debería ver el mensaje de error 'El DNI debe tener 8 dígitos' junto al campo 'DNI'"

**Flujo de Usuario:**
❌ MALO: "When completo el formulario"
✅ BUENO: "When completo todos los campos obligatorios | And hago clic en 'Registrar' | And vuelvo atrás usando el botón del navegador | Then los datos ingresados deberían mantenerse en el formulario"

**Casos Extremos:**
❌ MALO: "When ingreso un nombre largo"
✅ BUENO: "When ingreso un nombre de exactamente 100 caracteres (límite máximo) en el campo 'Nombre completo' | Then el formulario debería aceptarlo sin errores"

**Interacción:**
❌ MALO: "When selecciono una ciudad"
✅ BUENO: "When selecciono 'Lima' en el campo 'Ciudad' | Then el campo 'Distrito' debería mostrar solo distritos de Lima | And 'Miraflores' debería estar disponible en la lista"

**Escenarios Críticos que NUNCA debes olvidar:**
✅ OBLIGATORIO: "Intento de envío sin marcar checkboxes de Términos y Condiciones"
✅ OBLIGATORIO: "Intento de envío dejando campos obligatorios vacíos"
✅ OBLIGATORIO: "Validación de edad mínima (si aplica al producto/servicio)"
✅ OBLIGATORIO: "Intento de envío con MÚLTIPLES campos inválidos simultáneamente"
✅ OBLIGATORIO: "Validación de formato de Email inválido (sin @, sin dominio, etc.)"
✅ OBLIGATORIO: "Validación de formato de Teléfono inválido (letras, longitud incorrecta)"

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

**REGLAS CRÍTICAS DE FORMATO JSON:**
1. NUNCA uses backslash (\\) dentro de strings a menos que sea un escape válido (\\n, \\t, \\", \\\\)
2. Si necesitas mencionar una ruta o patrón, usa forward slash (/) no backslash (\\)
3. Caracteres especiales del español (ñ, á, é, í, ó, ú, ¿, ¡) NO necesitan escaparse, úsalos directamente
4. Comillas dentro de strings: usa comillas simples ' en lugar de escapar comillas dobles \\"
5. Saltos de línea en texto: NO los incluyas, escribe todo en una sola línea
6. Ejemplo CORRECTO: "ingreso 'Juan Pérez' en el campo 'Nombre'"
7. Ejemplo INCORRECTO: "ingreso \\"Juan Pérez\\" en el campo \\"Nombre\\"" ❌

Genera los escenarios ahora (retorna SOLO el array JSON válido, sin markdown, sin texto adicional):"""

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

            # Sanitize JSON - Fix common escape issues from AI responses
            # Replace invalid escapes that aren't part of valid JSON escape sequences
            # Valid JSON escapes: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
            import re

            # Fix: Replace literal backslash followed by non-escape characters
            # This regex finds backslashes NOT followed by valid escape chars
            json_text = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', json_text)

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
            elif "Invalid \\escape" in error_msg or "Invalid escape" in error_msg:
                print(f"❌ JSON contains invalid escape sequences")
                print(f"   Error: {error_msg}")
                print(f"   This usually happens when AI includes backslashes (\\) incorrectly")

                # Find the problematic area
                try:
                    # Extract error position
                    import re
                    match = re.search(r'line (\d+) column (\d+)', error_msg)
                    if match:
                        line_num = int(match.group(1))
                        col_num = int(match.group(2))

                        # Show context around error
                        lines = json_text.split('\n')
                        if 0 < line_num <= len(lines):
                            start = max(0, line_num - 3)
                            end = min(len(lines), line_num + 2)
                            print(f"   Context around error (lines {start+1}-{end}):")
                            for i in range(start, end):
                                marker = ">>> " if i == line_num - 1 else "    "
                                print(f"   {marker}{i+1:3d}: {lines[i][:100]}")
                except Exception as context_error:
                    print(f"   Could not extract error context: {context_error}")

                print(f"   Response preview: {response_text[:500]}...")
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

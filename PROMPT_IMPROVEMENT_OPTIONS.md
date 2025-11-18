# Opciones de Mejora para el Prompt de Generación de Test Cases con IA

**Fecha:** 2025-11-18
**Estado actual:** Prompt mejorado con rol de QA Senior Lead + técnicas de testing profesionales

---

## ✅ YA IMPLEMENTADO

1. **Rol profesional robusto:** QA Senior Lead con 10+ años, certificaciones ISTQB
2. **Técnicas de testing:** BVA, Equivalence Partitioning, Decision Tables, State Transition, Error Guessing
3. **Distribución de escenarios:** 4 categorías (Validación 30-40%, Flujo 20-30%, Edge Cases 20-30%, Integración 10-20%)
4. **Pensamiento crítico:** 8 preguntas para identificar riesgos ocultos
5. **Criterios INVEST:** Para garantizar calidad de cada escenario
6. **Tags avanzados:** `@security`, `@accessibility`, `@performance`, `@critical`, `@blocker`
7. **Ejemplos mejorados:** 4 tipos (Validación, Flujo, Extremos, Interacción)

---

## 🎯 OPCIONES DE MEJORA ADICIONALES

### **OPCIÓN 1: Few-Shot Learning (Ejemplos Reales Completos)**

**Qué es:** Dar a la IA 2-3 ejemplos COMPLETOS de test cases de excelente calidad antes de pedirle que genere los suyos.

**Implementación:**
```gherkin
**EJEMPLO DE TEST CASE DE ALTA CALIDAD:**

@smoke @regression @positive @happy_path @critical
Scenario: Registro exitoso con todos los campos válidos y obligatorios
  Given estoy en la página de 'Registro de Usuario'
  And el formulario está completamente vacío
  And la API de validación de DNI está disponible
  When ingreso '12345678' en el campo 'DNI'
  And ingreso 'Juan Carlos Pérez García' en el campo 'Nombre Completo'
  And ingreso 'juan.perez@gmail.com' en el campo 'Email'
  And ingreso '987654321' en el campo 'Teléfono'
  And selecciono 'Masculino' en el campo 'Género'
  And ingreso '15/03/1990' en el campo 'Fecha de Nacimiento'
  And marco el checkbox 'Acepto Términos y Condiciones'
  And marco el checkbox 'Acepto Política de Privacidad'
  And hago clic en el botón 'Registrar'
  Then debería ver un spinner de carga por máximo 3 segundos
  And debería ver un pop-up con el mensaje 'Registro exitoso. ¡Bienvenido Juan!'
  And debería ser redirigido a la URL '/dashboard' en 2 segundos
  And debería recibir un email de confirmación a 'juan.perez@gmail.com'
  And el botón 'Registrar' debería estar deshabilitado durante el proceso

@regression @negative @validation @error_handling
Scenario: Validación de email inválido - Formato sin arroba
  Given estoy en la página de 'Registro de Usuario'
  When completo todos los campos obligatorios con datos válidos
  And ingreso 'juanperezgmail.com' (sin @) en el campo 'Email'
  And hago clic fuera del campo 'Email' (evento blur)
  Then debería ver el mensaje de error 'El email debe tener un formato válido (ejemplo: usuario@dominio.com)' debajo del campo 'Email'
  And el campo 'Email' debería tener un borde rojo
  And el icono de error (⚠️) debería aparecer junto al campo
  And el botón 'Registrar' debería estar deshabilitado
  And el formulario NO debería ser enviado

@regression @edge_case @boundary @security
Scenario: Boundary Value Analysis - Nombre con longitud máxima exacta (100 caracteres)
  Given estoy en la página de 'Registro de Usuario'
  When ingreso un nombre de exactamente 100 caracteres en el campo 'Nombre Completo'
  And el nombre incluye caracteres especiales permitidos (ñ, á, é, í, ó, ú)
  And completo el resto de campos obligatorios con datos válidos
  And hago clic en el botón 'Registrar'
  Then el formulario debería ser enviado exitosamente
  And el nombre debería guardarse completo en la base de datos sin truncamiento
  And debería aparecer completo en la página de confirmación
```

**Ventajas:**
- ✅ La IA aprende el NIVEL DE DETALLE exacto que esperas
- ✅ Entiende cómo estructurar Given-When-Then con múltiples And
- ✅ Ve ejemplos de verificaciones de UI (spinners, colores, iconos)
- ✅ Aprende a especificar tiempos, URLs, emails, eventos del navegador

**Desventaja:**
- ⚠️ Aumenta el tamaño del prompt en ~500-1000 tokens

---

### **OPCIÓN 2: Chain of Thought (Razonamiento Paso a Paso)**

**Qué es:** Pedir a la IA que PIENSE EN VOZ ALTA antes de generar los escenarios.

**Implementación:**
```
**ANTES DE GENERAR LOS ESCENARIOS, PIENSA PASO A PASO:**

1. **Análisis de Riesgos (NO incluir en output JSON):**
   - Lee los criterios de aceptación
   - Identifica los 3 riesgos principales de esta funcionalidad
   - Identifica los campos más críticos (los que podrían causar bugs graves)

2. **Planificación de Cobertura (NO incluir en output JSON):**
   - ¿Qué validaciones son CRÍTICAS y deben tener múltiples casos de prueba?
   - ¿Qué flujos de usuario son más comunes?
   - ¿Qué edge cases son más probables en producción?

3. **Generación de Escenarios:**
   Ahora, basándote en tu análisis anterior, genera {num_scenarios} escenarios que:
   - Prioricen los riesgos identificados
   - Cubran las validaciones críticas con mayor profundidad
   - Incluyan casos de prueba que un tester junior podría olvidar
```

**Ventajas:**
- ✅ La IA "razona" antes de generar, mejora la calidad
- ✅ Prioriza automáticamente lo más importante
- ✅ Encuentra edge cases más sofisticados

**Desventaja:**
- ⚠️ Aumenta el tiempo de generación (más tokens procesados)

---

### **OPCIÓN 3: Priorización por Impacto y Probabilidad**

**Qué es:** Pedir a la IA que asigne prioridad a cada escenario según riesgo.

**Implementación:**
```json
// Modificar el schema de salida para incluir:
{
  "scenario_name": "...",
  "tags": ["smoke", "positive"],
  "priority": "CRITICAL",  // ← NUEVO
  "risk_level": "HIGH",    // ← NUEVO
  "test_priority": "P0",   // ← NUEVO (P0 = Must test, P1 = Should test, P2 = Nice to test)
  "rationale": "Este escenario prueba la validación de DNI que es crítica para el negocio...",  // ← NUEVO
  "given_steps": [...],
  "when_steps": [...],
  "then_steps": [...]
}
```

**Ventajas:**
- ✅ Los testers saben qué ejecutar primero en caso de tiempo limitado
- ✅ Ayuda a priorizar la automatización
- ✅ Justifica por qué cada test es importante

**Desventaja:**
- ⚠️ Cambio en el schema requiere actualizar el parser

---

### **OPCIÓN 4: Data-Driven Testing (Tablas de Ejemplos)**

**Qué es:** Para validaciones similares, usar Scenario Outline con tablas.

**Implementación en el prompt:**
```
**OPTIMIZACIÓN DE ESCENARIOS REPETITIVOS:**

Si identificas múltiples validaciones similares (ej: DNI con 7 dígitos, 9 dígitos, letras),
AGRUPA en un solo Scenario Outline con Examples:

@regression @negative @validation @error_handling
Scenario Outline: Validación de DNI - Formatos inválidos
  Given estoy en la página 'Formulario - Trial'
  When ingreso '<dni_invalido>' en el campo 'DNI'
  And completo el resto de campos obligatorios con datos válidos
  And hago clic en el botón 'Registrar'
  Then debería ver el mensaje de error '<mensaje_error>' junto al campo 'DNI'
  And el formulario NO debería ser enviado

  Examples:
    | dni_invalido | mensaje_error                        | caso_prueba                    |
    | 1234567      | El DNI debe tener 8 dígitos         | Menos de 8 dígitos            |
    | 123456789    | El DNI debe tener 8 dígitos         | Más de 8 dígitos              |
    | 1234567A     | El DNI solo debe contener números   | Contiene letras               |
    | 12345 78     | El DNI solo debe contener números   | Contiene espacios             |
    | 12345678     | El DNI solo debe contener números   | DNI con caracteres especiales |
```

**Ventajas:**
- ✅ Reduce duplicación de escenarios
- ✅ Más fácil de mantener
- ✅ Ideal para automatización

**Desventaja:**
- ⚠️ Requiere actualizar el parser para soportar Scenario Outline

---

### **OPCIÓN 5: Contexto de Negocio Específico**

**Qué es:** Agregar información del dominio de negocio para generar escenarios más relevantes.

**Implementación:**
```
**CONTEXTO DE NEGOCIO:**
Este formulario es para una campaña de marketing de Pilsen Fresh (cerveza) dirigida a consumidores peruanos.

**CONSIDERACIONES ESPECÍFICAS:**
- Usuario objetivo: Hombres y mujeres de 18+ años en Perú
- Regulación: DEBE validar edad legal para consumo de alcohol (18+)
- Legal: DEBE cumplir con Ley de Protección de Datos Personales del Perú
- UX: El formulario debe ser completable en <3 minutos para maximizar conversión
- Riesgos críticos:
  1. Permitir registro de menores de edad (legal issue)
  2. Filtración de datos personales (PII leakage)
  3. Baja tasa de completitud por validaciones muy estrictas

**GENERA ESCENARIOS QUE CONSIDEREN ESTOS ASPECTOS DE NEGOCIO.**
```

**Ventajas:**
- ✅ Escenarios más alineados con riesgos reales del negocio
- ✅ Identifica edge cases específicos del dominio
- ✅ Prueba cumplimiento legal/regulatorio

**Desventaja:**
- ⚠️ Requiere que el usuario provea este contexto

---

### **OPCIÓN 6: Test Automation Readiness**

**Qué es:** Generar escenarios con selectores CSS y data-testid para facilitar automatización.

**Implementación:**
```json
{
  "scenario_name": "...",
  "automation_selectors": {  // ← NUEVO
    "dni_field": "input[name='dni']",
    "submit_button": "button[data-testid='register-btn']",
    "error_message": ".error-message[data-field='dni']"
  },
  "automation_difficulty": "EASY",  // ← NUEVO (EASY, MEDIUM, HARD)
  "given_steps": [
    {
      "description": "estoy en la página 'Formulario - Trial'",
      "automation_hint": "await page.goto('https://example.com/formulario-trial')"  // ← NUEVO
    }
  ],
  ...
}
```

**Ventajas:**
- ✅ Acelera la automatización posterior
- ✅ QA automation tiene hints de cómo implementar
- ✅ Identifica qué escenarios son difíciles de automatizar

**Desventaja:**
- ⚠️ Aumenta complejidad del schema

---

### **OPCIÓN 7: Coverage Metrics y Gap Analysis**

**Qué es:** Al final de la generación, la IA reporta qué NO cubrió.

**Implementación:**
```
**DESPUÉS DE GENERAR LOS {num_scenarios} ESCENARIOS, ANALIZA:**

COBERTURA GENERADA:
- Criterios de aceptación cubiertos: X/Y (Z%)
- Validaciones de campos cubiertas: A/B (C%)
- Técnicas aplicadas: BVA ✅, Equivalence Partitioning ✅, Decision Tables ❌

GAPS IDENTIFICADOS (NO cubiertos por limitación de cantidad):
- Criterio #15: "Validación de edad menor a 18 años"
- Combinación: DNI inválido + Email inválido simultáneamente
- Prueba de performance: Formulario con >1000 opciones en dropdown

RECOMENDACIÓN:
Si aumentas a {num_scenarios + 10} escenarios, podría cubrir estos gaps críticos.
```

**Ventajas:**
- ✅ Transparencia total de qué se probó y qué no
- ✅ El usuario sabe si necesita generar más escenarios
- ✅ Identificación de riesgos no cubiertos

**Desventaja:**
- ⚠️ Solo funciona si la IA retorna texto adicional (no solo JSON)

---

### **OPCIÓN 8: Multi-Modelo Validation**

**Qué es:** Generar con Gemini, luego pedir a Claude/GPT-4 que revise y mejore.

**Implementación:**
```python
# Workflow:
1. Gemini genera 40 escenarios iniciales
2. Se pasan a Claude/GPT-4 con prompt:
   "Eres un QA Senior revisando test cases. Identifica:
   - Escenarios redundantes
   - Gaps en la cobertura
   - Mejoras en la especificidad
   - Errores en la sintaxis Gherkin"
3. Se combinan los resultados
```

**Ventajas:**
- ✅ Calidad superior (2 IAs validando)
- ✅ Reduce escenarios redundantes
- ✅ Encuentra gaps que un solo modelo pasó por alto

**Desventaja:**
- ⚠️ Requiere acceso a múltiples APIs
- ⚠️ Más costoso (2x tokens)

---

## 📊 RESUMEN Y RECOMENDACIONES

### **Implementación Inmediata (Alta prioridad):**
1. ✅ **OPCIÓN 1 - Few-Shot Learning:** Agregar 2-3 ejemplos completos (impacto masivo, fácil implementación)
2. ✅ **OPCIÓN 5 - Contexto de Negocio:** Agregar sección de contexto específico del dominio

### **Implementación a Mediano Plazo:**
3. ⚠️ **OPCIÓN 4 - Data-Driven Testing:** Usar Scenario Outline (requiere actualizar parser)
4. ⚠️ **OPCIÓN 3 - Priorización:** Agregar campos de priority/risk (requiere actualizar schema)

### **Implementación Avanzada (Opcional):**
5. 🔬 **OPCIÓN 2 - Chain of Thought:** Razonamiento explícito (aumenta tiempo pero mejora calidad)
6. 🔬 **OPCIÓN 6 - Automation Hints:** Para equipos con automatización activa
7. 🔬 **OPCIÓN 7 - Coverage Metrics:** Para reportes de calidad
8. 🔬 **OPCIÓN 8 - Multi-Modelo:** Para proyectos críticos con presupuesto

---

## 🎯 MI RECOMENDACIÓN TOP 3

Si solo puedes implementar 3, elige:

**#1 - Few-Shot Learning (OPCIÓN 1)**
- Mayor impacto en calidad inmediato
- No requiere cambios en código
- Solo agregar ejemplos al prompt

**#2 - Contexto de Negocio (OPCIÓN 5)**
- Escenarios más relevantes al dominio
- Identifica riesgos legales/regulatorios
- Fácil de implementar

**#3 - Chain of Thought (OPCIÓN 2)**
- Mejora la "inteligencia" de la generación
- La IA prioriza automáticamente
- Solo requiere modificar prompt

---

**Autor:** Claude Code Session
**Fecha:** 2025-11-18

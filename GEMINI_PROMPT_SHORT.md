# 🚀 Prompt para Gemini 2.5 - Manager Dashboard

## CONTEXTO

Soy desarrollador de un **SaaS de gestión QA** (Testing/Quality Assurance) con:
- **Roles**: Admin, Manager, QA Engineer, Developer
- **Stack**: React + TypeScript + FastAPI + SQLite + AI (Gemini)
- **Workflow**: User Stories → Test Cases (AI-generated) → Test Executions → Bug Reports

## WORKFLOW DEL SISTEMA

```
1. UPLOAD User Stories (Excel/CSV)
   - ID, Title, Description, Acceptance Criteria, Priority, Status
   ↓
2. GENERAR Test Cases con AI (Gemini 2.5)
   - Formato: Gherkin (.feature files)
   - Structure: Feature → Scenarios → Given/When/Then steps
   - Tipos: Functional, E2E, Integration, Regression, Performance
   ↓
3. EJECUTAR Tests manualmente (QA Engineer)
   - Resultados: PASSED / FAILED / BLOCKED / SKIPPED
   - Capturar: screenshots, videos, logs, evidencias
   - Guardar: steps_results (resultado por cada Given/When/Then)
   - Environment: browser, OS, device info
   ↓
4. REPORTAR Bugs encontrados
   - Severity: CRITICAL, HIGH, MEDIUM, LOW
   - Priority: URGENT, HIGH, MEDIUM, LOW
   - Status: OPEN, IN_PROGRESS, RESOLVED, CLOSED
   - Relacionar con: Test Case ID, User Story ID
   - Detalles: Steps to Reproduce, Expected vs Actual, Screenshots
```

## ROLES Y NECESIDADES

| Rol | ¿Qué Hace? | ¿Qué Necesita Ver? |
|-----|-----------|-------------------|
| **ADMIN** | Gestiona usuarios, plataforma | Usuarios activos, Tasa activación, Recursos del sistema |
| **MANAGER** | Supervisa proyectos, toma decisiones estratégicas | ❓ *Esto es lo que necesito mejorar* |
| **QA** | Crea y ejecuta tests, reporta bugs | Test Cases asignados, Coverage, Bugs abiertos |
| **DEV** | Soluciona bugs, revisa tests | Bugs asignados, Test Cases relacionados |

## MANAGER DASHBOARD (IMPLEMENTACIÓN ACTUAL)

**Métricas Globales** (cards superiores):
- ✅ **Total de Proyectos** → Con filtro activos/inactivos
- ✅ **Cobertura Promedio** → Test coverage global
- ✅ **Bugs Críticos** → Suma de bugs críticos de todos los proyectos
- ✅ **Pass Rate** → Promedio de tests pasados

**Summary Cards** (columna izquierda):
- ✅ **Proyectos en Riesgo** → Lista de proyectos con health score < 50
- ✅ **Top 3 Proyectos** → Mejores proyectos por health score

**Projects Table** (columna derecha):
- ✅ Tabla con todos los proyectos mostrando:
  - Nombre del proyecto
  - Total User Stories
  - Total Test Cases
  - Test Coverage (%)
  - Total Bugs
  - Pass Rate (%)
  - Health Score (badge con color)
  - Acciones (Ver Dashboard, Generar Reporte)

**Filtros disponibles**:
- Búsqueda por nombre
- Filtro por proyectos activos
- Filtro por proyectos en riesgo

**Problema**: Las métricas son correctas pero las visualizaciones son básicas (solo números y tablas)

---

## ❓ MIS PREGUNTAS PARA TI

### 1️⃣ MÉTRICAS ADICIONALES PARA MANAGER

**Las métricas actuales son correctas, pero ¿qué más debería ver un Manager de QA?**

Considera:
- **Tendencias temporales**: Coverage/Bugs/Pass Rate en el tiempo (últimos 7/30/90 días)
- **Comparativas**: ¿Mejor/peor proyecto? ¿Tendencias ascendentes/descendentes?
- **Eficiencia de testing**: ¿Test cases por user story? ¿Tiempo promedio de ejecución?
- **Calidad de bugs**: ¿Tiempo promedio de resolución? ¿Reincidencia?
- **Alertas proactivas**: ¿Proyectos que están empeorando? ¿Coverage bajando?
- **Productividad del equipo**: ¿Tests ejecutados por día? ¿Bugs reportados por QA?

**Ejemplo de métricas avanzadas**:
- "Test Velocity": Tests ejecutados en últimos 7 días vs semana anterior
- "Bug Resolution Time": Promedio de días para cerrar un bug
- "Coverage Trend": ¿Subiendo ↗️ o bajando ↘️?
- "Risk Score": Combinación de coverage bajo + bugs altos + pass rate bajo

### 2️⃣ NAVEGACIÓN DE CARDS DEL MANAGER

**Cuando el manager hace click en cada card de métrica global, ¿a dónde debería navegar?**

Cards actuales y navegación propuesta:
- Click "Total de Proyectos" → ¿Scroll a tabla de proyectos? ¿Modal con filtros avanzados?
- Click "Cobertura Promedio" → ¿Mostrar breakdown por proyecto? ¿Gráfica de distribución?
- Click "Bugs Críticos" → ¿Lista de todos los bugs críticos? ¿Filtrar tabla por bugs?
- Click "Pass Rate" → ¿Gráfica de tendencia? ¿Proyectos con menor pass rate?

**Opciones de navegación**:
- Opción A: Scroll/filtro a la tabla de proyectos existente
- Opción B: Modal con detalle expandido (gráficas, breakdown)
- Opción C: Navegar a página de analytics dedicada
- Opción D: No hacer nada (solo informativo)

### 3️⃣ TEST COVERAGE - ¿CÓMO SE CALCULA CORRECTAMENTE?

**Mi implementación actual**:
```python
test_coverage = (stories_with_tests / total_stories) * 100
```

Donde:
- `stories_with_tests` = User Stories que tienen ≥1 test case
- `total_stories` = Total de user stories

**¿Es correcto? ¿O debería considerar**:
- **Scenario Coverage**: ¿Todos los escenarios posibles están cubiertos?
- **Acceptance Criteria Coverage**: ¿Cada criterio de aceptación tiene test?
- **Execution Coverage**: ¿Tests ejecutados vs creados?
- **Step Coverage**: ¿Cada paso del Gherkin ejecutado?

**Ejemplo práctico**:
```
User Story US-001: Login de Usuario
  Acceptance Criteria:
    1. Validar email formato correcto
    2. Validar password mínimo 8 caracteres
    3. Mostrar error si credenciales incorrectas

  Test Cases creados: 2
    - TC-001: Login exitoso
    - TC-002: Login fallido password incorrecta

  ¿Falta un test para validar formato de email?
  ¿Coverage = 100% o 66% (2 de 3 criterios)?
```

### 4️⃣ VISUALIZACIONES

**Genera imágenes visuales** para:
1. **Admin Dashboard rediseñado** con métricas recomendadas
2. **Gráficas de actividad** (usuarios activos por día/semana)
3. **Diagrama de flujo** mostrando navegación desde cards
4. **Comparativa visual**: Admin Dashboard vs Manager Dashboard
5. **Test Coverage explicado** con niveles y fórmulas visuales
6. **Widgets sugeridos**: trend charts, sparklines, gauges, progress rings

**Estilo UI**:
- TailwindCSS (bg-white, shadow, rounded-lg)
- Lucide-react icons
- Colores: Blue (primary), Purple (admin), Green (success), Red (danger)

---

## 🎯 TU MISIÓN

**Como experto en UX/UI Design y QA Architecture**:

1. **Recomienda mejoras visuales** para el Manager Dashboard actual:
   - Qué gráficas añadir (line charts, bar charts, donuts, gauges)
   - Widgets para mostrar tendencias temporales
   - Indicadores visuales de salud (color coding, iconografía)
   - Sparklines o mini-gráficas en las cards

2. **Define 4-6 métricas adicionales** relevantes para Manager (con justificación):
   - Tendencias temporales
   - Comparativas entre proyectos
   - Alertas proactivas
   - Eficiencia del equipo

3. **Propón navegación interactiva** para las cards:
   - ¿Qué pasa al hacer click en cada métrica?
   - ¿Modals con detalle? ¿Scroll a tabla? ¿Nueva página?
   - Diseña la UX del flujo de drill-down

4. **Explica cálculo correcto de Test Coverage** en QA profesional:
   - ¿Mi fórmula actual es correcta?
   - ¿Qué niveles de coverage existen? (story, scenario, criteria, execution)
   - Ejemplos prácticos con números reales

5. **Genera imágenes visuales**:
   - **Mockup completo** del Manager Dashboard rediseñado con gráficas
   - **Ejemplos de gráficas**: Line chart de tendencias, Donut de coverage distribution, Gauge de health score
   - **Modal de drill-down**: Ejemplo de breakdown al hacer click en métrica
   - **Comparativa**: Before (actual) vs After (propuesto)
   - **Paleta de colores** para severity, health, trends

6. **Propón estructura técnica** para nuevas métricas:
   - Queries SQL/ORM necesarias
   - Cálculos y fórmulas
   - Campos adicionales en base de datos (si aplica)

**Genera las imágenes en alta resolución con anotaciones explicativas en español**.

---

## 📋 DATOS TÉCNICOS (para referencia)

### Base de Datos (SQLAlchemy Models):
```python
UserDB:
  - id, email, full_name, role, organization_id
  - is_registered, last_login, created_at, invited_by

ProjectDB:
  - id, name, description, is_active, organization_id
  - created_at, updated_at

UserStoryDB:
  - id, project_id, title, description, acceptance_criteria
  - priority, status, created_at

TestCaseDB:
  - id, user_story_id, project_id, title, test_type
  - gherkin_file_path, created_at

TestExecutionDB:
  - id, test_case_id, status (PASSED/FAILED/BLOCKED/SKIPPED)
  - steps_results (JSON), environment, executed_by
  - execution_date, evidence_paths

BugDB:
  - id, project_id, test_case_id, user_story_id
  - title, severity, priority, status
  - steps_to_reproduce, expected_behavior, actual_behavior
  - reported_by, assigned_to, created_at
```

### Métricas Manager (calculadas):
```python
# Test Coverage
test_coverage = (stories_with_tests / total_stories) * 100

# Pass Rate
pass_rate = (tests_passed / total_executions) * 100

# Health Score
health = min(100,
  (coverage/100 * 40) +
  max(0, (1 - bugs/stories) * 30) +
  min(30, (tests/stories) * 30)
)
```

---

**¡Adelante! Genera el análisis completo con visualizaciones** 🚀

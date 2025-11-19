# 🔄 FLUJO DE TRABAJO QA COMPLETO - Design Document

**Fecha**: 2025-11-18
**Autor**: QA Senior Lead Analysis
**Objetivo**: Definir el flujo end-to-end de un QA profesional usando esta herramienta

---

## 📋 ÍNDICE

1. [El Flujo QA Profesional - Estado Actual vs Estado Ideal](#1-el-flujo-qa-profesional)
2. [Acceptance Criteria - Checkboxes Interactivos](#2-acceptance-criteria-checkboxes)
3. [Test Cases - Ejecución y Tracking](#3-test-cases-ejecución)
4. [Test Coverage - Cálculo y Utilidad](#4-test-coverage)
5. [Bug Tracking - Relación con Tests](#5-bug-tracking)
6. [Evidencias - Upload y Storage](#6-evidencias)
7. [Reportes - Generación y Distribución](#7-reportes)
8. [Seguimiento - Dashboards y Métricas](#8-seguimiento)
9. [Features Faltantes - Gap Analysis Completo](#9-features-faltantes)
10. [Roadmap de Implementación](#10-roadmap)

---

## 1. EL FLUJO QA PROFESIONAL

### 🎯 Estado Actual vs Estado Ideal

#### **FASE 1: Recibir Requirements** ✅ IMPLEMENTADO

**Estado Actual:**
```
PM/PO → Excel con User Stories → Upload a la herramienta
```

**Flujo:**
1. PM/PO crea Excel con user stories + acceptance criteria
2. QA sube Excel vía `POST /upload?project_id=PROJ-001`
3. Backend parsea con IA (extrae/limpia acceptance criteria)
4. User stories aparecen en tabla con criterios expandibles

**✅ LO QUE FUNCIONA:**
- Upload Excel/CSV
- Parse automático de columnas
- AI extraction de acceptance criteria complejos
- Visualización de criterios con checkboxes (decorativos)

**❌ LO QUE FALTA:**
- **Marcar criterios como completados** → Para tracking de progreso de desarrollo
- **Editar criterios in-app** → Actualmente solo se pueden editar via re-upload
- **Agregar criterios manualmente** → Sin necesidad de Excel
- **Notificar cuando criterios cambian** → Para que QA sepa que debe re-testear

---

#### **FASE 2: Planificar Testing** ⚠️ PARCIAL

**Estado Ideal:**
```
User Story → Generar Test Cases con IA → Revisar/Editar → Aprobar → Asignar a QA
```

**Flujo Actual:**
1. QA selecciona user story
2. Click "Generate Test Cases"
3. Configurar: # tests, # scenarios, tipos, usar IA
4. Preview de sugerencias → ReviewModal
5. Editar/eliminar tests
6. "Guardar Todos" → Crea tests en BD

**✅ LO QUE FUNCIONA:**
- Generación con IA (Gemini)
- Preview antes de guardar
- Editar titles/descriptions
- Ver Gherkin generado
- Batch save

**❌ LO QUE FALTA:**
- **Asignar test cases a testers** → Campo `assigned_to` existe en BD pero no en UI
- **Estimar tiempo de ejecución** → Campos `estimated_time_minutes` existen pero no se usan
- **Priorizar test cases** → ¿Qué ejecutar primero si hay poco tiempo?
- **Agrupar en Test Suites** → Actualmente se agrupan por user story, ¿y si quiero agrupar por Sprint? ¿Por feature?
- **Test Case Templates** → Guardar templates para reusar
- **Dependencias entre tests** → Test B requiere que Test A pase primero

---

#### **FASE 3: Ejecutar Tests** ❌ NO IMPLEMENTADO

**Estado Ideal:**
```
QA abre test case → Lee pasos Gherkin → Ejecuta → Marca PASSED/FAILED → Agrega notas/evidencias → Guarda resultado
```

**Flujo Esperado:**

**3.1 Iniciar Ejecución**
```typescript
// TestCasesPage
<Button onClick={() => openExecutionModal(testCase)}>
  ▶ Run Test
</Button>

// Modal: TestExecutionModal
- Test Case ID + Title
- Gherkin steps (read-only)
- Checkbox por cada step: ✅ Pass / ❌ Fail / ⏭️ Skip
- Contador: 8/10 steps passed
- Cronómetro: Timer automático de ejecución
- Campo: Notas de ejecución (textarea)
- Campo: Failure reason (si failed)
- Upload: Evidencias (screenshots, videos, logs)
- Select: Status final → PASSED | FAILED | BLOCKED | SKIPPED
- Botón: "Save Execution"
```

**3.2 Guardar Ejecución**
```python
# POST /test-executions
{
  "test_case_id": "TC-001",
  "executed_by": "qa@example.com",
  "execution_date": "2025-11-18T14:30:00",
  "status": "FAILED",
  "execution_time_minutes": 5,
  "passed_steps": 7,
  "failed_steps": 1,
  "total_steps": 8,
  "notes": "El botón 'Registrar' no se habilitó después de completar todos los campos",
  "failure_reason": "UI no respondió correctamente a validaciones",
  "evidence_files": ["screenshot_1.png", "network_log.har"],
  "bug_ids": []  // Si se crea bug, se linkea después
}
```

**3.3 Historial de Ejecuciones**
```
Test Case TC-001
├─ Execution #1: 2025-11-15 14:00 → FAILED by qa@example.com (5 min)
├─ Execution #2: 2025-11-16 10:30 → PASSED by qa@example.com (4 min)
└─ Execution #3: 2025-11-18 14:30 → FAILED by qa@example.com (5 min) ← Latest
```

**✅ LO QUE EXISTE EN BD:**
- Tabla `test_executions` completa
- Campos: executed_by, execution_time, passed_steps, failed_steps, notes, failure_reason

**❌ LO QUE FALTA:**
- **UI para ejecutar tests** → Modal de ejecución
- **Timer automático** → Medir tiempo real de ejecución
- **Step-by-step tracking** → Checkbox por cada Given/When/Then
- **Upload de evidencias** → Screenshots, videos, logs
- **Historial de ejecuciones** → Ver todas las ejecuciones pasadas de un test
- **Re-run automático** → "Re-ejecutar test" con pre-fill de datos anteriores
- **Bulk execution** → Ejecutar múltiples tests en secuencia

---

#### **FASE 4: Reportar Bugs** ⚠️ PARCIAL (Backend completo, Frontend placeholder)

**Estado Ideal:**
```
Test FAILED → Click "Report Bug" → Form pre-fill con datos del test → Upload evidencias → Crear bug → Link bug ↔ test
```

**Flujo Esperado:**

**4.1 Desde Test Execution**
```typescript
// Dentro de TestExecutionModal cuando status = FAILED
<Button onClick={() => createBugFromTest()}>
  🐛 Report Bug
</Button>

// Abre BugFormModal con datos pre-filled:
{
  title: "[TC-001] Botón Registrar no se habilita",  // Auto-generado
  test_case_id: "TC-001",
  user_story_id: "US-001",
  severity: "HIGH",  // Sugerido por IA basado en test priority
  priority: "HIGH",
  bug_type: "UI",
  status: "NEW",
  environment: "QA",
  browser: "Chrome 120",  // Detectado automáticamente
  os: "Windows 11",
  version: "1.0.0",
  steps_to_reproduce: [
    "Given estoy en la página 'Formulario - Trial'",  // Copiado de Gherkin
    "When completo todos los campos obligatorios",
    "Then el botón 'Registrar' NO se habilita"  // Modificado para bug
  ],
  expected_behavior: "El botón 'Registrar' debería habilitarse",
  actual_behavior: "El botón permanece deshabilitado",
  evidence_files: [...],  // Heredado de test execution
  reported_by: "qa@example.com"
}
```

**4.2 Trazabilidad**
```
Bug BUG-001
├─ Originado en: Test Case TC-001
├─ Relacionado con: User Story US-001
├─ Evidencias: 3 archivos (screenshots + network log)
└─ Status History:
   ├─ NEW (2025-11-18 14:35) by qa@example.com
   ├─ ASSIGNED (2025-11-18 15:00) to dev@example.com
   ├─ IN_PROGRESS (2025-11-18 16:00)
   ├─ FIXED (2025-11-19 10:00)
   ├─ TESTING (2025-11-19 11:00) by qa@example.com
   └─ VERIFIED (2025-11-19 11:30) by qa@example.com
```

**4.3 Re-test After Bug Fix**
```
Bug BUG-001 → Status: FIXED
↓
Notification to QA: "Bug BUG-001 marked as FIXED, ready for re-test"
↓
QA re-runs Test Case TC-001
↓
If PASSED:
  - Update bug status → VERIFIED
  - Update test execution → PASSED
  - Increment test pass count
If FAILED:
  - Reopen bug → REOPENED
  - Add comment: "Still failing after fix"
  - Link new execution to bug
```

**✅ LO QUE EXISTE EN BD:**
- Tabla `bug_reports` completa
- Relaciones: project_id, user_story_id, test_case_id
- Status workflow: NEW → ASSIGNED → IN_PROGRESS → FIXED → TESTING → VERIFIED

**❌ LO QUE FALTA:**
- **BugsPage UI** → Lista de bugs, filtros, CRUD
- **BugFormModal** → Create/Edit bug
- **Auto-fill desde test failed** → Link bug ↔ test automático
- **Notification system** → Avisar cuando bug cambia de estado
- **Bug assignment** → Asignar bugs a developers
- **Re-test workflow** → Flujo de verificación post-fix
- **Bug analytics** → Bugs por severity, por component, por tester

---

#### **FASE 5: Generar Reportes** ⚠️ PARCIAL (Backend existe, Frontend placeholder)

**Estado Ideal:**
```
Sprint terminó → QA genera Test Plan → Ejecuta todos los tests → Genera Execution Report → Presenta a stakeholders
```

**Flujo Esperado:**

**5.1 Test Plan (Pre-Execution)**
```
ReportsPage → Select "Test Plan"
↓
Configure:
- Format: PDF | DOCX | Both
- Include: All tests | Only critical | By test type
- Group by: User Story | Test Type | Priority
↓
Generate → POST /generate-test-plan?project_id=PROJ-001&format=pdf
↓
Download: test_plan_PROJ-001_2025-11-18.pdf
```

**Contenido del Test Plan:**
```
1. Project Overview
   - Name, Client, Team, Dates
   - Scope: 15 user stories, 45 test cases

2. Test Strategy
   - Test types: Functional (60%), UI (20%), API (20%)
   - Test approach: Manual + Automated
   - Entry/Exit criteria

3. Test Cases by User Story
   US-001: User Login
   ├─ TC-001: Valid credentials (FUNCTIONAL, HIGH)
   ├─ TC-002: Invalid email (FUNCTIONAL, MEDIUM)
   └─ TC-003: Missing password (FUNCTIONAL, HIGH)

4. Test Environment
   - QA: qa.example.com
   - Staging: staging.example.com
   - Production: prod.example.com

5. Schedule
   - Test planning: Nov 1-5
   - Test execution: Nov 6-15
   - Bug fixing: Nov 16-20
   - Re-testing: Nov 21-22
```

**5.2 Execution Report (Post-Execution)**
```
ReportsPage → Select "Execution Report"
↓
Configure:
- Date range: Nov 6 - Nov 15
- Include: Test results + Bug summary + Metrics
- Format: PDF | DOCX | HTML
↓
Generate → POST /generate-execution-report?project_id=PROJ-001
↓
Download: execution_report_PROJ-001_2025-11-18.pdf
```

**Contenido del Execution Report:**
```
1. Executive Summary
   - Total tests: 45
   - Passed: 38 (84%)
   - Failed: 5 (11%)
   - Blocked: 2 (5%)
   - Not Run: 0 (0%)

2. Test Execution Metrics
   - Total execution time: 180 minutes
   - Average test time: 4 minutes
   - Tests per day: 9
   - Pass rate trend: [Chart]

3. Failed Tests
   TC-001: User Login → FAILED (Nov 10, 14:30)
   - Reason: Button not enabled
   - Bug: BUG-001 (FIXED)
   - Re-test: PASSED (Nov 12)

4. Bug Summary
   - Total bugs: 7
   - Critical: 1, High: 3, Medium: 2, Low: 1
   - Fixed: 6, Pending: 1
   - Bug fix rate: 86%

5. Test Coverage
   - User stories covered: 15/15 (100%)
   - Test types: Functional (100%), UI (80%), API (60%)
   - Critical paths: All covered

6. Recommendations
   - API tests need improvement (60% coverage)
   - 1 critical bug pending fix (BUG-003)
   - Consider automation for regression tests
```

**✅ LO QUE EXISTE:**
- Endpoint: `POST /generate-test-plan`
- Generator: `test_plan_generator.py`
- Formatos: PDF, DOCX

**❌ LO QUE FALTA:**
- **ReportsPage UI** → Select tipo de reporte, configurar, download
- **Execution Report** → Nuevo tipo de reporte post-ejecución
- **Metrics calculation** → Pass rate, avg time, trends
- **Charts/Graphs** → Visualización de métricas
- **Custom templates** → Plantillas personalizables por cliente
- **Scheduled reports** → Auto-generar reportes semanales/mensuales
- **Email reports** → Enviar reportes automáticamente a stakeholders

---

#### **FASE 6: Seguimiento y Métricas** ❌ NO IMPLEMENTADO

**Estado Ideal:**
```
Dashboard en tiempo real → Métricas de progreso → Alerts automáticas → Retrospectiva
```

**Flujo Esperado:**

**6.1 Dashboard Real-Time**
```
DashboardPage (mejorado)
├─ Test Execution Progress
│  ├─ Total: 45 tests
│  ├─ Executed: 38 (84%)
│  ├─ Pending: 7 (16%)
│  └─ Progress bar: [████████░░] 84%
│
├─ Pass Rate (Today/Week/Sprint)
│  ├─ Today: 12/15 tests → 80%
│  ├─ This week: 38/45 tests → 84%
│  └─ Trend: ↗ +4% vs last week
│
├─ Bug Status
│  ├─ Open: 3 (1 critical, 2 high)
│  ├─ In Progress: 2
│  ├─ Fixed: 6
│  ├─ Verified: 5
│  └─ Avg fix time: 1.2 days
│
├─ Test Coverage by Type
│  ├─ Functional: 100% (30/30)
│  ├─ UI: 80% (8/10)
│  └─ API: 60% (3/5)
│
├─ Critical Alerts
│  ├─ ⚠️ 1 critical bug pending (BUG-003)
│  ├─ ⚠️ 7 tests not executed yet
│  └─ ✅ All critical paths tested
│
└─ Team Performance
   ├─ qa@example.com: 25 tests, 92% pass rate
   └─ qa2@example.com: 13 tests, 76% pass rate
```

**6.2 Métricas Calculadas**

**Test Coverage:**
```python
# Coverage = (Test cases ejecutados / Total test cases) * 100
coverage = (executed_tests / total_tests) * 100

# Por tipo:
functional_coverage = (functional_executed / functional_total) * 100

# Por user story:
story_coverage = (stories_with_tests / total_stories) * 100

# Por acceptance criteria:
criteria_coverage = (criteria_tested / total_criteria) * 100
```

**Pass Rate:**
```python
# Pass rate = (Tests PASSED / Tests ejecutados) * 100
pass_rate = (passed_tests / executed_tests) * 100

# Trend:
if pass_rate_today > pass_rate_yesterday:
    trend = "↗ Improving"
else:
    trend = "↘ Declining"
```

**Defect Density:**
```python
# Bugs per user story
defect_density = total_bugs / total_user_stories

# Bugs per test case
bug_ratio = total_bugs / total_test_cases
```

**Average Time:**
```python
# Avg test execution time
avg_test_time = sum(execution_times) / total_executions

# Avg bug fix time
avg_fix_time = sum(fix_times) / total_bugs_fixed
```

**6.3 Alerts Automáticas**
```
Sistema de notificaciones:
├─ ⚠️ Critical bug reported → Email to dev lead
├─ ✅ All tests passed → Slack notification
├─ ⚠️ Pass rate dropped below 80% → Alert to QA lead
├─ ⚠️ Test not executed for 3 days → Reminder to assigned QA
└─ ✅ Sprint testing complete → Email report to PM
```

**✅ LO QUE EXISTE:**
- Endpoint: `GET /projects/{id}/stats`
- Campos básicos: total_user_stories, total_test_cases, total_bugs

**❌ LO QUE FALTA:**
- **Dashboard charts** → Gráficos de tendencias
- **Real-time updates** → WebSocket o polling para actualizar métricas
- **Advanced metrics** → Coverage by type, pass rate trends, defect density
- **Alerts system** → Notifications automáticas
- **Team performance** → Métricas por tester
- **Exportar métricas** → CSV, Excel para análisis externo

---

## 2. ACCEPTANCE CRITERIA CHECKBOXES

### 🎯 Diseño Propuesto

**Problema Actual:**
Los checkboxes son decorativos (solo muestran `completed: false` del Excel)

**Solución:**

**2.1 Backend API**
```python
# PUT /user-stories/{story_id}/criteria/{criteria_id}
{
  "completed": true
}

# Response:
{
  "story_id": "US-001",
  "criteria_id": "AC-2",
  "completed": true,
  "completed_by": "qa@example.com",
  "completed_date": "2025-11-18T15:00:00",
  "total_criteria": 3,
  "completed_criteria": 2,
  "completion_percentage": 66.7
}
```

**2.2 Frontend UI**
```typescript
// StoryTable.tsx - Fila expandida
{row.original.acceptance_criteria.map((criterion, index) => (
  <li key={criterion.id || index} className="flex items-start gap-2">
    <input
      type="checkbox"
      checked={criterion.completed}
      onChange={() => handleToggleCriteria(row.original.id, criterion.id)}
      className="cursor-pointer"
    />
    <span className={criterion.completed ? 'text-gray-500 line-through' : ''}>
      {criterion.description}
    </span>
    {criterion.completed && (
      <span className="text-xs text-gray-400">
        ✅ {criterion.completed_by} • {formatDate(criterion.completed_date)}
      </span>
    )}
  </li>
))}
```

**2.3 Para Qué Sirve**

**Caso de Uso 1: Tracking de Desarrollo**
```
Developer implementa feature → QA verifica cada criterio → Marca como completado
US-001: User Login
├─ ✅ AC-1: Email validation → Completed by qa@example.com (Nov 10)
├─ ✅ AC-2: Password validation → Completed by qa@example.com (Nov 10)
└─ ⬜ AC-3: Redirect to dashboard → Pending (dev still working)

Progress: 66% → PM sabe que falta implementar 1 criterio
```

**Caso de Uso 2: Re-testing**
```
Bug fix deployed → QA desmarca criterios afectados → Re-verifica → Re-marca
BUG-001 fixed: Button not enabled
↓
Afecta AC-2: Password validation
↓
QA desmarca AC-2 → Re-testa → Re-marca si OK
```

**Caso de Uso 3: Acceptance Testing**
```
Sprint Review → PM/PO revisa criterios → Marca "Accepted" si cumple DoD
US-001: User Login
├─ ✅ AC-1: Validated by QA (Nov 10)
├─ ✅ AC-2: Validated by QA (Nov 10)
└─ ✅ AC-3: Validated by QA (Nov 12)
↓
Progress: 100% → Story DONE
```

---

## 3. TEST CASES - EJECUCIÓN

### 🎯 Diseño Propuesto: Desplegar Filas

**Problema Actual:**
No se pueden ver detalles de test cases en la tabla, hay que abrir modal

**Solución: Expandable Rows + Execution Tracking**

**3.1 UI Design**
```
TestCasesPage - Tabla de test suites (agrupados por user story)

┌─────────────────────────────────────────────────────────────────┐
│ US-001: User Login                           3 tests | 2/3 ✅  │
│ ▼ Expand to see test cases                                      │
├─────────────────────────────────────────────────────────────────┤
│   ID    │ Title              │ Type  │ Status  │ Last Run │ ⚙️  │
├─────────┼────────────────────┼───────┼─────────┼──────────┼─────┤
│ > TC-001│ Valid credentials  │ FUNC  │ PASSED  │ Nov 15   │ ... │
│ > TC-002│ Invalid email      │ FUNC  │ FAILED  │ Nov 14   │ ... │
│ > TC-003│ Missing password   │ FUNC  │ NOT_RUN │ -        │ ... │
└─────────────────────────────────────────────────────────────────┘

Click en chevron ">" de TC-001:
┌─────────────────────────────────────────────────────────────────┐
│ ▼ TC-001: Verify login with valid credentials                   │
├─────────────────────────────────────────────────────────────────┤
│ Type: FUNCTIONAL | Priority: HIGH | Automated: No              │
│                                                                 │
│ 📄 Gherkin Scenario:                                            │
│   @smoke @regression @positive @happy_path                      │
│   Scenario: Valid credentials                                   │
│     Given estoy en la página 'Login'                           │
│     When ingreso 'user@example.com' en el campo 'Email'        │
│     And ingreso 'Pass123!' en el campo 'Password'              │
│     And hago clic en el botón 'Iniciar Sesión'                │
│     Then debería ser redirigido al '/dashboard'                │
│     And debería ver el mensaje 'Bienvenido'                    │
│                                                                 │
│ 📊 Execution History (3):                                       │
│   #3 Nov 15, 14:30 → PASSED by qa@example.com (4 min)         │
│   #2 Nov 14, 10:15 → FAILED by qa@example.com (5 min)         │
│   #1 Nov 13, 16:00 → PASSED by qa@example.com (4 min)         │
│                                                                 │
│ 🔗 Related:                                                     │
│   User Story: US-001 - User Login                              │
│   Bugs: BUG-001 (VERIFIED), BUG-005 (OPEN)                    │
│                                                                 │
│ ⚙️ Actions:                                                     │
│   [▶ Run Test] [✏️ Edit] [👁️ View Gherkin] [🗑️ Delete]      │
└─────────────────────────────────────────────────────────────────┘
```

**3.2 Execution Modal (Cuando click "Run Test")**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🧪 Execute Test: TC-001                                         │
│ Valid credentials                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Execution Info:                                                 │
│   Tester: qa@example.com (auto-filled)                         │
│   Start Time: Nov 18, 2025 15:30:00 ⏱️ 00:03:24 (running)     │
│   Environment: [QA ▼] Browser: [Chrome 120 ▼]                  │
│                                                                 │
│ Test Steps:                                                     │
│                                                                 │
│   Given:                                                        │
│   ☑️ estoy en la página 'Login'                                │
│                                                                 │
│   When:                                                         │
│   ☑️ ingreso 'user@example.com' en el campo 'Email'            │
│   ☑️ ingreso 'Pass123!' en el campo 'Password'                 │
│   ☑️ hago clic en el botón 'Iniciar Sesión'                   │
│                                                                 │
│   Then:                                                         │
│   ☑️ debería ser redirigido al '/dashboard'                    │
│   ❌ debería ver el mensaje 'Bienvenido'                       │
│      ↳ [Upload Evidence] screenshot_error.png ✅ uploaded      │
│                                                                 │
│   Progress: 5/6 steps passed (83%)                             │
│                                                                 │
│ Final Status: [FAILED ▼]                                        │
│                                                                 │
│ Failure Reason:                                                 │
│   ┌───────────────────────────────────────────────────────┐   │
│   │ El mensaje 'Bienvenido' no apareció. En su lugar     │   │
│   │ se mostró 'Acceso denegado'.                          │   │
│   └───────────────────────────────────────────────────────┘   │
│                                                                 │
│ Execution Notes:                                                │
│   ┌───────────────────────────────────────────────────────┐   │
│   │ Posible problema con permisos de usuario. El login   │   │
│   │ funciona pero el redirect falla. Verificar roles.    │   │
│   └───────────────────────────────────────────────────────┘   │
│                                                                 │
│ Evidence Files:                                                 │
│   📎 screenshot_error.png (2.3 MB) [View] [Delete]             │
│   📎 network_log.har (1.1 MB) [View] [Delete]                  │
│   [+ Upload More Files]                                         │
│                                                                 │
│ Actions:                                                        │
│   [🐛 Report Bug] [💾 Save Execution] [❌ Cancel]             │
└─────────────────────────────────────────────────────────────────┘
```

**3.3 Backend API para Execution**
```python
# POST /test-executions
{
  "test_case_id": "TC-001",
  "executed_by": "qa@example.com",
  "execution_date": "2025-11-18T15:30:00",
  "status": "FAILED",
  "execution_time_minutes": 5,
  "passed_steps": 5,
  "failed_steps": 1,
  "total_steps": 6,
  "environment": "QA",
  "browser": "Chrome 120",
  "os": "Windows 11",
  "notes": "Posible problema con permisos de usuario...",
  "failure_reason": "El mensaje 'Bienvenido' no apareció...",
  "evidence_files": ["screenshot_error.png", "network_log.har"]
}

# GET /test-cases/{id}/executions
# Retorna historial de ejecuciones

# PUT /test-executions/{id}
# Actualizar ejecución (ej: agregar bug_id después de reportar)
```

---

## 4. TEST COVERAGE

### 🎯 Cálculo y Utilidad

**Definición:**
Test Coverage mide qué tan bien están probadas las funcionalidades del sistema.

**4.1 Tipos de Coverage**

**A) User Story Coverage**
```python
# ¿Cuántas user stories tienen al menos 1 test case?
story_coverage = (stories_with_tests / total_stories) * 100

# Ejemplo:
# Total stories: 15
# Stories con tests: 14
# Coverage: 93%
```

**Utilidad:**
- Identificar stories sin tests (riesgo alto)
- Priorizar creación de tests para stories críticas
- Reportar a PM: "Nos falta testear 1 user story"

**B) Acceptance Criteria Coverage**
```python
# ¿Cuántos criterios de aceptación tienen tests que los validan?
criteria_coverage = (criteria_tested / total_criteria) * 100

# Ejemplo:
# Total criteria: 45 (de 15 stories, 3 criteria cada una)
# Criteria con tests: 40
# Coverage: 89%
```

**Utilidad:**
- Identificar criterios sin tests (gaps en testing)
- Validar que cada criterio tiene al menos 1 test asociado
- Reportar calidad: "89% de criterios están probados"

**C) Test Type Coverage**
```python
# ¿Qué % de cada tipo de test tenemos?
functional_coverage = (functional_tests_executed / total_functional_tests) * 100
ui_coverage = (ui_tests_executed / total_ui_tests) * 100
api_coverage = (api_tests_executed / total_api_tests) * 100

# Ejemplo:
# Functional: 30/30 = 100%
# UI: 8/10 = 80%
# API: 3/5 = 60%
```

**Utilidad:**
- Identificar qué tipos de test necesitan más atención
- Balancear estrategia de testing
- Reportar gaps: "Solo 60% de API tests ejecutados"

**D) Execution Coverage**
```python
# ¿Qué % de tests están ejecutados?
execution_coverage = (executed_tests / total_tests) * 100

# Ejemplo:
# Total tests: 45
# Executed: 38
# Coverage: 84%
```

**Utilidad:**
- Tracking de progreso de testing
- Identificar tests pendientes
- Deadline management: "Nos faltan 7 tests para completar sprint"

**4.2 Visualización en Dashboard**
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Test Coverage Overview                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Overall Coverage: 87% [████████░░] Good                     │
│                                                             │
│ By Dimension:                                               │
│   User Stories:    93% [█████████░] 14/15 stories tested   │
│   Criteria:        89% [████████░░] 40/45 criteria tested  │
│   Execution:       84% [████████░░] 38/45 tests run        │
│                                                             │
│ By Test Type:                                               │
│   Functional: 100% [██████████] 30/30 ✅                   │
│   UI:          80% [████████░░]  8/10 ⚠️                   │
│   API:         60% [██████░░░░]  3/5  ⚠️ Needs attention   │
│                                                             │
│ By Priority:                                                │
│   Critical:   100% [██████████] 10/10 ✅                   │
│   High:        90% [█████████░] 18/20 ✅                   │
│   Medium:      70% [███████░░░]  7/10 ⚠️                   │
│   Low:         60% [██████░░░░]  3/5  ⚠️                   │
│                                                             │
│ Gaps Identified:                                            │
│   ⚠️ US-015: "Payment Processing" has 0 tests              │
│   ⚠️ 5 acceptance criteria without tests                    │
│   ⚠️ API coverage below target (60% vs 80% goal)            │
│                                                             │
│ Recommendation:                                             │
│   Create 5 API tests to reach 80% coverage                 │
│   Add tests for US-015 (critical for release)              │
└─────────────────────────────────────────────────────────────┘
```

**4.3 Backend Calculation**
```python
# GET /projects/{id}/coverage
def calculate_coverage(project_id):
    # User Story Coverage
    total_stories = db.query(UserStoryDB).filter(
        UserStoryDB.project_id == project_id
    ).count()

    stories_with_tests = db.query(UserStoryDB).filter(
        UserStoryDB.project_id == project_id,
        UserStoryDB.test_cases.any()  # Has at least 1 test
    ).count()

    story_coverage = (stories_with_tests / total_stories * 100) if total_stories > 0 else 0

    # Acceptance Criteria Coverage
    total_criteria = db.query(func.sum(UserStoryDB.total_criteria)).filter(
        UserStoryDB.project_id == project_id
    ).scalar() or 0

    # Criteria tested = criteria de stories que tienen tests
    criteria_tested = db.query(func.sum(UserStoryDB.total_criteria)).filter(
        UserStoryDB.project_id == project_id,
        UserStoryDB.test_cases.any()
    ).scalar() or 0

    criteria_coverage = (criteria_tested / total_criteria * 100) if total_criteria > 0 else 0

    # Test Type Coverage
    test_type_coverage = {}
    for test_type in TestType:
        total_type = db.query(TestCaseDB).filter(
            TestCaseDB.project_id == project_id,
            TestCaseDB.test_type == test_type
        ).count()

        executed_type = db.query(TestCaseDB).filter(
            TestCaseDB.project_id == project_id,
            TestCaseDB.test_type == test_type,
            TestCaseDB.status.in_([TestStatus.PASSED, TestStatus.FAILED])
        ).count()

        test_type_coverage[test_type.value] = (executed_type / total_type * 100) if total_type > 0 else 0

    # Overall Coverage (weighted average)
    overall_coverage = (story_coverage + criteria_coverage + execution_coverage) / 3

    return {
        "overall_coverage": overall_coverage,
        "story_coverage": story_coverage,
        "criteria_coverage": criteria_coverage,
        "execution_coverage": execution_coverage,
        "test_type_coverage": test_type_coverage,
        "gaps": identify_gaps(project_id)
    }
```

---

## 5. BUG TRACKING

### 🎯 Relación Test Cases ↔ Bugs

**5.1 Trazabilidad**
```
User Story US-001
├─ Test Case TC-001
│  ├─ Execution #1: FAILED (Nov 10)
│  │  └─ Bug BUG-001: Button not enabled
│  ├─ Execution #2: PASSED (Nov 12) [after fix]
│  └─ Execution #3: FAILED (Nov 15)
│     └─ Bug BUG-005: Redirect URL wrong
└─ Test Case TC-002
   └─ Execution #1: FAILED (Nov 11)
      └─ Bug BUG-002: Email validation missing
```

**5.2 Lifecycle del Bug**
```
1. Test FAILED
   ├─ QA identifica bug durante ejecución
   └─ Click "Report Bug" en TestExecutionModal

2. Bug Creation
   ├─ BugFormModal pre-filled con datos del test
   ├─ QA completa: severity, priority, steps, evidences
   ├─ Save → POST /bugs
   └─ Auto-link: bug.test_case_id = "TC-001"

3. Bug Assignment
   ├─ Dev Lead asigna bug a developer
   ├─ Status: NEW → ASSIGNED
   └─ Notification: "Bug BUG-001 assigned to you"

4. Bug Fix
   ├─ Developer trabaja en fix
   ├─ Status: ASSIGNED → IN_PROGRESS
   ├─ Developer marca: FIXED
   └─ Notification to QA: "BUG-001 ready for re-test"

5. Re-testing
   ├─ QA re-ejecuta Test Case TC-001
   ├─ Si PASSED:
   │  ├─ Update bug status → VERIFIED
   │  ├─ Update test execution → PASSED
   │  └─ Link execution to bug
   └─ Si FAILED:
      ├─ Reopen bug → REOPENED
      ├─ Add comment: "Still failing, see execution #3"
      └─ Back to step 3

6. Closure
   ├─ All re-tests PASSED
   ├─ QA marca bug → VERIFIED
   ├─ Dev Lead cierra bug → CLOSED
   └─ Metrics updated: bug fix time, re-open count
```

**5.3 Backend API**
```python
# POST /bugs (Create from test)
{
  "title": "[TC-001] Button not enabled after completing form",
  "test_case_id": "TC-001",
  "user_story_id": "US-001",
  "severity": "HIGH",
  "priority": "HIGH",
  "bug_type": "UI",
  "status": "NEW",
  "environment": "QA",
  "browser": "Chrome 120",
  "os": "Windows 11",
  "version": "1.0.0",
  "steps_to_reproduce": [
    "Given estoy en la página 'Formulario - Trial'",
    "When completo todos los campos obligatorios",
    "Then el botón 'Registrar' NO se habilita (expected: enabled)"
  ],
  "expected_behavior": "El botón 'Registrar' debería habilitarse",
  "actual_behavior": "El botón permanece deshabilitado",
  "reported_by": "qa@example.com",
  "reported_date": "2025-11-18T15:35:00",
  "evidence_files": ["screenshot_error.png", "network_log.har"]
}

# PUT /bugs/{bug_id}/assign
{
  "assigned_to": "dev@example.com",
  "status": "ASSIGNED"
}

# PUT /bugs/{bug_id}/status
{
  "status": "FIXED",
  "fixed_date": "2025-11-19T10:00:00",
  "fix_notes": "Fixed button enable logic in FormValidator.js"
}

# POST /bugs/{bug_id}/retest
{
  "test_execution_id": "exec-123",
  "status": "VERIFIED" | "REOPENED",
  "verified_by": "qa@example.com",
  "verified_date": "2025-11-19T11:30:00",
  "verification_notes": "Re-tested successfully, all steps pass"
}

# GET /test-cases/{id}/bugs
# Retorna todos los bugs relacionados con un test case

# GET /bugs/{bug_id}/related-tests
# Retorna test cases que encontraron este bug
```

---

## 6. EVIDENCIAS

### 🎯 Upload y Storage

**6.1 Tipos de Evidencias**
```
- Screenshots (.png, .jpg)
- Videos (.mp4, .webm)
- Network logs (.har, .txt)
- Console logs (.txt, .log)
- API responses (.json, .xml)
- Database queries (.sql)
```

**6.2 Upload Flow**
```
TestExecutionModal o BugFormModal
├─ Drag & drop area
├─ Click "Upload Files"
├─ Select multiple files (Cmd/Ctrl + click)
├─ Preview thumbnails (for images)
├─ Upload progress bar
└─ Store in server

Storage path:
/uploads/{project_id}/evidences/{entity_type}/{entity_id}/
  ├─ test_executions/
  │  └─ exec-123/
  │     ├─ screenshot_1.png
  │     └─ network_log.har
  └─ bugs/
     └─ BUG-001/
        ├─ bug_evidence_1.png
        └─ console_log.txt
```

**6.3 Backend API**
```python
# POST /upload-evidence
# Multipart form data
{
  "entity_type": "test_execution" | "bug",
  "entity_id": "exec-123" | "BUG-001",
  "files": [File, File, ...],
  "uploaded_by": "qa@example.com"
}

# Response:
{
  "uploaded_files": [
    {
      "id": "file-1",
      "filename": "screenshot_error.png",
      "size": 2345678,
      "url": "/api/v1/files/file-1",
      "thumbnail_url": "/api/v1/files/file-1/thumbnail",
      "uploaded_date": "2025-11-18T15:35:00"
    }
  ]
}

# GET /files/{file_id}
# Download file

# GET /files/{file_id}/thumbnail
# Get thumbnail (for images/videos)

# DELETE /files/{file_id}
# Delete evidence file
```

**6.4 Frontend UI**
```typescript
// EvidenceUpload Component
<div className="evidence-upload">
  <div
    className="dropzone"
    onDrop={handleDrop}
    onDragOver={handleDragOver}
  >
    {isDragging ? (
      <p>📎 Drop files here...</p>
    ) : (
      <>
        <Upload className="w-12 h-12 text-gray-400" />
        <p>Drag & drop files or click to browse</p>
        <p className="text-xs text-gray-500">
          Max 10MB per file. Supported: images, videos, logs
        </p>
      </>
    )}
    <input
      type="file"
      multiple
      accept="image/*,video/*,.har,.log,.txt,.json"
      onChange={handleFileSelect}
      hidden
    />
  </div>

  {/* Uploaded files */}
  <div className="uploaded-files">
    {files.map(file => (
      <div key={file.id} className="file-item">
        {file.type.startsWith('image/') && (
          <img src={file.thumbnail_url} alt={file.filename} />
        )}
        <div className="file-info">
          <p>{file.filename}</p>
          <p className="text-xs">{formatFileSize(file.size)}</p>
        </div>
        <button onClick={() => handleDelete(file.id)}>
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
</div>
```

---

## 7. REPORTES

### 🎯 Generación y Distribución

**7.1 Tipos de Reportes**

**A) Test Plan (Pre-Execution)**
- ✅ Ya implementado en backend
- ❌ Falta UI en ReportsPage

**B) Execution Summary Report (Post-Execution)**
```
Contenido:
├─ Executive Summary
│  ├─ Pass rate
│  ├─ Total tests executed
│  └─ Critical bugs found
├─ Test Results by Story
├─ Failed Tests Details
├─ Bug Summary
└─ Recommendations
```

**C) Bug Report (Por Bug)**
- ✅ Ya se genera documento markdown en backend
- ❌ Falta generar PDF/DOCX

**D) Metrics Dashboard Report (Weekly/Monthly)**
```
Contenido:
├─ Coverage trends
├─ Pass rate trends
├─ Bug trends
├─ Team performance
└─ Comparison vs previous period
```

**7.2 ReportsPage UI**
```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Test Reports                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Generate New Report:                                        │
│                                                             │
│   Report Type: [Test Plan ▼]                               │
│                                                             │
│   Configuration:                                            │
│     Format: ☑️ PDF  ☑️ DOCX  ☐ HTML                        │
│     Include: ☑️ All test cases                             │
│              ☐ Only critical                               │
│              ☐ Only executed                               │
│     Group by: [User Story ▼]                               │
│                                                             │
│   [Generate Report]                                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Recent Reports:                                             │
│                                                             │
│   Test Plan - PROJ-001                     Nov 18, 15:00   │
│   📄 test_plan_PROJ-001_20251118.pdf (2.3 MB)             │
│   [📥 Download] [🗑️ Delete]                               │
│                                                             │
│   Execution Report - Sprint 3              Nov 15, 17:30   │
│   📄 execution_report_sprint3.pdf (1.8 MB)                │
│   [📥 Download] [🗑️ Delete]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**7.3 Auto-Generated Reports**
```python
# Scheduled report generation
# Cron job: Every Friday at 5pm
def generate_weekly_report(project_id):
    report = {
        "type": "weekly_summary",
        "project_id": project_id,
        "week": "2025-W47",
        "generated_date": datetime.now(),
        "data": {
            "tests_executed": 45,
            "pass_rate": 84,
            "bugs_found": 7,
            "bugs_fixed": 6
        }
    }

    # Generate PDF
    pdf_path = generate_pdf(report)

    # Email to stakeholders
    send_email(
        to=project.team_members,
        subject=f"Weekly Test Report - {project.name}",
        body="Please find attached the weekly test report",
        attachment=pdf_path
    )
```

---

## 8. SEGUIMIENTO

### 🎯 Dashboards y Métricas

**8.1 Dashboard Mejorado**
```
Ya existe DashboardPage básico
Necesita agregar:
├─ Charts (pass rate trend, bug trend)
├─ Real-time updates
├─ Alerts system
├─ Team performance
└─ Sprint progress
```

**8.2 Notifications System**
```
Tipos de notificaciones:
├─ In-App Notifications
│  ├─ Bell icon con badge count
│  ├─ Dropdown list de notificaciones
│  └─ Mark as read
├─ Email Notifications
│  ├─ Bug assigned to you
│  ├─ Bug status changed
│  ├─ Test execution failed
│  └─ Weekly report
└─ Slack/Teams Integration (futuro)
```

**8.3 Activity Log**
```
Audit trail de todas las acciones:
├─ qa@example.com executed TC-001 → FAILED (Nov 18, 15:30)
├─ qa@example.com created BUG-001 (Nov 18, 15:35)
├─ dev@example.com marked BUG-001 as FIXED (Nov 19, 10:00)
├─ qa@example.com verified BUG-001 → VERIFIED (Nov 19, 11:30)
└─ pm@example.com generated test plan (Nov 18, 16:00)

Utilidad:
- Auditoría
- Compliance
- Retrospectivas
- Identificar cuellos de botella
```

---

## 9. FEATURES FALTANTES - GAP ANALYSIS COMPLETO

### 🚨 CRÍTICO (Sin esto no se puede completar un ciclo QA)

1. **Test Execution UI** ❌
   - Modal para ejecutar tests step-by-step
   - Timer automático
   - Upload evidencias durante ejecución
   - Save execution results
   - Backend: ✅ (tabla test_executions existe)
   - Frontend: ❌ (no implementado)

2. **BugsPage** ❌
   - Lista de bugs con filtros
   - BugFormModal (create/edit)
   - Link bugs ↔ tests
   - Bug lifecycle (NEW → VERIFIED)
   - Backend: ✅ (completo)
   - Frontend: ❌ (placeholder)

3. **Acceptance Criteria Toggle** ❌
   - Checkboxes funcionales (no decorativos)
   - Tracking de progreso de desarrollo
   - Backend: ❌ (falta endpoint PUT)
   - Frontend: ❌ (checkboxes disabled)

### ⚠️ ALTA PRIORIDAD (Mejora significativa del flujo)

4. **Evidence Upload** ❌
   - Upload screenshots/videos/logs
   - Storage system
   - Thumbnails para imágenes
   - Link evidencias a executions/bugs
   - Backend: ❌ (no implementado)
   - Frontend: ❌ (no implementado)

5. **ReportsPage** ❌
   - UI para generar reportes
   - Config: formato, filtros, grouping
   - Lista de reportes históricos
   - Download links
   - Backend: ✅ (test plan generator existe)
   - Frontend: ❌ (placeholder)

6. **Coverage Metrics** ❌
   - Calculation de diferentes tipos de coverage
   - Visualización en dashboard
   - Identification de gaps
   - Backend: ❌ (falta endpoint /coverage)
   - Frontend: ❌ (no implementado)

### 📊 MEDIA PRIORIDAD (Features avanzados)

7. **Test Assignment** ❌
   - Asignar tests a testers específicos
   - Workload balancing
   - Backend: ✅ (campo assigned_to existe)
   - Frontend: ❌ (no se puede asignar)

8. **Notifications System** ❌
   - In-app notifications
   - Email notifications
   - Alerts automáticas
   - Backend: ❌
   - Frontend: ❌

9. **Activity Log** ❌
   - Audit trail completo
   - Timeline de eventos
   - Backend: ❌
   - Frontend: ❌

10. **Charts & Graphs** ❌
    - Pass rate trend
    - Bug trend
    - Coverage over time
    - Team performance
    - Backend: ✅ (datos existen)
    - Frontend: ❌ (no visualización)

### 🔮 BAJA PRIORIDAD (Nice to have)

11. **Test Templates** ❌
    - Guardar tests como templates
    - Reusar templates
    - Template library

12. **Bulk Operations** ❌
    - Ejecutar múltiples tests en batch
    - Asignar múltiples tests
    - Cambiar status de múltiples tests

13. **Integration con Tools Externos** ❌
    - Notion sync (campos existen en BD)
    - Azure DevOps sync (campos existen en BD)
    - JIRA integration
    - Slack/Teams notifications

14. **Automated Test Generation** ❌
    - Generar código de automation desde Gherkin
    - Playwright/Cypress code generation

15. **AI Assistant** ❌
    - Chatbot para responder preguntas sobre tests
    - Sugerir mejoras a tests
    - Detectar tests duplicados

---

## 10. ROADMAP DE IMPLEMENTACIÓN

### 🗓️ Sprint 1 (Semana 1-2): MVP Execution

**Objetivo**: Poder ejecutar tests y reportar bugs

**Features**:
1. Test Execution UI
   - TestExecutionModal component
   - Step-by-step checkboxes
   - Timer
   - Save execution → POST /test-executions
   - View execution history

2. BugsPage + BugFormModal
   - Lista de bugs con filtros
   - Create/Edit bug
   - Link bug ↔ test
   - Bug status workflow

3. Evidence Upload (básico)
   - Upload files (screenshots)
   - Store in server
   - Display in execution/bug forms

**Entregables**:
- QA puede ejecutar un test completo
- QA puede reportar un bug
- QA puede subir evidencias

---

### 🗓️ Sprint 2 (Semana 3-4): Tracking & Metrics

**Objetivo**: Visibilidad de progreso y métricas

**Features**:
4. Acceptance Criteria Toggle
   - PUT /user-stories/{id}/criteria/{id}
   - Checkboxes funcionales
   - Progress tracking

5. Test Coverage Calculation
   - GET /projects/{id}/coverage
   - Multiple dimensions (story, criteria, type)
   - Visualización en dashboard

6. ReportsPage
   - UI para generar reportes
   - Test plan + Execution report
   - Download PDF/DOCX
   - Lista de reportes históricos

**Entregables**:
- QA puede ver coverage en tiempo real
- QA puede generar reportes ejecutivos
- PM puede ver progreso de testing

---

### 🗓️ Sprint 3 (Semana 5-6): Collaboration & Notifications

**Objetivo**: Trabajo en equipo y comunicación

**Features**:
7. Test Assignment
   - Asignar tests a testers
   - Workload view
   - Filter "My Tests"

8. Notifications System
   - In-app notifications (bell icon)
   - Email notifications
   - Notification preferences

9. Charts & Dashboards
   - Pass rate trend (line chart)
   - Bug severity distribution (bar chart)
   - Coverage by type (donut chart)
   - Team performance table

**Entregables**:
- Múltiples QAs pueden trabajar en paralelo
- Notificaciones automáticas de cambios
- Dashboards visuales para stakeholders

---

### 🗓️ Sprint 4+ (Semana 7+): Advanced Features

**Objetivo**: Optimización y automatización

**Features**:
10. Activity Log & Audit Trail
11. Test Templates
12. Bulk Operations
13. External Integrations (Notion, Azure, JIRA)
14. AI Assistant

---

## 📝 CONCLUSIÓN

**Estado Actual**: Tenemos ~60% del flujo QA implementado

**Lo que funciona muy bien**:
- ✅ Upload user stories con AI
- ✅ Generación de test cases con AI
- ✅ Multi-proyecto
- ✅ Gherkin editor
- ✅ Backend robusto

**Lo que falta para 100%**:
- ❌ Test execution (crítico)
- ❌ Bug tracking UI (crítico)
- ❌ Evidence upload (importante)
- ❌ Reports UI (importante)
- ❌ Coverage metrics (importante)

**Tiempo estimado para MVP completo (Sprint 1+2)**: 3-4 semanas de desarrollo

**Siguientes pasos inmediatos**:
1. Implementar Test Execution UI
2. Implementar BugsPage
3. Implementar Evidence Upload

Con estos 3 features, un QA podrá hacer su trabajo completo end-to-end. 🚀

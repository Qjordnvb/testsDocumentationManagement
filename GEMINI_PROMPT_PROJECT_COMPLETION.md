# 🤖 Prompt para Gemini: Completar Proyecto QA Documentation Management

---

## ROL ASIGNADO

Eres un **Senior QA Architecture Consultant & Full-Stack Developer** con 15+ años de experiencia en:

- **QA Architecture**: Diseño de plataformas de testing end-to-end (Selenium, Cypress, TestRail, qTest, Zephyr)
- **Full-Stack Development**: FastAPI + React + TypeScript + PostgreSQL
- **Test Management**: ISTQB Expert Level, Certified Test Manager
- **Product Management**: Experiencia diseñando herramientas SaaS para equipos QA
- **UX/UI para QA Tools**: Conoces las best practices de interfaces para testers
- **AI Integration**: Implementación de IA para generación de tests (Gemini, GPT-4)

**Tu misión**: Analizar el proyecto actual (testsDocumentationManagement) y proponer el diseño técnico completo de las features faltantes para que cualquier QA profesional pueda ejecutar su flujo de trabajo completo dentro de la herramienta.

---

## CONTEXTO DEL PROYECTO

### 🎯 Qué es testsDocumentationManagement

Una plataforma SaaS multi-proyecto que permite a equipos QA:
1. Importar User Stories desde Excel
2. Generar Test Cases automáticamente con IA (Gemini 2.5 Flash)
3. Ejecutar tests manualmente
4. Reportar bugs
5. Generar reportes ejecutivos
6. Hacer tracking de métricas de testing

**Tech Stack**:
- **Backend**: Python + FastAPI + SQLAlchemy + SQLite + Gemini AI
- **Frontend**: React + TypeScript + TanStack Table + Tailwind CSS
- **Architecture**: Feature-Sliced Design + Entity-based structure

---

## ESTADO ACTUAL DEL PROYECTO

### ✅ LO QUE YA ESTÁ IMPLEMENTADO (60% completo)

#### **Backend - 100% Multi-Proyecto**
```
✅ Projects CRUD (crear, listar, editar, borrar con CASCADE)
✅ User Stories con Acceptance Criteria (AI extraction con Gemini)
✅ Test Cases con Gherkin (generación con IA, batch processing)
✅ Bug Reports (CRUD completo, lifecycle workflow)
✅ Test Executions (tabla en BD, sin UI)
✅ File Upload Excel/CSV (parse automático + AI cleaning)
✅ Test Plan Generator (PDF/DOCX, sin UI)
✅ Multi-proyecto con project_id en todas las entidades
✅ Gemini AI integration (prompt caching, batching, error handling)
```

**Estructura BD (Completa)**:
```sql
projects (id PK, name, description, client, team_members JSON, status, default_test_types JSON, dates...)
  ├─ user_stories (id PK, project_id FK, title, description, acceptance_criteria JSON, total_criteria, completed_criteria, completion_percentage, priority, status, epic, sprint...)
  │   └─ test_cases (id PK, project_id FK, user_story_id FK, title, description, test_type, priority, status, gherkin_file_path, automated, execution times...)
  │       └─ test_executions (id PK, test_case_id FK, executed_by, execution_date, status, execution_time_minutes, passed_steps, failed_steps, total_steps, notes, failure_reason, bug_ids)
  └─ bug_reports (id PK, project_id FK, user_story_id FK, test_case_id FK, title, description, severity, priority, bug_type, status, environment, browser, os, version, reported_by, assigned_to, verified_by, dates...)
```

**Endpoints API (35 endpoints implementados)**:
```
✅ GET/POST/PUT/DELETE /projects
✅ GET /projects/{id}/stats
✅ POST /upload?project_id=X (Excel/CSV con AI extraction)
✅ GET /user-stories?project_id=X
✅ GET /test-cases?project_id=X
✅ POST /generate-test-cases/{story_id}/preview (con IA)
✅ POST /test-cases/batch (batch save)
✅ GET/PUT /test-cases/{id}/gherkin
✅ POST /generate-test-plan?project_id=X&format=pdf
✅ GET/POST/PUT/DELETE /bugs?project_id=X
```

#### **Frontend - 85% Funcional**
```
✅ ProjectsListPage (landing con cards de proyectos)
✅ ProjectContext (localStorage + global state)
✅ DashboardPage (métricas básicas, sin polling)
✅ StoriesPage (tabla con acceptance criteria expandibles)
✅ TestCasesPage (agrupados por user story, filtros, paginación)
✅ GenerateModal → ReviewTestCasesModal (workflow de preview/approve)
✅ GherkinEditor (editar archivos .feature)
✅ CreateProjectModal, TestCaseFormModal
✅ Rutas dinámicas: /projects/:projectId/*
```

**Acceptance Criteria - Cómo Funciona Ahora**:
```typescript
// En StoriesPage, click chevron ">" expande fila
// Muestra lista de acceptance criteria con checkboxes:
✓ El usuario puede ingresar email y password  // completed: true (verde, tachado)
○ El sistema valida las credenciales           // completed: false (gris)
○ Redirect exitoso al dashboard                // completed: false

// PROBLEMA: Los checkboxes son DECORATIVOS (disabled)
// Solo muestran el estado del Excel importado
// NO se pueden clickear para marcar como completados
```

**Test Cases Table - Estado Actual**:
```
TestCasesPage muestra test suites agrupados por user story:

┌──────────────────────────────────────────────────┐
│ US-001: User Login                  3 tests      │ ← Suite header
│   TC-001  Valid credentials  FUNC  PASSED  ...   │ ← Fila de test
│   TC-002  Invalid email      FUNC  FAILED  ...   │
│   TC-003  Missing password   FUNC  NOT_RUN ...   │
└──────────────────────────────────────────────────┘

// PROBLEMA: No se pueden desplegar filas para ver:
// - Detalles del test (Gherkin completo)
// - Historial de ejecuciones
// - Bugs relacionados
// - Evidencias adjuntas
```

**AI Generation - Prompt QA Senior Lead**:
```
- Rol: QA Senior Lead con 10+ años, ISTQB Advanced
- Técnicas: BVA, Equivalence Partitioning, Decision Tables, State Transition
- Análisis en 3 pasos: Análisis profundo → Priorización → Generación
- Distribución: 40% validación, 30% flujo usuario, 30% edge cases
- Prompt caching (24h TTL, reduce costos 75%)
- Batch generation (15 scenarios por request)
- JSON sanitization automático
```

---

### ❌ LO QUE FALTA (40% pendiente) - TU MISIÓN

#### **CRÍTICO - Sin esto NO se puede completar un ciclo QA**

**1. Test Execution UI** ❌
```
ACTUAL: Tabla test_executions existe en BD pero NO HAY UI para ejecutar tests
IDEAL: QA abre test, lee Gherkin, ejecuta step-by-step, marca PASS/FAIL, sube evidencias, guarda resultado

BACKEND EXISTE: ✅
- Tabla test_executions completa
- Campos: test_case_id, executed_by, execution_date, status, passed_steps, failed_steps, notes, failure_reason, bug_ids

FRONTEND FALTA: ❌
- TestExecutionModal component
- Step-by-step checkboxes (marcar cada Given/When/Then como pass/fail)
- Timer automático (medir tiempo de ejecución)
- Upload evidencias (screenshots, videos, logs)
- Save execution → POST /test-executions
- View execution history (lista de ejecuciones pasadas del test)
```

**2. BugsPage + Bug Tracking** ❌
```
ACTUAL: Backend completo, frontend es placeholder "Coming soon..."
IDEAL: QA reporta bug desde test fallido, asigna a dev, dev marca fixed, QA re-testa y verifica

BACKEND EXISTE: ✅
- Tabla bug_reports completa
- Endpoints: GET/POST/PUT/DELETE /bugs
- Lifecycle: NEW → ASSIGNED → IN_PROGRESS → FIXED → TESTING → VERIFIED

FRONTEND FALTA: ❌
- BugsPage con lista de bugs + filtros
- BugFormModal (create/edit)
- Auto-fill desde test failed (link bug ↔ test)
- Bug lifecycle workflow (assign, fix, verify)
- Re-test workflow (cuando bug marca FIXED, QA debe re-ejecutar test)
```

**3. Acceptance Criteria - Checkboxes Funcionales** ❌
```
ACTUAL: Checkboxes son decorativos (disabled)
IDEAL: QA/Dev puede marcar criterios como completados para tracking de progreso

BACKEND FALTA: ❌
- PUT /user-stories/{story_id}/criteria/{criteria_id}
- Actualizar campo completed: true/false
- Recalcular completion_percentage

FRONTEND FALTA: ❌
- Habilitar checkboxes (quitar disabled)
- onClick handler → API call
- Mostrar quién completó y cuándo
- Actualizar barra de progreso en tiempo real
```

---

#### **ALTA PRIORIDAD - Mejora significativa del flujo**

**4. Evidence Upload & Storage** ❌
```
ACTUAL: No hay forma de subir evidencias (screenshots, videos, logs)
IDEAL: QA sube evidencias durante ejecución de test o al reportar bug

BACKEND FALTA: ❌
- POST /upload-evidence (multipart/form-data)
- Storage: /uploads/{project_id}/evidences/{entity_type}/{entity_id}/
- GET /files/{file_id} (download)
- GET /files/{file_id}/thumbnail (para imágenes)
- DELETE /files/{file_id}

FRONTEND FALTA: ❌
- EvidenceUpload component (drag & drop)
- Image thumbnails preview
- File size validation (max 10MB)
- Link evidences a test executions y bugs
```

**5. ReportsPage** ❌
```
ACTUAL: Backend puede generar test plan PDF/DOCX, pero no hay UI
IDEAL: QA genera reportes (test plan pre-ejecución, execution report post-ejecución), configura formato, descarga

BACKEND EXISTE: ✅
- POST /generate-test-plan
- test_plan_generator.py (PDF/DOCX)

BACKEND FALTA: ⚠️
- POST /generate-execution-report (nuevo tipo de reporte)
- Incluir: pass rate, bug summary, metrics, charts

FRONTEND FALTA: ❌
- ReportsPage UI
- Select tipo reporte, configurar filtros
- Lista de reportes históricos
- Download links
```

**6. Test Coverage Calculation** ❌
```
ACTUAL: Campo test_coverage existe en ProjectDB pero es 0.0 (no se calcula)
IDEAL: Dashboard muestra coverage en tiempo real (story coverage, criteria coverage, execution coverage, type coverage)

BACKEND FALTA: ❌
- GET /projects/{id}/coverage
- Calcular:
  * Story coverage: (stories con tests / total stories) * 100
  * Criteria coverage: (criterios testeados / total criterios) * 100
  * Execution coverage: (tests ejecutados / total tests) * 100
  * Type coverage: % por test type (FUNCTIONAL, UI, API...)

FRONTEND FALTA: ❌
- Coverage widgets en Dashboard
- Progress bars por dimensión
- Identificación de gaps (stories sin tests)
```

---

#### **MEDIA PRIORIDAD - Features avanzados**

**7. Test Assignment** ❌
```
BACKEND EXISTE: ✅ Campo assigned_to en test_cases
FRONTEND FALTA: ❌ UI para asignar tests a testers
```

**8. Notifications System** ❌
```
- In-app notifications (bell icon)
- Email notifications
- Alerts automáticas (bug assigned, test failed, etc.)
```

**9. Charts & Dashboards** ❌
```
- Pass rate trend (line chart)
- Bug severity distribution (bar chart)
- Coverage by type (donut chart)
```

**10. Activity Log & Audit Trail** ❌
```
- Timeline de eventos
- Quién hizo qué y cuándo
```

---

## PREGUNTAS ESPECÍFICAS QUE DEBES RESPONDER

### 1. Acceptance Criteria Checkboxes

**Pregunta**: Los criterios de aceptación tienen checkboxes pero no se pueden checkear. ¿Para qué nos serviría poder marcarlos?

**Contexto Actual**:
```typescript
// StoryTable.tsx - Fila expandida (línea 274-295)
{row.original.acceptance_criteria.map((criterion, index) => (
  <li key={criterion.id || index} className="flex items-start gap-2">
    {criterion.completed ? (
      <CheckCircle2 className="w-4 h-4 text-green-600" />  // Decorativo
    ) : (
      <Circle className="w-4 h-4 text-gray-400" />         // Decorativo
    )}
    <span className={criterion.completed ? 'text-gray-500 line-through' : ''}>
      {criterion.description}
    </span>
  </li>
))}
```

**Lo que necesito de ti**:
- Diseñar el flujo completo: ¿Quién marca criterios (QA, Dev, PM)?
- ¿Qué información adicional guardar (completed_by, completed_date)?
- API contract del endpoint PUT
- UI/UX: ¿Mostrar quién completó? ¿Permitir des-marcar?
- Caso de uso: ¿Tracking de desarrollo? ¿Acceptance testing? ¿Re-testing después de bugs?

---

### 2. Test Cases - Desplegar Filas

**Pregunta**: En la tabla de test cases, ¿cómo desplegamos filas para ver detalles y chequear tests?

**Contexto Actual**:
```
Tabla actual muestra:
ID | Title | Type | Status | Last Run | Actions

No se puede expandir para ver:
- Gherkin completo
- Historial de ejecuciones
- Bugs relacionados
- Evidencias
```

**Lo que necesito de ti**:
- Diseño UI de fila expandida (qué mostrar)
- Cómo se ve el historial de ejecuciones (tabla interna, timeline, cards)
- Cómo se muestran bugs relacionados (chips, lista, links)
- Cómo se muestran evidencias (thumbnails, lista)
- ¿Permitir ejecutar test directamente desde fila expandida?

---

### 3. Test Coverage

**Pregunta**: ¿Cómo se calcula el coverage? ¿Para qué nos servirá?

**Contexto Actual**:
```python
# ProjectDB tiene campo:
test_coverage: float = 0.0  # Siempre 0, no se calcula
```

**Lo que necesito de ti**:
- Definir TODOS los tipos de coverage relevantes para QA:
  * Story coverage
  * Criteria coverage
  * Execution coverage
  * Test type coverage (functional, UI, API...)
  * Priority coverage (critical, high, medium, low)
  * ¿Otros?
- Fórmula exacta de cálculo para cada uno
- Cómo visualizarlos en Dashboard (widgets, charts, progress bars)
- Thresholds: ¿Qué es buen coverage? (ej: >80% green, 60-80% yellow, <60% red)
- Utilidad: ¿Para qué le sirve al QA? ¿Al PM? ¿Al Dev Lead?

---

### 4. Relación Test Cases ↔ Bugs

**Pregunta**: ¿Cómo relacionamos test cases a bugs? ¿Cómo trazamos qué test encontró qué bug?

**Contexto Actual**:
```python
# bug_reports tiene:
test_case_id: String FK  # Link opcional a test que encontró el bug

# test_executions tiene:
bug_ids: String  # Comma-separated: "BUG-001,BUG-002"
```

**Lo que necesito de ti**:
- Flujo completo:
  1. Test execution FAILED → QA reporta bug
  2. ¿Cómo se auto-llena BugFormModal con datos del test?
  3. ¿Cómo se linkea bug ↔ test automáticamente?
  4. Bug marcado FIXED → ¿Cómo notificar a QA para re-test?
  5. Re-test PASSED → ¿Cómo marcar bug VERIFIED automáticamente?
  6. Re-test FAILED → ¿Cómo re-abrir bug automáticamente?
- UI/UX: ¿Dónde se muestra la relación?
  * En TestCasesPage: mostrar bugs relacionados
  * En BugsPage: mostrar test que lo encontró
  * En test execution history: marcar cuál generó bug
- ¿Permitir múltiples bugs por test? (un test puede encontrar 2+ bugs)
- ¿Permitir múltiples tests por bug? (mismo bug reportado por diferentes tests)

---

### 5. Evidencias

**Pregunta**: ¿Cómo se cargarán evidencias (screenshots, videos, logs)? ¿Dónde se almacenan?

**Contexto Actual**:
```
NO HAY SISTEMA DE EVIDENCIAS
test_executions.evidence_files: array de strings (solo nombres, no storage)
bug_reports.document_path: string (solo path al documento markdown generado)
```

**Lo que necesito de ti**:
- Storage strategy:
  * ¿Local file system? ¿S3/Cloud?
  * Estructura de carpetas: /uploads/{project_id}/evidences/{entity_type}/{entity_id}/
  * ¿Límites de tamaño? (ej: max 10MB por archivo, max 50MB por test execution)
- Tipos de archivo soportados:
  * Images: .png, .jpg, .gif
  * Videos: .mp4, .webm
  * Logs: .txt, .log, .har
  * ¿Otros?
- UI/UX:
  * Drag & drop component
  * Thumbnails para imágenes/videos
  * Preview modal (lightbox)
  * Download links
- API design:
  * POST /upload-evidence (multipart/form-data)
  * GET /files/{file_id}
  * DELETE /files/{file_id}
  * GET /files/{file_id}/thumbnail
- Metadata tracking:
  * ¿Quién subió? (uploaded_by)
  * ¿Cuándo? (uploaded_date)
  * ¿Tamaño? (file_size)
  * ¿Tipo? (mime_type)

---

### 6. Generación de Reportes

**Pregunta**: ¿Cómo se generarán los reportes? ¿Qué tipos de reportes necesitamos?

**Contexto Actual**:
```python
# Backend tiene:
POST /generate-test-plan?project_id=X&format=pdf
- Genera PDF/DOCX con lista de tests
- Sin UI para configurar o descargar

# Frontend:
ReportsPage = placeholder "Coming soon..."
```

**Lo que necesito de ti**:
- Tipos de reportes necesarios:
  1. **Test Plan** (pre-ejecución): Lista de tests a ejecutar
     - ¿Qué incluir? (stories, tests, gherkin, assignments?)
     - ¿Cómo agrupar? (por story, por type, por priority?)
  2. **Execution Report** (post-ejecución): Resultados de testing
     - ¿Qué incluir? (pass rate, failed tests, bugs, metrics?)
     - ¿Cómo visualizar? (tablas, charts, executive summary?)
  3. **Bug Report** (por bug individual): Detalles de un bug
     - ¿Ya existe? (sí, bug_report_generator.py genera markdown)
     - ¿Mejorar? (agregar evidencias, generar PDF?)
  4. **Coverage Report**: Estado de coverage
     - ¿Qué incluir? (coverage por tipo, gaps, recomendaciones?)
  5. ¿**Otros reportes**? (metrics dashboard, team performance, sprint summary?)
- Configuración de reportes:
  * Filtros (date range, test type, priority, status)
  * Formato (PDF, DOCX, HTML, CSV)
  * Template (corporativo, simple, detallado)
  * Idioma (español, inglés)
- UI Design:
  * Select tipo de reporte
  * Config panel (filtros, formato)
  * Preview (opcional)
  * Generate button → Progress bar → Download
  * Lista de reportes históricos
- Automatización:
  * ¿Generar reportes automáticamente? (weekly, sprint end)
  * ¿Email automático a stakeholders?
  * ¿Scheduled reports?

---

### 7. Reportar Bugs

**Pregunta**: ¿Cómo se reportarán bugs? ¿Cuál es el workflow completo?

**Contexto Actual**:
```
Backend completo:
- Tabla bug_reports con todos los campos
- Endpoints CRUD
- Status workflow: NEW → ASSIGNED → IN_PROGRESS → FIXED → TESTING → VERIFIED → CLOSED

Frontend:
- BugsPage = placeholder
- BugFormModal = no existe
```

**Lo que necesito de ti**:
- Flujo end-to-end:
  1. **Reportar bug**:
     - ¿Desde dónde? (test execution modal, manual desde BugsPage)
     - Form fields (title, description, severity, priority, steps to reproduce, expected vs actual behavior, environment, browser, OS, evidences)
     - ¿Auto-fill desde test failed? (heredar steps de Gherkin, link test_case_id, link user_story_id)
  2. **Asignar bug**:
     - ¿Quién asigna? (QA Lead, PM, auto-assign?)
     - ¿A quién? (developer del team)
     - Notification al assignee
  3. **Trabajar en bug**:
     - Dev marca status: IN_PROGRESS
     - Dev agrega notas de progreso
     - Dev marca: FIXED
     - Notification a QA: "Bug ready for re-test"
  4. **Re-test**:
     - QA re-ejecuta test case relacionado
     - Si PASSED: marcar bug VERIFIED
     - Si FAILED: re-abrir bug (REOPENED), agregar comment
  5. **Cerrar bug**:
     - PM/QA Lead marca CLOSED
     - Calcular metrics: fix time, re-open count
- UI Design BugsPage:
  * Layout: tabla vs cards vs kanban board?
  * Filtros: severity, priority, status, assigned_to, test_case_id
  * Sort: por date, por severity, por priority
  * Bulk actions: assign múltiples bugs, change status
- BugFormModal:
  * Secciones: Info, Details, Environment, Evidence, Assignment
  * Validation: campos obligatorios
  * Pre-fill logic (cuando viene desde test failed)

---

### 8. Seguimiento

**Pregunta**: ¿Cómo se hará seguimiento a todo esto? ¿Qué métricas y dashboards necesitamos?

**Contexto Actual**:
```
DashboardPage básico con:
- Total user stories, test cases, bugs
- No charts, no trends, no drill-down
```

**Lo que necesito de ti**:
- Dashboard completo:
  1. **Test Execution Progress**:
     - Total tests vs executed
     - Progress bar con %
     - Breakdown por status (PASSED, FAILED, NOT_RUN, BLOCKED)
  2. **Pass Rate**:
     - Today, This Week, This Sprint
     - Trend: ↗ improving, ↘ declining, → stable
     - Line chart (últimos 7 días)
  3. **Bug Status**:
     - Open bugs (count + severity breakdown)
     - In Progress bugs
     - Fixed (pending re-test)
     - Verified/Closed
     - Avg fix time
     - Bug trend (bar chart semanal)
  4. **Coverage Metrics**:
     - Story coverage, criteria coverage, execution coverage
     - Por test type (functional, UI, API)
     - Gaps identified (stories sin tests, criterios sin tests)
  5. **Critical Alerts**:
     - ⚠️ Critical bugs pending
     - ⚠️ Tests not executed for > 3 days
     - ⚠️ Pass rate dropped below threshold
  6. **Team Performance**:
     - Tests executed por tester
     - Avg execution time por tester
     - Bugs found por tester
- Real-time updates:
  * ¿Polling? ¿WebSocket?
  * ¿Cada cuánto refrescar? (30 seg, 1 min, manual)
- Notifications:
  * In-app (bell icon con badge count)
  * Email (configurable)
  * ¿Slack/Teams integration?
- Activity Log:
  * Timeline de eventos
  * Filtros por user, por entity type, por date
  * Export log (CSV, JSON)

---

### 9. Features Faltantes

**Pregunta**: ¿Qué más detalles como estos nos pueden faltar? ¿Qué features NO hemos considerado?

**Tu tarea**: Hacer un brainstorming completo y listar:
- Features de QA tools profesionales que NO están en nuestro proyecto
- Pain points comunes de QAs que podríamos resolver
- Integraciones útiles (JIRA, Notion, Azure DevOps, Slack, CI/CD)
- Automation (generar código Playwright/Cypress desde Gherkin)
- AI features adicionales (sugerir test data, detectar flaky tests, predecir bugs)

---

### 10. Claridad del Flujo

**Pregunta**: ¿Tenemos claro el flujo completo? ¿Falta algo en el user journey?

**Flujo actual diseñado**:
```
1. PM/PO crea proyecto → Upload Excel con stories
2. QA genera test cases con IA → Review → Approve
3. ??? FALTA: QA ejecuta tests → Marca PASS/FAIL → Sube evidencias
4. ??? FALTA: QA reporta bug desde test failed
5. ??? FALTA: Dev marca bug fixed → QA re-testa
6. ??? FALTA: QA genera reportes (test plan, execution report)
7. ??? FALTA: Dashboard muestra métricas en tiempo real
```

**Tu tarea**:
- Validar que el flujo está completo
- Identificar steps missing
- Proponer mejoras (ej: onboarding, templates, bulk operations)

---

## LO QUE NECESITO DE TI - ENTREGABLES

### 📋 1. Documento de Diseño Técnico Completo

Para cada feature faltante, proporciona:

**A) User Story & Acceptance Criteria**
```
Como [rol], quiero [acción] para [beneficio]

Criterios de Aceptación:
- [ ] ...
- [ ] ...
```

**B) API Contract**
```python
# Endpoint: POST /ruta
# Request body:
{
  "field": "value"
}

# Response:
{
  "result": "..."
}

# Errores:
400: "Validation error"
404: "Not found"
```

**C) Database Schema Changes** (si aplica)
```sql
ALTER TABLE ...
ADD COLUMN ...
```

**D) Frontend Component Design**
```typescript
// Component: NombreDelComponente
interface Props {
  // ...
}

// Estado:
const [state, setState] = useState(...)

// Lógica:
// ...

// UI Layout:
<div>
  // Describe estructura visual
</div>
```

**E) UX Flow** (paso a paso)
```
User action 1 → System response 1 → User action 2 → ...
```

---

### 📊 2. Priorización y Roadmap

Organiza las features faltantes en sprints:

**Sprint 1 (MVP Execution)**:
- Features críticas para poder ejecutar tests
- Tiempo estimado: X días

**Sprint 2 (Tracking & Reports)**:
- Coverage, reportes, métricas
- Tiempo estimado: X días

**Sprint 3 (Collaboration)**:
- Notifications, assignments, activity log
- Tiempo estimado: X días

---

### 🎨 3. UI/UX Mockups (Textual)

Describe visualmente cómo se ve cada pantalla:

```
┌─────────────────────────────────────────┐
│ Header con título                        │
├─────────────────────────────────────────┤
│                                         │
│ [Sección 1]                             │
│   - Elemento A                          │
│   - Elemento B                          │
│                                         │
│ [Sección 2]                             │
│   - Tabla/Form/Card                     │
│                                         │
│ [Actions]                               │
│   [Button 1] [Button 2]                 │
│                                         │
└─────────────────────────────────────────┘
```

---

### 🧪 4. Test Strategy

Para cada feature:
- ¿Cómo se prueba? (manual, automated)
- Test cases críticos
- Edge cases

---

### 💡 5. Mejores Prácticas y Recomendaciones

- Performance considerations
- Security considerations
- Scalability considerations
- UX best practices
- Error handling patterns

---

## FORMATO DE RESPUESTA

Por favor, estructura tu respuesta en secciones claras:

```markdown
# Feature 1: Test Execution UI

## 1. User Story
...

## 2. Acceptance Criteria
...

## 3. Backend API Design
...

## 4. Database Changes
...

## 5. Frontend Component Design
...

## 6. UX Flow
...

## 7. UI Mockup
...

## 8. Implementation Notes
...

## 9. Test Strategy
...

---

# Feature 2: BugsPage
...
```

---

## DOCUMENTACIÓN DE REFERENCIA

Lee estos archivos para entender el proyecto:

1. **CLAUDE.md**: Documentación técnica completa actual
2. **QA_WORKFLOW_COMPLETE.md**: Flujo QA ideal diseñado
3. **PROJECT_STATUS.md**: Estado actual del proyecto
4. **PROMPT_IMPROVEMENT_OPTIONS.md**: Opciones de mejora del prompt de IA

Estructura del código:
- `backend/api/routes.py`: Todos los endpoints
- `backend/database/models.py`: Modelos de BD
- `backend/integrations/gemini_client.py`: Cliente de IA
- `frontend/src/pages/`: Páginas de la app
- `frontend/src/features/`: Features modulares
- `frontend/src/widgets/`: Componentes reutilizables

---

## RESTRICCIONES Y CONSIDERACIONES

1. **Tech Stack**: Debe usar FastAPI + React + TypeScript (no cambiar stack)
2. **Database**: SQLite actualmente (diseñar para ser PostgreSQL-compatible)
3. **AI**: Gemini 2.5 Flash (no cambiar modelo sin justificación fuerte)
4. **Authentication**: Actualmente NO hay login (single-user), diseñar considerando multi-user futuro
5. **Deployment**: Debe ser fácil de deployar (Docker preferiblemente)

---

## PREGUNTAS FINALES PARA TI

Antes de empezar, responde:

1. ¿Entiendes completamente el proyecto actual y sus capacidades?
2. ¿Tienes claro qué es lo que falta implementar?
3. ¿Hay algo del proyecto actual que NO esté claro y necesites que aclare?
4. ¿Estás listo para diseñar las 10 features faltantes con nivel de detalle implementable?

---

**¡ADELANTE! Diseña el futuro de esta plataforma QA. 🚀**

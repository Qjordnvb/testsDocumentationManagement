# CLAUDE.md - Documentación Técnica Completa

**Última Actualización**: 2025-11-16
**Estado**: Multi-Project Architecture implementada en backend, pendiente integración frontend

---

## 📋 ÍNDICE

1. [Arquitectura Backend](#arquitectura-backend)
2. [Todos los Endpoints API](#todos-los-endpoints-api)
3. [Modelos de Base de Datos](#modelos-de-base-de-datos)
4. [Modelos Pydantic](#modelos-pydantic)
5. [Configuración](#configuración)
6. [Guía de Integración Frontend](#guía-de-integración-frontend)
7. [Tareas Pendientes](#tareas-pendientes)
8. [Flujo de Trabajo Actual](#flujo-de-trabajo-actual)

---

## ARQUITECTURA BACKEND

### Estructura de Directorios

```
backend/
├── api/
│   ├── __init__.py
│   ├── routes.py              # Todos los endpoints REST
│   └── dependencies.py        # Dependency injection (Gemini client)
│
├── database/
│   ├── __init__.py
│   ├── db.py                  # SQLAlchemy setup
│   └── models.py              # ProjectDB, UserStoryDB, TestCaseDB, etc.
│
├── models/
│   ├── __init__.py
│   ├── project.py             # Project, CreateProjectDTO, UpdateProjectDTO
│   ├── user_story.py          # UserStory, AcceptanceCriteria, enums
│   ├── test_case.py           # TestCase, GherkinScenario, enums
│   └── bug_report.py          # BugReport, enums
│
├── generators/
│   ├── __init__.py
│   ├── gherkin_generator.py   # Genera archivos .feature
│   ├── test_plan_generator.py # Genera PDFs/DOCX
│   └── bug_report_generator.py # Genera reportes
│
├── integrations/
│   ├── __init__.py
│   └── gemini_client.py       # Google Gemini AI wrapper
│
├── parsers/
│   ├── __init__.py
│   └── file_parser.py         # Parser Excel/CSV
│
├── config.py                  # Settings con Pydantic
├── main.py                    # FastAPI app entry point
├── cli.py                     # CLI commands
└── cli_full_workflow.py       # CLI workflow completo
```

### Stack Tecnológico

- **Framework**: FastAPI 0.109.0
- **ASGI Server**: Uvicorn
- **ORM**: SQLAlchemy 2.0.25
- **Database**: SQLite (production: PostgreSQL/MySQL compatible)
- **Validation**: Pydantic 2.5.3
- **AI**: google-generativeai 0.3.2 (Gemini)
- **Document Generation**: python-docx, reportlab
- **Data Processing**: pandas, openpyxl

---

## TODOS LOS ENDPOINTS API

**Base URL**: `http://localhost:8000/api/v1`

### 🏥 Health & Root

#### `GET /`
Root endpoint
- **Response**: `{app: str, version: str, status: str}`

#### `GET /health`
Health check
- **Response**: `{status: "healthy", timestamp: str}`

---

### 🗂️ PROJECTS (Multi-Project Support) - ✅ COMPLETO

#### `GET /projects`
Obtiene todos los proyectos con métricas

**Response**:
```json
{
  "projects": [
    {
      "id": "PROJ-001",
      "name": "E-commerce App",
      "description": "...",
      "client": "ABC Corp",
      "team_members": ["qa1@example.com"],
      "status": "active",
      "default_test_types": ["FUNCTIONAL", "UI"],
      "start_date": "2025-01-01T00:00:00",
      "end_date": null,
      "created_date": "2025-11-16T10:00:00",
      "updated_date": "2025-11-16T10:00:00",
      "total_user_stories": 15,
      "total_test_cases": 45,
      "total_bugs": 3,
      "test_coverage": 95.5
    }
  ]
}
```

#### `GET /projects/{project_id}`
Obtiene proyecto específico con métricas

**Path Params**: `project_id` (string)

**Response**: Objeto proyecto con métricas calculadas

#### `POST /projects`
Crea nuevo proyecto

**Body**: `CreateProjectDTO`
```json
{
  "name": "Mobile Banking App",
  "description": "QA testing for mobile banking",
  "client": "Bank XYZ",
  "team_members": ["qa@bank.com"],
  "default_test_types": ["FUNCTIONAL", "SECURITY"],
  "start_date": "2025-02-01T00:00:00"
}
```

**Response**: Proyecto creado con `id` auto-generado (PROJ-XXX)

#### `PUT /projects/{project_id}`
Actualiza proyecto

**Path Params**: `project_id` (string)
**Body**: `UpdateProjectDTO` (todos los campos opcionales)

**Response**: Proyecto actualizado

#### `DELETE /projects/{project_id}`
Elimina proyecto y TODOS sus datos (CASCADE)

**Path Params**: `project_id` (string)

**Response**: `{message: "Project PROJ-001 deleted successfully"}`

**⚠️ ADVERTENCIA**: Esto elimina:
- El proyecto
- Todas las user stories del proyecto
- Todos los test cases del proyecto
- Todos los bugs del proyecto

#### `GET /projects/{project_id}/stats`
Estadísticas del proyecto

**Path Params**: `project_id` (string)

**Response**:
```json
{
  "project_id": "PROJ-001",
  "project_name": "E-commerce App",
  "total_user_stories": 15,
  "total_test_cases": 45,
  "total_bugs": 3,
  "stories_by_status": {
    "Backlog": 5,
    "To Do": 3,
    "In Progress": 4,
    "Testing": 2,
    "Done": 1
  },
  "timestamp": "2025-11-16T10:30:00"
}
```

---

### 📤 FILE UPLOAD - ⚠️ NECESITA project_id

#### `POST /upload`
Upload y parse Excel/CSV con user stories

**⚠️ PROBLEMA**: NO tiene parámetro `project_id`

**Body**: `multipart/form-data`
- `file`: archivo .xlsx o .csv

**Response**:
```json
{
  "message": "Successfully processed file",
  "inserted": 10,
  "updated": 5,
  "total": 15,
  "file_path": "uploads/20251116_120000_stories.xlsx",
  "detected_columns": ["id", "title", "description", ...]
}
```

**TODO**: Agregar parámetro `project_id` (query o form)

**Formato Excel esperado**:
| id | title | description | priority | status | ... |
|----|-------|-------------|----------|--------|-----|
| US-001 | Login | Como usuario... | High | Backlog | ... |

---

### 📝 USER STORIES - ⚠️ NECESITA project_id filter

#### `GET /user-stories`
Obtiene todas las user stories

**⚠️ PROBLEMA**: Retorna TODAS las stories de TODOS los proyectos

**Response**:
```json
{
  "user_stories": [
    {
      "id": "US-001",
      "title": "User Login",
      "description": "Como usuario...",
      "priority": "High",
      "status": "Backlog",
      "epic": "Authentication",
      "sprint": "Sprint 1",
      "story_points": 5,
      "total_criteria": 3,
      "completed_criteria": 0,
      "completion_percentage": 0.0,
      "created_date": "2025-11-16T10:00:00"
    }
  ]
}
```

**TODO**: Agregar filtro `?project_id=PROJ-001`

#### `GET /user-stories/{story_id}`
Obtiene user story específica

**Path Params**: `story_id` (string)

**Response**: Objeto UserStory

---

### ✅ TEST CASES - ⚠️ NECESITA project_id filter

#### `GET /test-cases`
Obtiene todos los test cases

**⚠️ PROBLEMA**: Retorna TODOS los test cases de TODOS los proyectos

**Response**:
```json
{
  "test_cases": [
    {
      "id": "TC-001",
      "title": "Verify login with valid credentials",
      "description": "...",
      "user_story_id": "US-001",
      "test_type": "FUNCTIONAL",
      "priority": "HIGH",
      "status": "NOT_RUN",
      "gherkin_file_path": "output/gherkin/TC-001.feature",
      "created_date": "2025-11-16T11:00:00"
    }
  ]
}
```

**TODO**: Agregar filtro `?project_id=PROJ-001`

#### `GET /test-cases/{test_id}`
Obtiene test case específico

**Path Params**: `test_id` (string)

#### `PUT /test-cases/{test_id}`
Actualiza test case

**Path Params**: `test_id` (string)
**Body**: Campos a actualizar (partial)

**Campos permitidos**:
```json
{
  "title": "...",
  "description": "...",
  "test_type": "FUNCTIONAL",
  "priority": "HIGH",
  "status": "PASSED",
  "estimated_time_minutes": 30,
  "actual_time_minutes": 25,
  "automated": true
}
```

#### `DELETE /test-cases/{test_id}`
Elimina test case y su archivo Gherkin

**Path Params**: `test_id` (string)

**Response**: `{message: "...", deleted_id: "TC-001"}`

---

### ✨ GENERACIÓN DE TEST CASES CON IA

#### `POST /generate-test-cases/{story_id}/preview`
**Preview**: Genera sugerencias SIN guardar en BD

**⚠️ NECESITA**: Validación de `project_id`

**Path Params**: `story_id` (string)

**Query Params**:
- `num_test_cases` (int, 1-10, default=5)
- `scenarios_per_test` (int, 1-10, default=3)
- `test_types` (array[string], default=["FUNCTIONAL", "UI"])
- `use_ai` (bool, default=true)

**Response**:
```json
{
  "user_story_id": "US-001",
  "user_story_title": "User Login",
  "suggested_test_cases": [
    {
      "suggested_id": "TC-temp-001",
      "title": "Verify login with valid credentials",
      "description": "...",
      "test_type": "FUNCTIONAL",
      "priority": "HIGH",
      "status": "NOT_RUN",
      "scenarios_count": 3,
      "gherkin_content": "Feature: Login...",
      "can_edit": true,
      "can_delete": true
    }
  ],
  "total_suggested": 5,
  "can_edit_before_save": true,
  "can_add_more": true
}
```

#### `POST /test-cases/batch`
Guarda múltiples test cases después de review

**⚠️ NECESITA**: Validación de `project_id`

**Body**:
```json
{
  "user_story_id": "US-001",
  "test_cases": [
    {
      "suggested_id": "TC-temp-001",
      "title": "...",
      "description": "...",
      "test_type": "FUNCTIONAL",
      "priority": "HIGH",
      "status": "NOT_RUN",
      "gherkin_content": "Feature: ..."
    }
  ]
}
```

**Response**:
```json
{
  "message": "Created 5 test cases successfully",
  "created_count": 5,
  "test_cases": [...]
}
```

#### `POST /generate-test-cases/{story_id}`
Genera y GUARDA test cases (OLD - deprecar?)

**⚠️ NECESITA**: Validación de `project_id`

**Path Params**: `story_id` (string)
**Query Params**: `use_ai` (bool), `num_scenarios` (int)

**Response**: Test cases creados

---

### 📄 GHERKIN EDITOR

#### `GET /test-cases/{test_id}/gherkin`
Obtiene contenido del archivo .feature

**Path Params**: `test_id` (string)

**Response**:
```json
{
  "test_case_id": "TC-001",
  "file_path": "output/gherkin/TC-001.feature",
  "gherkin_content": "Feature: Login\n  Scenario: Valid credentials\n    Given..."
}
```

#### `PUT /test-cases/{test_id}/gherkin`
Actualiza contenido del archivo .feature

**Path Params**: `test_id` (string)
**Body**:
```json
{
  "gherkin_content": "Feature: Login\n  Scenario: ..."
}
```

**Response**:
```json
{
  "message": "Gherkin content updated successfully",
  "file_path": "output/gherkin/TC-001.feature"
}
```

---

### 📊 TEST PLAN GENERATION - ⚠️ NECESITA project_id

#### `POST /generate-test-plan`
Genera documento de test plan

**⚠️ PROBLEMA**: Usa `project_name` como string, genera plan para TODAS las stories/tests

**Query Params**:
- `project_name` (string, default="QA Project") ← CAMBIAR A `project_id`
- `format` (string: "pdf", "docx", "both", default="both")

**Response**:
```json
{
  "message": "Test plan generated successfully",
  "files": {
    "pdf": "output/test_plan_QA_Project.pdf",
    "docx": "output/test_plan_QA_Project.docx"
  }
}
```

**TODO**: Cambiar para usar `project_id` y filtrar stories/tests

---

### 🐛 BUG REPORTS - ⚠️ NECESITA project_id validation

#### `POST /generate-bug-template`
Genera template de bug report

**Response**: Archivo markdown template

#### `POST /create-bug-report`
Crea bug report

**⚠️ NECESITA**: Validación/herencia de `project_id` desde user_story/test_case

**Body**: `BugReport` model completo

**Response**:
```json
{
  "message": "Bug report created successfully",
  "bug_id": "BUG-001",
  "document": "output/bugs/BUG-001.md"
}
```

---

### 📥 FILE DOWNLOAD

#### `GET /download/{filename}`
Descarga archivo generado

**Path Params**: `filename` (string)

**Response**: FileResponse (application/octet-stream)

---

### 📈 STATISTICS

#### `GET /stats`
Estadísticas globales (todos los proyectos)

**⚠️ DECISIÓN PENDIENTE**: ¿Mantener global o agregar filtro `project_id`?

**Response**:
```json
{
  "total_user_stories": 50,
  "total_test_cases": 150,
  "total_bugs": 10,
  "stories_by_status": {
    "Backlog": 20,
    "To Do": 10,
    ...
  },
  "timestamp": "2025-11-16T12:00:00"
}
```

**Nota**: Ya existe `/projects/{id}/stats` para stats por proyecto

---

## MODELOS DE BASE DE DATOS

### ProjectDB

**Tabla**: `projects`

```python
id: String, PK, Index              # PROJ-001, PROJ-002, ...
name: String, required
description: Text, nullable
client: String, nullable
team_members: Text, nullable        # JSON: ["user@example.com", ...]
status: Enum(ProjectStatus)         # ACTIVE, ARCHIVED, COMPLETED
default_test_types: Text, nullable  # JSON: ["FUNCTIONAL", "UI", ...]
start_date: DateTime, nullable
end_date: DateTime, nullable
created_date: DateTime, default=now
updated_date: DateTime, default=now, onupdate=now
notion_database_id: String, nullable
azure_project_id: String, nullable

# Relationships
user_stories: OneToMany -> UserStoryDB (cascade delete)
test_cases: OneToMany -> TestCaseDB (cascade delete)
bug_reports: OneToMany -> BugReportDB (cascade delete)
```

### UserStoryDB

**Tabla**: `user_stories`

```python
id: String, PK, Index              # US-001, US-002, ...
project_id: String, FK(projects.id), required, Index  # ← CRITICAL
title: String, required
description: Text, required
priority: Enum(Priority)            # CRITICAL, HIGH, MEDIUM, LOW
status: Enum(Status)                # BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, TESTING, DONE
epic: String, nullable
sprint: String, nullable
story_points: Integer, nullable
assigned_to: String, nullable
created_date: DateTime, default=now
updated_date: DateTime, default=now, onupdate=now
total_criteria: Integer, default=0
completed_criteria: Integer, default=0
completion_percentage: Float, default=0.0
notion_page_id: String, nullable
azure_work_item_id: String, nullable

# Relationships
project: ManyToOne -> ProjectDB
test_cases: OneToMany -> TestCaseDB
bug_reports: OneToMany -> BugReportDB
```

### TestCaseDB

**Tabla**: `test_cases`

```python
id: String, PK, Index              # TC-001, TC-002, ...
project_id: String, FK(projects.id), required, Index  # ← CRITICAL
title: String, required
description: Text, required
user_story_id: String, FK(user_stories.id), required
test_type: Enum(TestType)           # FUNCTIONAL, UI, API, INTEGRATION, ...
priority: Enum(TestPriority)        # CRITICAL, HIGH, MEDIUM, LOW
status: Enum(TestStatus)            # NOT_RUN, PASSED, FAILED, BLOCKED, SKIPPED
estimated_time_minutes: Integer, nullable
actual_time_minutes: Integer, nullable
automated: Boolean, default=False
created_date: DateTime, default=now
last_executed: DateTime, nullable
executed_by: String, nullable
gherkin_file_path: String, nullable # output/gherkin/TC-001.feature
notion_page_id: String, nullable
azure_test_case_id: String, nullable

# Relationships
project: ManyToOne -> ProjectDB
user_story: ManyToOne -> UserStoryDB
executions: OneToMany -> TestExecutionDB
```

### BugReportDB

**Tabla**: `bug_reports`

```python
id: String, PK, Index              # BUG-001, BUG-002, ...
project_id: String, FK(projects.id), required, Index  # ← CRITICAL
title: String, required
description: Text, required
severity: Enum(BugSeverity)         # CRITICAL, HIGH, MEDIUM, LOW
priority: Enum(BugPriority)         # URGENT, HIGH, MEDIUM, LOW
bug_type: Enum(BugType)             # FUNCTIONAL, UI, PERFORMANCE, SECURITY, ...
status: Enum(BugStatus)             # NEW, ASSIGNED, IN_PROGRESS, FIXED, TESTING, VERIFIED, CLOSED, ...
environment: String, nullable
browser: String, nullable
os: String, nullable
version: String, nullable
user_story_id: String, FK(user_stories.id), nullable
test_case_id: String, nullable
reported_by: String, nullable
assigned_to: String, nullable
verified_by: String, nullable
reported_date: DateTime, default=now
assigned_date: DateTime, nullable
fixed_date: DateTime, nullable
verified_date: DateTime, nullable
closed_date: DateTime, nullable
document_path: String, nullable
notion_page_id: String, nullable
azure_bug_id: String, nullable

# Relationships
project: ManyToOne -> ProjectDB
user_story: ManyToOne -> UserStoryDB
```

### TestExecutionDB

**Tabla**: `test_executions`

```python
id: Integer, PK, Index, auto_increment
test_case_id: String, FK(test_cases.id), required
executed_by: String, required
execution_date: DateTime, default=now
status: Enum(TestStatus)            # NOT_RUN, PASSED, FAILED, BLOCKED, SKIPPED
execution_time_minutes: Integer, nullable
passed_steps: Integer, default=0
failed_steps: Integer, default=0
total_steps: Integer, default=0
notes: Text, nullable
failure_reason: Text, nullable
bug_ids: String, nullable           # Comma-separated: "BUG-001,BUG-002"

# Relationships
test_case: ManyToOne -> TestCaseDB
```

**Nota**: TestExecutionDB NO tiene `project_id` directamente (hereda de test_case)

---

## MODELOS PYDANTIC

### Project Models

```python
# Enums
class ProjectStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"

# Main Model
class Project(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    client: Optional[str] = None
    team_members: Optional[List[str]] = None
    status: ProjectStatus = ProjectStatus.ACTIVE
    default_test_types: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_date: datetime
    updated_date: datetime
    notion_database_id: Optional[str] = None
    azure_project_id: Optional[str] = None
    # Calculated metrics
    total_user_stories: int = 0
    total_test_cases: int = 0
    total_bugs: int = 0
    test_coverage: float = 0.0

# DTOs
class CreateProjectDTO(BaseModel):
    name: str  # min_length=1, max_length=200
    description: Optional[str] = None
    client: Optional[str] = None
    team_members: Optional[List[str]] = None
    default_test_types: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class UpdateProjectDTO(BaseModel):
    # All fields optional
    name: Optional[str] = None
    description: Optional[str] = None
    client: Optional[str] = None
    team_members: Optional[List[str]] = None
    status: Optional[ProjectStatus] = None
    default_test_types: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
```

### User Story Models

```python
# Enums
class Priority(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class Status(str, Enum):
    BACKLOG = "Backlog"
    TODO = "To Do"
    IN_PROGRESS = "In Progress"
    IN_REVIEW = "In Review"
    TESTING = "Testing"
    DONE = "Done"

# Models
class AcceptanceCriteria(BaseModel):
    id: Optional[str] = None
    description: str
    completed: bool = False

class UserStory(BaseModel):
    id: str
    title: str
    description: str
    acceptance_criteria: List[AcceptanceCriteria] = []
    priority: Priority = Priority.MEDIUM
    status: Status = Status.BACKLOG
    epic: Optional[str] = None
    sprint: Optional[str] = None
    story_points: Optional[int] = None
    assigned_to: Optional[str] = None
    created_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None
    raw_data: Optional[dict] = None
    test_case_ids: List[str] = []
```

### Test Case Models

```python
# Enums
class TestType(str, Enum):
    FUNCTIONAL = "FUNCTIONAL"
    INTEGRATION = "INTEGRATION"
    UI = "UI"
    API = "API"
    REGRESSION = "REGRESSION"
    SMOKE = "SMOKE"
    E2E = "E2E"
    PERFORMANCE = "PERFORMANCE"
    SECURITY = "SECURITY"
    ACCESSIBILITY = "ACCESSIBILITY"

class TestPriority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class TestStatus(str, Enum):
    NOT_RUN = "NOT_RUN"
    PASSED = "PASSED"
    FAILED = "FAILED"
    BLOCKED = "BLOCKED"
    SKIPPED = "SKIPPED"

# Models
class GherkinScenario(BaseModel):
    scenario_name: str
    given_steps: List[str] = []
    when_steps: List[str] = []
    then_steps: List[str] = []
    tags: List[str] = []

class TestCase(BaseModel):
    id: str
    title: str
    description: str
    user_story_id: str
    test_type: TestType = TestType.FUNCTIONAL
    priority: TestPriority = TestPriority.MEDIUM
    status: TestStatus = TestStatus.NOT_RUN
    gherkin_scenarios: List[GherkinScenario] = []
    # ... más campos
```

### Bug Report Models

```python
# Enums
class BugSeverity(str, Enum):
    CRITICAL = "CRITICAL"  # System crash, data loss
    HIGH = "HIGH"          # Major functionality broken
    MEDIUM = "MEDIUM"      # Feature partially broken
    LOW = "LOW"            # Minor issue, cosmetic

class BugPriority(str, Enum):
    URGENT = "URGENT"      # Fix immediately
    HIGH = "HIGH"          # Fix in current sprint
    MEDIUM = "MEDIUM"      # Fix in next sprint
    LOW = "LOW"            # Fix when possible

class BugStatus(str, Enum):
    NEW = "NEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    FIXED = "FIXED"
    TESTING = "TESTING"
    VERIFIED = "VERIFIED"
    CLOSED = "CLOSED"
    REOPENED = "REOPENED"
    WONT_FIX = "WONT_FIX"
    DUPLICATE = "DUPLICATE"

class BugType(str, Enum):
    FUNCTIONAL = "FUNCTIONAL"
    UI = "UI"
    PERFORMANCE = "PERFORMANCE"
    SECURITY = "SECURITY"
    COMPATIBILITY = "COMPATIBILITY"
    DATA = "DATA"
    API = "API"
    CRASH = "CRASH"

# Model
class BugReport(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    steps_to_reproduce: List[str]
    expected_behavior: str
    actual_behavior: str
    severity: BugSeverity = BugSeverity.MEDIUM
    priority: BugPriority = BugPriority.MEDIUM
    bug_type: BugType = BugType.FUNCTIONAL
    status: BugStatus = BugStatus.NEW
    # ... más campos
```

---

## CONFIGURACIÓN

### Environment Variables (.env)

```bash
# App Config
APP_NAME="QA Documentation Automation"
APP_VERSION="1.0.0"
DEBUG=false

# Gemini AI (REQUERIDO)
GEMINI_API_KEY=your_api_key_here

# Database
DATABASE_URL=sqlite:///./data/qa_automation.db

# Upload Settings
MAX_UPLOAD_SIZE_MB=10
ALLOWED_EXTENSIONS=xlsx,csv

# Output Directories
OUTPUT_DIR=./output
UPLOAD_DIR=./uploads
```

### Settings Class

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "QA Documentation Automation"
    app_version: str = "1.0.0"
    debug: bool = False

    gemini_api_key: str  # REQUIRED, no default

    database_url: str = "sqlite:///./data/qa_automation.db"
    max_upload_size_mb: int = 10
    allowed_extensions: str = "xlsx,csv"
    output_dir: str = "./output"
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"
```

---

## GUÍA DE INTEGRACIÓN FRONTEND

### Paso 1: Crear Entity Project

```typescript
// frontend/src/entities/project/model/types.ts

export type ProjectStatus = 'active' | 'archived' | 'completed';

export interface Project {
  id: string;
  name: string;
  description?: string;
  client?: string;
  team_members?: string[];
  status: ProjectStatus;
  default_test_types?: string[];
  start_date?: string;
  end_date?: string;
  created_date: string;
  updated_date: string;

  // Metrics (calculated)
  total_user_stories: number;
  total_test_cases: number;
  total_bugs: number;
  test_coverage: number;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  client?: string;
  team_members?: string[];
  default_test_types?: string[];
  start_date?: string;
  end_date?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  client?: string;
  team_members?: string[];
  status?: ProjectStatus;
  default_test_types?: string[];
  start_date?: string;
  end_date?: string;
}
```

### Paso 2: Crear Project API

```typescript
// frontend/src/entities/project/api/projectApi.ts

import axios from 'axios';
import type { Project, CreateProjectDTO, UpdateProjectDTO } from '../model/types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const projectApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await api.get<{ projects: Project[] }>('/projects');
    return data.projects;
  },

  getById: async (id: string): Promise<Project> => {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },

  create: async (projectData: CreateProjectDTO): Promise<Project> => {
    const { data } = await api.post<Project>('/projects', projectData);
    return data;
  },

  update: async (id: string, updates: UpdateProjectDTO): Promise<Project> => {
    const { data } = await api.put<Project>(`/projects/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  getStats: async (id: string): Promise<ProjectStats> => {
    const { data } = await api.get<ProjectStats>(`/projects/${id}/stats`);
    return data;
  },
};

interface ProjectStats {
  project_id: string;
  project_name: string;
  total_user_stories: number;
  total_test_cases: number;
  total_bugs: number;
  stories_by_status: Record<string, number>;
  timestamp: string;
}
```

### Paso 3: Crear Project Context

```typescript
// frontend/src/app/providers/ProjectContext.tsx

import { createContext, useContext, useState, useEffect } from 'react';
import type { Project } from '@/entities/project';

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('currentProject');
    if (stored) {
      try {
        setCurrentProject(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored project:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage when changes
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('currentProject', JSON.stringify(currentProject));
    } else {
      localStorage.removeItem('currentProject');
    }
  }, [currentProject]);

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject, isLoading }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};
```

### Paso 4: Actualizar Rutas

```typescript
// frontend/src/app/App.tsx

import { ProjectProvider } from '@/app/providers/ProjectContext';
import { ProjectsListPage } from '@/pages/ProjectsListPage';
import { ProjectDashboard } from '@/pages/ProjectDashboard';

function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <Routes>
          {/* Landing: Project List */}
          <Route path="/" element={<ProjectsListPage />} />

          {/* Project-specific routes */}
          <Route path="/projects/:projectId">
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ProjectDashboard />} />
            <Route path="stories" element={<StoriesPage />} />
            <Route path="tests" element={<TestCasesPage />} />
            <Route path="bugs" element={<BugsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
          </Route>
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
  );
}
```

### Paso 5: Crear ProjectsListPage

```typescript
// frontend/src/pages/ProjectsListPage/index.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '@/entities/project';
import type { Project } from '@/entities/project';

export const ProjectsListPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectApi.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project: Project) => {
    navigate(`/projects/${project.id}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mis Proyectos QA</h1>
          <button className="btn btn-primary">
            + Nuevo Proyecto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleSelectProject(project)}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold mb-2">{project.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description || 'Sin descripción'}
              </p>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {project.total_user_stories}
                  </p>
                  <p className="text-xs text-gray-500">User Stories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {project.total_test_cases}
                  </p>
                  <p className="text-xs text-gray-500">Test Cases</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {project.test_coverage}%
                  </p>
                  <p className="text-xs text-gray-500">Coverage</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                <span>{project.client || 'Sin cliente'}</span>
                <span className={`px-2 py-1 rounded ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {project.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Paso 6: Actualizar API Calls Existentes

**IMPORTANTE**: Todos los API calls deben incluir `projectId`

```typescript
// ANTES (incorrecto)
const stories = await api.get('/user-stories');

// DESPUÉS (correcto)
const { currentProject } = useProject();
const stories = await api.get(`/user-stories?project_id=${currentProject.id}`);

// O mejor aún, cuando los endpoints estén actualizados:
const stories = await api.get(`/projects/${currentProject.id}/user-stories`);
```

### Paso 7: Eliminar Stats Polling

```typescript
// ANTES (incorrecto - en DashboardPage)
useEffect(() => {
  loadStats();
  const interval = setInterval(loadStats, 30000); // ❌ POLLING
  return () => clearInterval(interval);
}, []);

// DESPUÉS (correcto)
useEffect(() => {
  loadStats(); // Solo carga una vez al montar
}, [currentProject]); // Re-carga si cambia el proyecto

// Botón manual de refresh
<button onClick={loadStats}>
  🔄 Actualizar Métricas
</button>
```

---

## TAREAS PENDIENTES

### ⚠️ CRÍTICO: Backend

**1. Actualizar endpoints existentes para requerir/filtrar por `project_id`:**

```python
# POST /upload
@router.post("/upload")
async def upload_file(
    project_id: str = Query(..., description="Project ID"),  # ← ADD
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Validate project exists
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(404, f"Project {project_id} not found")

    # ... parse file ...

    # Add project_id when creating user stories
    for user_story in result.user_stories:
        existing_story = db.query(UserStoryDB).filter(
            UserStoryDB.id == user_story.id
        ).first()

        if existing_story:
            # ... update ...
        else:
            new_story = UserStoryDB(
                **user_story.dict(),
                project_id=project_id  # ← ADD
            )
            db.add(new_story)
```

```python
# GET /user-stories
@router.get("/user-stories")
async def get_user_stories(
    project_id: str = Query(..., description="Filter by project"),  # ← ADD
    db: Session = Depends(get_db)
):
    stories = db.query(UserStoryDB).filter(
        UserStoryDB.project_id == project_id  # ← ADD FILTER
    ).all()

    return {"user_stories": [...]}
```

```python
# GET /test-cases
@router.get("/test-cases")
async def get_test_cases(
    project_id: str = Query(..., description="Filter by project"),  # ← ADD
    db: Session = Depends(get_db)
):
    test_cases = db.query(TestCaseDB).filter(
        TestCaseDB.project_id == project_id  # ← ADD FILTER
    ).all()

    return {"test_cases": [...]}
```

```python
# POST /generate-test-cases/{story_id}
@router.post("/generate-test-cases/{story_id}")
async def generate_test_cases(
    story_id: str,
    use_ai: bool = True,
    num_scenarios: int = 3,
    db: Session = Depends(get_db),
    gemini_client: GeminiClient = Depends(get_gemini_client)
):
    # Fetch user story
    user_story = db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
    if not user_story:
        raise HTTPException(404, f"User story {story_id} not found")

    # ... generate test cases ...

    # Add project_id when creating test cases
    test_case_db = TestCaseDB(
        id=test_case.id,
        project_id=user_story.project_id,  # ← INHERIT from user story
        user_story_id=story_id,
        # ...
    )
```

```python
# POST /test-cases/batch
@router.post("/test-cases/batch")
async def create_test_cases_batch(
    test_cases_data: dict,
    db: Session = Depends(get_db)
):
    user_story_id = test_cases_data.get("user_story_id")

    # Get user story to inherit project_id
    user_story = db.query(UserStoryDB).filter(
        UserStoryDB.id == user_story_id
    ).first()
    if not user_story:
        raise HTTPException(404, f"User story {user_story_id} not found")

    # Create test cases with project_id
    for tc_data in test_cases_data.get("test_cases", []):
        new_test_case = TestCaseDB(
            id=...,
            project_id=user_story.project_id,  # ← INHERIT
            user_story_id=user_story_id,
            # ...
        )
```

```python
# POST /generate-test-plan
@router.post("/generate-test-plan")
async def generate_test_plan(
    project_id: str = Query(..., description="Project ID"),  # ← CHANGE from project_name
    format: str = Query("both", description="pdf, docx, or both"),
    db: Session = Depends(get_db)
):
    # Get project
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(404, f"Project {project_id} not found")

    # Filter user stories and test cases by project
    user_stories = db.query(UserStoryDB).filter(
        UserStoryDB.project_id == project_id
    ).all()

    test_cases = db.query(TestCaseDB).filter(
        TestCaseDB.project_id == project_id
    ).all()

    # Generate test plan
    generator = TestPlanGenerator()
    # Use project.name instead of parameter
    files = generator.generate_test_plan(
        project_name=project.name,
        user_stories=user_stories,
        test_cases=test_cases,
        format=format
    )
```

```python
# POST /create-bug-report
@router.post("/create-bug-report")
async def create_bug_report(
    bug_data: BugReport,
    db: Session = Depends(get_db)
):
    # Validate and inherit project_id
    project_id = None

    if bug_data.user_story_id:
        user_story = db.query(UserStoryDB).filter(
            UserStoryDB.id == bug_data.user_story_id
        ).first()
        if user_story:
            project_id = user_story.project_id

    if bug_data.test_case_id and not project_id:
        test_case = db.query(TestCaseDB).filter(
            TestCaseDB.id == bug_data.test_case_id
        ).first()
        if test_case:
            project_id = test_case.project_id

    if not project_id:
        raise HTTPException(
            400,
            "Bug must be associated with a user_story_id or test_case_id"
        )

    # Create bug with project_id
    new_bug = BugReportDB(
        id=bug_id,
        project_id=project_id,  # ← INHERIT
        # ...
    )
```

**2. Crear endpoints específicos por proyecto (OPTIONAL pero recomendado):**

```python
# GET /projects/{project_id}/user-stories
@router.get("/projects/{project_id}/user-stories")
async def get_project_user_stories(
    project_id: str,
    db: Session = Depends(get_db)
):
    # Validate project
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(404, f"Project {project_id} not found")

    # Get stories
    stories = db.query(UserStoryDB).filter(
        UserStoryDB.project_id == project_id
    ).all()

    return {"user_stories": [...]}

# GET /projects/{project_id}/test-cases
# GET /projects/{project_id}/bugs
# Similar structure...
```

### 📋 Frontend

**1. Crear páginas y componentes:**
- [ ] `ProjectsListPage` - Landing page con lista de proyectos
- [ ] `CreateProjectModal` - Form para crear proyecto
- [ ] `EditProjectModal` - Form para editar proyecto
- [ ] `ProjectDashboard` - Dashboard específico del proyecto
- [ ] `ProjectSettingsPage` - Configuración del proyecto

**2. Actualizar rutas:**
- [ ] Cambiar de `/dashboard` a `/projects/:projectId/dashboard`
- [ ] Cambiar de `/stories` a `/projects/:projectId/stories`
- [ ] Cambiar de `/tests` a `/projects/:projectId/tests`
- [ ] Cambiar de `/bugs` a `/projects/:projectId/bugs`
- [ ] Agregar `/` como ProjectsListPage

**3. Actualizar API calls:**
- [ ] StoriesPage: Agregar `?project_id=` a API calls
- [ ] TestCasesPage: Agregar `?project_id=` a API calls
- [ ] GenerateModal: Validar que user story pertenece al proyecto actual
- [ ] UploadModal: Agregar parámetro `project_id`

**4. Context y State Management:**
- [ ] Crear `ProjectContext` con `currentProject`
- [ ] Guardar `currentProject` en localStorage
- [ ] Validar que todas las páginas chequeen si hay proyecto seleccionado
- [ ] Redirect a `/` si no hay proyecto seleccionado

**5. Eliminar polling:**
- [ ] Remover `setInterval` de DashboardPage (línea 34)
- [ ] Agregar botón manual "Actualizar Métricas"
- [ ] Usar `useProject()` para recargar stats cuando cambia proyecto

---

## FLUJO DE TRABAJO ACTUAL

### Flujo Implementado (Con Multi-Proyecto)

```
1. LANDING PAGE
   └─ ProjectsListPage
      ├─ Ver lista de proyectos
      ├─ Click en proyecto → /projects/{id}/dashboard
      └─ Crear nuevo proyecto

2. DASHBOARD DEL PROYECTO
   /projects/{id}/dashboard
   ├─ Métricas del proyecto (no global)
   ├─ Quick Actions:
   │  ├─ Upload Excel (con project_id)
   │  ├─ Generate Tests
   │  └─ View Reports
   └─ Stories by Status

3. USER STORIES DEL PROYECTO
   /projects/{id}/stories
   ├─ Filtradas por project_id
   ├─ Upload Excel → Asocia al proyecto
   └─ Generate Test Cases

4. GENERATE TEST CASES
   GenerateModal
   ├─ Configurar: 1-10 test cases, tipos, escenarios
   ├─ Generate Preview (no save)
   └─ → ReviewTestCasesModal
      ├─ Ver sugerencias
      ├─ Editar titles/descriptions
      ├─ Eliminar no deseados
      ├─ Expandir para ver Gherkin
      └─ Save All → Batch Create (con project_id)

5. TEST CASES DEL PROYECTO
   /projects/{id}/tests
   ├─ Filtrados por project_id
   ├─ Table con CRUD
   ├─ Ver/Editar details
   ├─ Editar Gherkin → GherkinEditor
   └─ Delete test case

6. GHERKIN EDITOR
   GherkinEditor Component
   ├─ Textarea con contenido .feature
   ├─ Save changes → PUT /test-cases/{id}/gherkin
   └─ Warnings si hay cambios sin guardar

7. MANUAL TEST CASE CREATION
   TestCaseFormModal
   ├─ Crear sin IA
   ├─ Asociar a user story del proyecto
   └─ Agregar Gherkin después
```

### Flujo Pendiente

```
⚠️ ACTUALIZAR BACKEND:
   ├─ /upload → Require project_id
   ├─ /user-stories → Filter by project_id
   ├─ /test-cases → Filter by project_id
   ├─ /generate-test-plan → Use project_id
   └─ /create-bug-report → Inherit project_id

⚠️ FRONTEND:
   ├─ Crear ProjectsListPage
   ├─ Crear ProjectContext
   ├─ Actualizar rutas con :projectId
   ├─ Actualizar todos los API calls
   └─ Eliminar polling de stats
```

---

## NOTAS IMPORTANTES

### Decisiones de Arquitectura

**1. ¿Por qué project_id en todas las entidades?**
- Permite queries eficientes con índices
- Cascade delete automático (borrar proyecto → borrar todo)
- No necesita JOINs complejos para filtrar

**2. ¿Por qué NO project_id en TestExecutionDB?**
- Se hereda del test_case
- Reduce redundancia
- Query: `test_case.project_id` es suficiente

**3. ¿JSON en campos team_members y default_test_types?**
- SQLite no tiene array nativo
- JSON permite flexibilidad
- Frontend parsea con `JSON.parse()`

**4. ¿Mantener GET /stats global?**
- Útil para dashboard de administración
- Ver stats de TODOS los proyectos
- `/projects/{id}/stats` para stats específicos

### Gemini AI Integration

**Modelo usado**: `gemini-2.5-flash`

**Configuración**:
```python
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config={
        "temperature": 0.7,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 8192,
    },
    safety_settings=[...]
)
```

**Uso en endpoints**:
- `/generate-test-cases/{story_id}/preview` - Genera sugerencias
- `/generate-test-cases/{story_id}` - Genera y guarda (old)

**Prompts**:
Ver `backend/integrations/gemini_client.py` para templates de prompts

### Database Migration

**Script**: `migrate_to_multiproject.py`

**⚠️ ADVERTENCIA**: Borra TODOS los datos existentes

**Uso**:
```bash
python migrate_to_multiproject.py
# Type 'yes' to confirm
```

**Resultado**:
- Borra tablas viejas
- Crea tablas nuevas con project_id
- Base de datos limpia lista para usar

---

## CONTACTO Y CONTRIBUCIONES

Para modificaciones al sistema:
1. Leer esta documentación completa
2. Entender la arquitectura multi-proyecto
3. Actualizar CLAUDE.md si haces cambios mayores
4. Documentar decisiones de diseño

**Última revisión**: 2025-11-16
**Autor**: Claude Code Session

# 🎯 QA Flow - Frontend Master Reference
**Fecha:** 2025-11-14
**Propósito:** Documento maestro con toda la información del backend para crear el frontend React + TypeScript

---

## 📊 1. MODELOS DE DATOS COMPLETOS

### 1.1 UserStory (src/models/user_story.py)

```python
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

class AcceptanceCriteria(BaseModel):
    id: Optional[str]
    description: str
    completed: bool = False

class UserStory(BaseModel):
    # Core fields
    id: str                                    # "US-001"
    title: str
    description: str
    acceptance_criteria: List[AcceptanceCriteria] = []
    priority: Optional[Priority] = Priority.MEDIUM
    status: Optional[Status] = Status.BACKLOG

    # Metadata
    epic: Optional[str] = None
    sprint: Optional[str] = None
    story_points: Optional[int] = None
    assigned_to: Optional[str] = None
    created_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None

    # Relationships
    test_case_ids: List[str] = []

    # Methods
    def get_completion_percentage(self) -> float:
        """Calcula % de criterios completados"""
```

**TypeScript Interface:**
```typescript
interface AcceptanceCriteria {
  id?: string;
  description: string;
  completed: boolean;
}

interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptance_criteria: AcceptanceCriteria[];
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Testing' | 'Done';
  epic?: string;
  sprint?: string;
  story_points?: number;
  assigned_to?: string;
  created_date?: string;
  updated_date?: string;
  test_case_ids: string[];
  completion_percentage?: number;
}
```

---

### 1.2 TestCase (src/models/test_case.py)

```python
class TestType(str, Enum):
    FUNCTIONAL = "Functional"
    INTEGRATION = "Integration"
    UI = "UI"
    API = "API"
    REGRESSION = "Regression"
    SMOKE = "Smoke"
    E2E = "End-to-End"
    PERFORMANCE = "Performance"
    SECURITY = "Security"
    ACCESSIBILITY = "Accessibility"

class TestPriority(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class TestStatus(str, Enum):
    NOT_RUN = "Not Run"
    PASSED = "Passed"
    FAILED = "Failed"
    BLOCKED = "Blocked"
    SKIPPED = "Skipped"

class GherkinScenario(BaseModel):
    scenario_name: str
    given_steps: List[str] = []
    when_steps: List[str] = []
    then_steps: List[str] = []
    tags: List[str] = []

    def to_gherkin(self) -> str:
        """Convierte a formato Gherkin"""

class TestCase(BaseModel):
    id: str                                    # "TC-001"
    title: str
    description: str
    user_story_id: str
    test_type: TestType = TestType.FUNCTIONAL
    priority: TestPriority = TestPriority.MEDIUM
    status: TestStatus = TestStatus.NOT_RUN
    preconditions: List[str] = []
    gherkin_scenarios: List[GherkinScenario] = []
    estimated_time_minutes: Optional[int] = None
    automated: bool = False
    created_date: Optional[datetime] = None
    last_executed: Optional[datetime] = None
    executed_by: Optional[str] = None
```

**TypeScript Interface:**
```typescript
interface GherkinScenario {
  scenario_name: string;
  given_steps: string[];
  when_steps: string[];
  then_steps: string[];
  tags: string[];
}

interface TestCase {
  id: string;
  title: string;
  description: string;
  user_story_id: string;
  test_type: 'Functional' | 'Integration' | 'UI' | 'API' | 'Regression' | 'Smoke' | 'End-to-End' | 'Performance' | 'Security' | 'Accessibility';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Not Run' | 'Passed' | 'Failed' | 'Blocked' | 'Skipped';
  preconditions: string[];
  gherkin_scenarios: GherkinScenario[];
  estimated_time_minutes?: number;
  automated: boolean;
  created_date?: string;
  last_executed?: string;
  executed_by?: string;
  gherkin_file?: string;
}
```

---

### 1.3 BugReport (src/models/bug_report.py)

```python
class BugSeverity(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class BugPriority(str, Enum):
    URGENT = "Urgent"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class BugStatus(str, Enum):
    NEW = "New"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    FIXED = "Fixed"
    TESTING = "Testing"
    VERIFIED = "Verified"
    CLOSED = "Closed"
    REOPENED = "Reopened"
    WONT_FIX = "Won't Fix"
    DUPLICATE = "Duplicate"

class BugType(str, Enum):
    FUNCTIONAL = "Functional"
    UI = "UI/UX"
    PERFORMANCE = "Performance"
    SECURITY = "Security"
    COMPATIBILITY = "Compatibility"
    DATA = "Data"
    API = "API"
    CRASH = "Crash"

class BugReport(BaseModel):
    id: Optional[str] = None                   # "BUG-001"
    title: str
    description: str
    steps_to_reproduce: List[str]
    expected_behavior: str
    actual_behavior: str
    severity: BugSeverity = BugSeverity.MEDIUM
    priority: BugPriority = BugPriority.MEDIUM
    bug_type: BugType = BugType.FUNCTIONAL
    status: BugStatus = BugStatus.NEW
    environment: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    version: Optional[str] = None
    user_story_id: Optional[str] = None
    test_case_id: Optional[str] = None
    screenshots: List[str] = []
    reported_by: Optional[str] = None
    assigned_to: Optional[str] = None
    reported_date: Optional[datetime] = None
```

**TypeScript Interface:**
```typescript
interface BugReport {
  id?: string;
  title: string;
  description: string;
  steps_to_reproduce: string[];
  expected_behavior: string;
  actual_behavior: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  bug_type: 'Functional' | 'UI/UX' | 'Performance' | 'Security' | 'Compatibility' | 'Data' | 'API' | 'Crash';
  status: 'New' | 'Assigned' | 'In Progress' | 'Fixed' | 'Testing' | 'Verified' | 'Closed' | 'Reopened' | "Won't Fix" | 'Duplicate';
  environment?: string;
  browser?: string;
  os?: string;
  version?: string;
  user_story_id?: string;
  test_case_id?: string;
  screenshots: string[];
  reported_by?: string;
  assigned_to?: string;
  reported_date?: string;
}
```

---

## 🔌 2. API ENDPOINTS COMPLETOS

**Base URL:** `http://localhost:8000/api/v1`

### 2.1 Health Check

```typescript
GET /
Response: { app: string; version: string; status: string }

GET /health
Response: { status: string; timestamp: string }
```

### 2.2 User Stories

```typescript
POST /upload
Body: FormData (file: File)
Response: {
  message: string;
  user_stories: string[];  // IDs
  file_path: string;
  detected_columns: Record<string, string>;
}

GET /user-stories
Response: Array<{
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  completion_percentage: number;
}>

GET /user-stories/{story_id}
Response: {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  epic?: string;
  sprint?: string;
  story_points?: number;
  completion_percentage: number;
}
```

### 2.3 Test Cases

```typescript
POST /generate-test-cases/{story_id}?use_ai=true&num_scenarios=3
Response: {
  message: string;
  test_case_id: string;
  gherkin_file: string;
  user_story_id: string;
}

GET /test-cases
Response: Array<{
  id: string;
  title: string;
  user_story_id: string;
  test_type: string;
  status: string;
  gherkin_file: string;
}>
```

### 2.4 Test Plans

```typescript
POST /generate-test-plan?project_name=X&format=both
Response: {
  message: string;
  files: {
    markdown?: string;
    pdf?: string;
  }
}
```

### 2.5 Bug Reports

```typescript
POST /generate-bug-template
Response: {
  message: string;
  file: string;
}

POST /create-bug-report
Body: BugReport
Response: {
  message: string;
  bug_id: string;
  document: string;
}
```

### 2.6 Statistics

```typescript
GET /stats
Response: {
  total_user_stories: number;
  total_test_cases: number;
  total_bugs: number;
  stories_by_status: Record<string, number>;
  timestamp: string;
}

Example Response:
{
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
  "timestamp": "2025-11-14T10:30:00"
}
```

### 2.7 File Downloads

```typescript
GET /download/{filename}
Response: Binary file (application/octet-stream)
```

---

## 🗄️ 3. DATABASE MODELS (SQLAlchemy)

### 3.1 UserStoryDB

```python
class UserStoryDB(Base):
    __tablename__ = "user_stories"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(SQLEnum(Priority))
    status = Column(SQLEnum(Status))
    epic = Column(String)
    sprint = Column(String)
    story_points = Column(Integer)
    assigned_to = Column(String)
    created_date = Column(DateTime, default=datetime.now)
    updated_date = Column(DateTime, onupdate=datetime.now)
    total_criteria = Column(Integer, default=0)
    completed_criteria = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)
    notion_page_id = Column(String)
    azure_work_item_id = Column(String)

    # Relationships
    test_cases = relationship("TestCaseDB")
    bug_reports = relationship("BugReportDB")
```

### 3.2 TestCaseDB

```python
class TestCaseDB(Base):
    __tablename__ = "test_cases"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    user_story_id = Column(String, ForeignKey("user_stories.id"))
    test_type = Column(SQLEnum(TestType))
    priority = Column(SQLEnum(TestPriority))
    status = Column(SQLEnum(TestStatus))
    estimated_time_minutes = Column(Integer)
    automated = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.now)
    last_executed = Column(DateTime)
    executed_by = Column(String)
    gherkin_file_path = Column(String)

    # Relationships
    user_story = relationship("UserStoryDB", back_populates="test_cases")
```

### 3.3 BugReportDB

```python
class BugReportDB(Base):
    __tablename__ = "bug_reports"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(SQLEnum(BugSeverity))
    priority = Column(SQLEnum(BugPriority))
    bug_type = Column(SQLEnum(BugType))
    status = Column(SQLEnum(BugStatus))
    environment = Column(String)
    browser = Column(String)
    os = Column(String)
    user_story_id = Column(String, ForeignKey("user_stories.id"))
    test_case_id = Column(String)
    reported_by = Column(String)
    assigned_to = Column(String)
    reported_date = Column(DateTime, default=datetime.now)
    document_path = Column(String)

    # Relationships
    user_story = relationship("UserStoryDB", back_populates="bug_reports")
```

---

## ⚙️ 4. CONFIGURACIÓN (src/config.py)

```python
class Settings(BaseSettings):
    # Application
    app_name: str = "QA Documentation Automation"
    app_version: str = "1.0.0"
    debug: bool = False

    # AI
    gemini_api_key: str                        # REQUIRED

    # Database
    database_url: str = "sqlite:///./data/qa_automation.db"

    # Directories
    output_dir: str = "./output"
    upload_dir: str = "./uploads"

    # File Upload
    max_upload_size_mb: int = 10
    allowed_extensions: str = "xlsx,csv"
```

**Variables de entorno (.env):**
```bash
GEMINI_API_KEY=AIzaSyASEXfrbnPp2oXxTmUCsDAMgts53NCgb60
DEBUG=True
DATABASE_URL=sqlite:///./data/qa_automation.db
OUTPUT_DIR=./output
UPLOAD_DIR=./uploads
```

---

## 🎨 5. MOCKUPS DE REFERENCIA

### 5.1 Dashboard Principal

```
┌────────────────────────────────────────────────────────────────┐
│  🎯 QA Flow                                     👤 Jordan  [▼] │
├──────────────┬─────────────────────────────────────────────────┤
│              │  📊 Dashboard - Pilsen Fresh                    │
│  📁 Projects │                                                 │
│  📝 Stories  │  ┌──────────┬──────────┬──────────┬──────────┐ │
│  ✅ Tests    │  │    15    │    45    │    3     │   85%    │ │
│  🐛 Bugs     │  │  Stories │  Tests   │  Bugs    │ Coverage │ │
│  📊 Reports  │  └──────────┴──────────┴──────────┴──────────┘ │
│  ⚙️  Settings│                                                 │
│              │  📈 Progreso del Sprint                         │
│              │  ████████████████░░░░░░ 70%                    │
│              │                                                 │
│              │  🎯 Acciones Rápidas                           │
│              │  [📤 Subir Excel] [✨ Generar Tests]           │
│              │  [📄 Exportar PDF] [📊 Ver Métricas]           │
└──────────────┴─────────────────────────────────────────────────┘
```

### 5.2 User Stories Table

```
┌────────────────────────────────────────────────────────────────┐
│  📝 User Stories > Pilsen Fresh                                │
├────────────────────────────────────────────────────────────────┤
│  [📤 Subir Excel] [➕ Nueva Historia] [🔍 Buscar...] [⚙️ Filtros]│
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ID      │ Título              │ Prioridad │ Tests │ Estado│ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ US-001  │ Login de usuario    │ 🔴 Alta   │ 3/3 ✅│ Done  │ │
│  │ US-002  │ Recuperar password  │ 🟡 Media  │ 2/2 ✅│ Done  │ │
│  │ US-003  │ Perfil de usuario   │ 🟢 Baja   │ 0/3 ⏳│ To Do │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎨 6. DISEÑO (Colores y Estilos)

### Paleta de Colores:
```css
/* Primary Colors */
--primary-blue: #667eea;
--primary-purple: #764ba2;

/* Status Colors */
--success-green: #10b981;
--warning-yellow: #fbbf24;
--error-red: #ef4444;
--info-blue: #3b82f6;

/* Priority Colors */
--critical: #dc2626;    /* Red */
--high: #f97316;        /* Orange */
--medium: #eab308;      /* Yellow */
--low: #6b7280;         /* Gray */

/* Neutrals */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-900: #111827;
```

### Componentes de UI:
- **Cards:** Bordes redondeados, sombras suaves, padding generoso
- **Sidebar:** Ancho 256px, fondo degradado o sólido
- **Buttons:** Bordes redondeados, transiciones smooth
- **Tables:** Filas con hover, alternadas en color
- **Modals:** Overlay oscuro, animación fade-in

---

## 🚀 7. FEATURES CLAVE DEL BACKEND

### 7.1 Parser de Excel (src/parsers/file_parser.py)

**Características:**
- Auto-detección de columnas (flexible naming)
- Soporta variantes: "ID", "User Story ID", "Story ID"
- Salta Epics automáticamente
- Parsea criterios de aceptación con múltiples separadores

**Column Mappings:**
```python
COLUMN_MAPPINGS = {
    "id": ["id", "story_id", "user_story_id", "us_id", "key"],
    "title": ["title", "summary", "name", "story_name"],
    "description": ["description", "desc", "details", "story"],
    "acceptance_criteria": ["acceptance_criteria", "acceptance", "criteria", "ac"],
    "priority": ["priority", "pri", "importance"],
    "status": ["status", "state", "workflow_state"],
}
```

### 7.2 Gemini AI Client (src/integrations/gemini_client.py)

**Modelo:** `gemini-2.5-flash`

**Funciones principales:**
```python
generate_gherkin_scenarios(user_story, num_scenarios=3) -> List[GherkinScenario]
# Genera escenarios BDD específicos usando criterios de aceptación

suggest_test_types(user_story) -> List[TestType]
# Recomienda tipos de tests apropiados

improve_acceptance_criteria(user_story) -> List[str]
# Sugiere mejoras a los criterios
```

**Prompt Key Points:**
- Lee criterios de aceptación cuidadosamente
- Genera escenarios específicos (no genéricos)
- Include Happy Path, Negative, Edge Cases
- Usa nombres exactos de campos
- Devuelve JSON estructurado

### 7.3 Generadores

**GherkinGenerator:**
- Genera archivos `.feature` en formato BDD
- Integrado con Gemini AI
- Fallback a generación básica sin IA

**TestPlanGenerator:**
- Genera Markdown + PDF
- Incluye: User Stories, Test Cases, Matriz de trazabilidad
- Usa reportlab para PDF

**BugReportGenerator:**
- Genera templates en Word (.docx)
- Incluye: campos standard, tablas, formato profesional

---

## 📝 8. FLUJOS DE TRABAJO CLAVE

### Flujo 1: Upload Excel → Generate Tests

```typescript
1. POST /api/v1/upload (FormData con Excel)
   → Response: { user_stories: ["US-001", "US-002"] }

2. GET /api/v1/user-stories
   → Muestra lista en tabla

3. User selecciona stories (checkbox)

4. POST /api/v1/generate-test-cases/US-001?use_ai=true&num_scenarios=3
   → Response: { test_case_id: "TC-001", gherkin_file: "path/to/file.feature" }

5. GET /api/v1/stats
   → Dashboard se actualiza con nuevos números
```

### Flujo 2: Dashboard Metrics

```typescript
1. Component mounts

2. GET /api/v1/stats
   → Response: {
       total_user_stories: 15,
       total_test_cases: 45,
       total_bugs: 3,
       stories_by_status: {...}
     }

3. Render MetricCards con datos

4. Auto-refresh cada 30 segundos (opcional)
```

### Flujo 3: Create Bug Report

```typescript
1. User llena formulario BugForm

2. POST /api/v1/create-bug-report
   Body: {
     title: "Login falla con espacios",
     description: "...",
     steps_to_reproduce: ["1. ...", "2. ..."],
     expected_behavior: "...",
     actual_behavior: "...",
     severity: "High",
     user_story_id: "US-001"
   }

3. Response: { bug_id: "BUG-001", document: "path/to/report.docx" }

4. Update bugs table
```

---

## 🔧 9. CONFIGURACIÓN FRONTEND

### package.json (dependencies esperadas)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.0",
    "@tanstack/react-table": "^8.10.0",
    "react-hook-form": "^7.48.0",
    "react-dropzone": "^14.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

### tailwind.config.js

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#667eea',
          purple: '#764ba2',
        },
        status: {
          success: '#10b981',
          warning: '#fbbf24',
          error: '#ef4444',
        }
      }
    }
  },
  plugins: []
}
```

---

## 🗂️ 10. ESTRUCTURA DE ARCHIVOS BACKEND

```
src/
├── config.py                      # Settings con Pydantic
├── main.py                        # FastAPI app
├── cli.py                         # CLI con Typer
│
├── models/                        # Pydantic models
│   ├── __init__.py
│   ├── user_story.py              # UserStory, AcceptanceCriteria, Priority, Status
│   ├── test_case.py               # TestCase, GherkinScenario, TestType, TestStatus
│   └── bug_report.py              # BugReport, BugSeverity, BugPriority
│
├── database/                      # SQLAlchemy ORM
│   ├── __init__.py
│   ├── db.py                      # Engine, SessionLocal, get_db()
│   └── models.py                  # UserStoryDB, TestCaseDB, BugReportDB
│
├── parsers/
│   ├── __init__.py
│   └── file_parser.py             # FileParser class (Excel/CSV)
│
├── generators/
│   ├── __init__.py
│   ├── gherkin_generator.py       # GherkinGenerator
│   ├── test_plan_generator.py     # TestPlanGenerator
│   └── bug_report_generator.py    # BugReportGenerator
│
├── integrations/
│   ├── __init__.py
│   └── gemini_client.py           # GeminiClient (AI)
│
└── api/
    ├── __init__.py
    ├── routes.py                  # All API endpoints
    └── dependencies.py            # get_gemini_client()
```

---

## ✅ 11. CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Setup
- [ ] Crear proyecto Vite + React + TypeScript
- [ ] Configurar Tailwind CSS
- [ ] Crear archivo `types/api.ts` con todas las interfaces
- [ ] Crear `services/api.ts` con Axios client
- [ ] Configurar proxy en vite.config.ts

### Fase 2: Layout
- [ ] Crear componente `Layout.tsx`
- [ ] Crear componente `Sidebar.tsx`
- [ ] Crear componente `Header.tsx`
- [ ] Configurar React Router

### Fase 3: Dashboard
- [ ] Crear componente `MetricCard.tsx`
- [ ] Crear componente `Dashboard.tsx`
- [ ] Conectar con `/api/v1/stats`
- [ ] Mostrar métricas en tiempo real

### Fase 4: User Stories
- [ ] Crear `StoriesTable.tsx` con TanStack Table
- [ ] Crear `StoryDetail.tsx` (modal)
- [ ] Crear botón "Upload Excel"
- [ ] Crear botón "Generate Tests"

### Fase 5: Test Cases
- [ ] Crear `TestCasesTable.tsx`
- [ ] Crear `GherkinViewer.tsx` con syntax highlighting
- [ ] Botón "Mark Pass/Fail"

### Fase 6: Bug Reports
- [ ] Crear `BugForm.tsx` con React Hook Form
- [ ] Crear `BugsTable.tsx`
- [ ] Vincular con Stories y Tests

---

## 📚 12. RECURSOS Y REFERENCIAS

### Documentación Backend:
- FastAPI Docs: http://localhost:8000/docs
- Swagger UI: http://localhost:8000/redoc

### Archivos Importantes:
- `.env` - Variables de entorno (NO commitear)
- `requirements.txt` - Dependencies Python
- `data/qa_automation.db` - SQLite database

### Comandos Útiles:
```bash
# Iniciar backend
python -m src.cli server

# Parsear Excel
python -m src.cli parse ejemplo_user_stories.xlsx

# Generar tests
python -m src.cli generate-tests US-001 --use-ai

# Ver stats
python -m src.cli stats
```

---

**Última Actualización:** 2025-11-14
**Versión:** 1.0
**Autor:** Claude (Sonnet 4.5)

---

## ⚡ QUICK START PARA FRONTEND

```bash
# 1. Crear proyecto
npm create vite@latest frontend-react -- --template react-ts
cd frontend-react
npm install

# 2. Install dependencies
npm install axios zustand @tanstack/react-table react-hook-form react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. Copiar tipos desde este documento a src/types/api.ts
# 4. Crear src/services/api.ts con Axios
# 5. Iniciar dev server
npm run dev
```

**API ya funcionando en:** http://localhost:8000/api/v1
**Frontend dev server:** http://localhost:3000 (o 5173)

---

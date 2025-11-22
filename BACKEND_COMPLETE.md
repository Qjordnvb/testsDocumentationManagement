# Backend Complete - QA Documentation System

**Framework**: FastAPI 0.109.0
**Database**: SQLAlchemy + SQLite
**Updated**: 2025-11-22

---

## 📋 Índice

1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura de Directorios](#estructura-de-directorios)
3. [Modelos de Base de Datos](#modelos-de-base-de-datos)
4. [Sistema de Autenticación](#sistema-de-autenticación)
5. [Endpoints API](#endpoints-api)
6. [Generadores](#generadores)
7. [Integración Gemini AI](#integración-gemini-ai)
8. [Configuración](#configuración)

---

## STACK TECNOLÓGICO

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| Framework | FastAPI | 0.109.0 | REST API |
| ASGI Server | Uvicorn | latest | HTTP server |
| ORM | SQLAlchemy | 2.0.25 | Database abstraction |
| Database | SQLite | 3.x | Development (PostgreSQL en prod) |
| Validation | Pydantic | 2.5.3 | DTO validation |
| Password Hashing | bcrypt (passlib) | latest | Secure passwords |
| JWT | python-jose | latest | Token generation |
| AI | Google Gemini | 2.5-flash | Test case generation |
| PDF | ReportLab | latest | PDF generation |
| DOCX | python-docx | latest | DOCX generation |
| Excel | pandas + openpyxl | latest | Excel parsing |

---

## ESTRUCTURA DE DIRECTORIOS

```
backend/
├── api/
│   └── endpoints/
│       ├── auth.py              # ✨ Authentication (check-email, register, login)
│       ├── users.py             # ✨ User management (invite, CRUD)
│       ├── projects.py          # Project CRUD + stats
│       ├── user_stories.py      # Stories CRUD + Excel upload
│       ├── test_cases.py        # Test cases CRUD + AI generation
│       └── bugs.py              # Bug reports
│
├── database/
│   ├── db.py                    # SQLAlchemy setup, SessionLocal
│   └── models.py                # ✨ All DB models (UserDB, ProjectDB, etc)
│
├── models/
│   ├── user.py                  # ✨ User DTOs (CheckEmail, Register, etc)
│   ├── project.py               # Project DTOs
│   ├── user_story.py            # UserStory DTOs + AcceptanceCriteria
│   ├── test_case.py             # TestCase DTOs + GherkinScenario
│   └── bug_report.py            # BugReport DTOs
│
├── generators/
│   ├── gherkin_generator.py     # Generates .feature files
│   ├── test_plan_generator.py   # Generates PDF/DOCX test plans
│   └── bug_report_generator.py  # Generates bug documentation
│
├── integrations/
│   └── gemini_client.py         # Google Gemini AI client
│
├── parsers/
│   └── file_parser.py           # Excel/CSV parser
│
├── config.py                    # ✨ Settings (JWT_SECRET, DB_URL, etc)
├── main.py                      # FastAPI app entry point
└── migrate_invitation_system.py # ✨ Database migration (executed)
```

---

## MODELOS DE BASE DE DATOS

### UserDB (Autenticación)

```python
class UserDB(Base):
    __tablename__ = "users"

    # Identity
    id: str (PK)                 # USR-001, USR-002, ...
    email: str (UNIQUE, INDEX)
    password_hash: str (NULLABLE) # ← Nullable for invitations
    full_name: str

    # Authorization
    role: str                    # admin, qa, dev, manager

    # Status
    is_active: bool = True
    is_registered: bool = False  # ← True after user completes registration

    # Invitation tracking
    invited_by: str (NULLABLE)   # Email of admin who created invitation
    invited_at: datetime (NULLABLE)
    registered_at: datetime (NULLABLE)

    # Metadata
    created_at: datetime
    created_by: str (FK → users.id)
    updated_at: datetime
    last_login: datetime (NULLABLE)
```

### ProjectDB

```python
class ProjectDB(Base):
    __tablename__ = "projects"

    id: str (PK, INDEX)          # PROJ-001, PROJ-002, ...
    name: str
    description: text (NULLABLE)
    client: str (NULLABLE)
    team_members: text (NULLABLE) # JSON array
    status: str                   # active, archived, completed
    default_test_types: text (NULLABLE) # JSON array
    start_date: datetime (NULLABLE)
    end_date: datetime (NULLABLE)
    created_date: datetime
    updated_date: datetime
    created_by: str (FK → users.id)

    # Relationships (CASCADE DELETE)
    user_stories → OneToMany UserStoryDB
    test_cases → OneToMany TestCaseDB
    bug_reports → OneToMany BugReportDB
```

### UserStoryDB

```python
class UserStoryDB(Base):
    __tablename__ = "user_stories"

    id: str (PK, INDEX)
    project_id: str (FK → projects.id, INDEX) # ← CRITICAL for filtering
    title: str
    description: text
    acceptance_criteria: text (NULLABLE)       # JSON array
    priority: str                              # CRITICAL, HIGH, MEDIUM, LOW
    status: str                                # BACKLOG, TODO, IN_PROGRESS, etc
    epic: str (NULLABLE)
    sprint: str (NULLABLE)
    story_points: int (NULLABLE)
    assigned_to: str (NULLABLE)
    created_date: datetime
    updated_date: datetime

    # Acceptance Criteria metrics
    total_criteria: int = 0
    completed_criteria: int = 0
    completion_percentage: float = 0.0

    # Relationships
    project → ManyToOne ProjectDB
    test_cases → OneToMany TestCaseDB
    bug_reports → OneToMany BugReportDB
```

### TestCaseDB

```python
class TestCaseDB(Base):
    __tablename__ = "test_cases"

    id: str (PK, INDEX)
    project_id: str (FK → projects.id, INDEX)  # ← CRITICAL
    user_story_id: str (FK → user_stories.id)
    title: str
    description: text
    test_type: str                # FUNCTIONAL, UI, API, INTEGRATION, etc
    priority: str                 # CRITICAL, HIGH, MEDIUM, LOW
    status: str                   # NOT_RUN, PASSED, FAILED, BLOCKED, SKIPPED
    estimated_time_minutes: int (NULLABLE)
    actual_time_minutes: int (NULLABLE)
    automated: bool = False
    created_date: datetime
    last_executed: datetime (NULLABLE)
    executed_by: str (NULLABLE)
    gherkin_file_path: str (NULLABLE) # output/gherkin/TC-001.feature

    # Relationships
    project → ManyToOne ProjectDB
    user_story → ManyToOne UserStoryDB
    executions → OneToMany TestExecutionDB
```

### BugReportDB

```python
class BugReportDB(Base):
    __tablename__ = "bug_reports"

    id: str (PK, INDEX)
    project_id: str (FK → projects.id, INDEX)  # ← CRITICAL
    title: str
    description: text
    severity: str                 # CRITICAL, HIGH, MEDIUM, LOW
    priority: str                 # URGENT, HIGH, MEDIUM, LOW
    bug_type: str                 # FUNCTIONAL, UI, PERFORMANCE, SECURITY, etc
    status: str                   # NEW, ASSIGNED, IN_PROGRESS, FIXED, etc
    environment: str (NULLABLE)
    browser: str (NULLABLE)
    os: str (NULLABLE)
    version: str (NULLABLE)
    user_story_id: str (FK → user_stories.id, NULLABLE)
    test_case_id: str (NULLABLE)
    reported_by: str (NULLABLE)
    assigned_to: str (NULLABLE)
    verified_by: str (NULLABLE)
    reported_date: datetime
    assigned_date: datetime (NULLABLE)
    fixed_date: datetime (NULLABLE)
    verified_date: datetime (NULLABLE)
    closed_date: datetime (NULLABLE)
    document_path: str (NULLABLE)

    # Relationships
    project → ManyToOne ProjectDB
    user_story → ManyToOne UserStoryDB
```

---

## SISTEMA DE AUTENTICACIÓN

### Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/check-email` | POST | No | Validate email in whitelist + registration status |
| `/auth/register` | POST | No | Complete registration (set password) |
| `/auth/login` | POST | No | Login with email + password |
| `/auth/logout` | POST | Yes | Logout (optional, JWT is stateless) |
| `/auth/me` | GET | Yes | Get current user info |

### JWT Configuration

```python
# config.py
class Settings(BaseSettings):
    jwt_secret_key: str = "your-secret-key-here"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
```

### Password Security

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash password
hashed = pwd_context.hash("plain_password")

# Verify password
is_valid = pwd_context.verify("plain_password", hashed)
```

### Dependencies (Authorization)

```python
# Require authentication
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> UserDB:
    # Decode JWT, validate, return user
    ...

# Require specific role
def require_role(*roles: Role):
    def dependency(current_user: UserDB = Depends(get_current_user)) -> UserDB:
        if current_user.role not in [r.value for r in roles]:
            raise HTTPException(403, "Insufficient permissions")
        return current_user
    return dependency

# Usage
@router.post("/users/invite")
async def create_invitation(
    current_user: UserDB = Depends(require_role(Role.ADMIN))
):
    ...
```

---

## ENDPOINTS API

**Base URL**: `http://localhost:8000/api/v1`

### Authentication (`api/endpoints/auth.py`)

**POST /auth/check-email**
```python
Request: {"email": "qa@company.com"}
Response: {
    "exists": true,
    "is_registered": false,
    "full_name": null
}
```

**POST /auth/register**
```python
Request: {
    "email": "qa@company.com",
    "password": "securepass123",
    "full_name": "QA Engineer"
}
Response: {
    "access_token": "eyJ...",
    "token_type": "bearer",
    "user": {...}
}
```

**POST /auth/login**
```python
Request: {"email": "qa@company.com", "password": "securepass123"}
Response: {
    "access_token": "eyJ...",
    "token_type": "bearer",
    "user": {...}
}
```

### Users (`api/endpoints/users.py`)

**POST /users/invite** (Admin only)
```python
Request: {
    "email": "qa@company.com",
    "full_name": "QA Engineer",
    "role": "qa"
}
Response: {
    "message": "Invitación creada para qa@company.com",
    "user_id": "USR-002",
    "status": "pending_registration"
}
```

**GET /users** (Admin, Manager)
```python
Response: [{
    "id": "USR-001",
    "email": "admin@qa-system.com",
    "full_name": "Admin User",
    "role": "admin",
    "is_active": true,
    "is_registered": true
}, ...]
```

### Projects (`api/endpoints/projects.py`)

**GET /projects**
```python
Response: {
    "projects": [{
        "id": "PROJ-001",
        "name": "E-commerce App",
        "total_user_stories": 15,
        "total_test_cases": 45,
        "total_bugs": 3,
        "test_coverage": 95.5
    }]
}
```

**POST /projects**
```python
Request: {
    "name": "Mobile Banking App",
    "description": "QA for mobile banking",
    "client": "Bank XYZ",
    "default_test_types": ["FUNCTIONAL", "SECURITY"]
}
Response: {"id": "PROJ-002", ...}
```

### User Stories (`api/endpoints/user_stories.py`)

**POST /upload?project_id=PROJ-001**
```python
FormData: file (Excel/CSV)
Response: {
    "message": "Successfully processed file",
    "inserted": 10,
    "updated": 5,
    "total": 15
}
```

**GET /user-stories?project_id=PROJ-001**
```python
Response: {
    "user_stories": [{
        "id": "US-001",
        "title": "User Login",
        "acceptance_criteria": [{
            "id": "AC-1",
            "description": "Validar email",
            "completed": false
        }],
        "total_criteria": 3,
        "completion_percentage": 33.3
    }]
}
```

### Test Cases (`api/endpoints/test_cases.py`)

**POST /generate-test-cases/{story_id}/preview**
```python
Query: ?num_test_cases=5&scenarios_per_test=3&test_types=FUNCTIONAL,UI
Response: {
    "user_story_id": "US-001",
    "suggested_test_cases": [{
        "suggested_id": "TC-temp-001",
        "title": "Verify login with valid credentials",
        "gherkin_content": "Feature: Login...",
        "can_edit": true
    }]
}
```

**POST /test-cases/batch**
```python
Request: {
    "user_story_id": "US-001",
    "test_cases": [...]
}
Response: {
    "message": "Created 5 test cases successfully",
    "created_count": 5,
    "test_cases": [...]
}
```

**GET /test-cases/{id}/gherkin**
```python
Response: {
    "test_case_id": "TC-001",
    "file_path": "output/gherkin/TC-001.feature",
    "gherkin_content": "Feature: Login\n  Scenario: ..."
}
```

**PUT /test-cases/{id}/gherkin**
```python
Request: {"gherkin_content": "Feature: ..."}
Response: {"message": "Gherkin content updated successfully"}
```

---

## GENERADORES

### Gherkin Generator

```python
# generators/gherkin_generator.py
class GherkinGenerator:
    def generate_feature_file(
        self,
        test_case: TestCase,
        output_path: str = "output/gherkin"
    ) -> str:
        # Generate .feature file content
        # Write to file: {output_path}/{test_case_id}.feature
        # Return file path
```

### Test Plan Generator

```python
# generators/test_plan_generator.py
class TestPlanGenerator:
    def generate_test_plan(
        self,
        project_name: str,
        user_stories: List[UserStory],
        test_cases: List[TestCase],
        format: str = "both"  # pdf, docx, both
    ) -> dict:
        # Generate PDF/DOCX test plan
        # Return {"pdf": "path/to/file.pdf", "docx": "path/to/file.docx"}
```

### Bug Report Generator

```python
# generators/bug_report_generator.py
class BugReportGenerator:
    def generate_bug_report(
        self,
        bug: BugReport,
        output_path: str = "output/bugs"
    ) -> str:
        # Generate Markdown bug report
        # Write to file: {output_path}/{bug_id}.md
        # Return file path
```

---

## INTEGRACIÓN GEMINI AI

### Configuración

```python
# integrations/gemini_client.py
import google.generativeai as genai

genai.configure(api_key=settings.gemini_api_key)

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config={
        "temperature": 0.7,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 8192,
    }
)
```

### Uso en Test Generation

```python
class GeminiClient:
    def generate_test_cases(
        self,
        user_story: UserStory,
        num_test_cases: int = 5,
        scenarios_per_test: int = 3,
        test_types: List[str] = ["FUNCTIONAL"]
    ) -> List[TestCase]:
        # Build prompt with user story details
        prompt = self._build_test_generation_prompt(...)

        # Call Gemini
        response = model.generate_content(prompt)

        # Parse JSON response
        test_cases = self._parse_test_cases_response(response.text)

        return test_cases
```

---

## CONFIGURACIÓN

### Environment Variables (`.env`)

```bash
# App
APP_NAME="QA Documentation Automation"
APP_VERSION="1.0.0"
DEBUG=false

# Database
DATABASE_URL=sqlite:///./data/qa_automation.db

# JWT
JWT_SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Gemini AI (REQUIRED)
GEMINI_API_KEY=your_api_key_here

# Upload
MAX_UPLOAD_SIZE_MB=10
ALLOWED_EXTENSIONS=xlsx,csv

# Output
OUTPUT_DIR=./output
UPLOAD_DIR=./uploads
```

### Settings Class

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "QA Documentation Automation"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database
    database_url: str = "sqlite:///./data/qa_automation.db"

    # JWT
    jwt_secret_key: str  # REQUIRED
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    # Gemini AI
    gemini_api_key: str  # REQUIRED

    # Upload
    max_upload_size_mb: int = 10
    allowed_extensions: str = "xlsx,csv"
    output_dir: str = "./output"
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
```

---

## DEPLOYMENT

### Development

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
# Option 1: Uvicorn with workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Option 2: Gunicorn + Uvicorn workers
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Database Migration (SQLite → PostgreSQL)

```python
# 1. Update .env
DATABASE_URL=postgresql://user:password@host:5432/qa_automation

# 2. Install driver
pip install psycopg2-binary

# 3. Run migration (SQLAlchemy handles dialect)
python -c "from database.db import engine; from database.models import Base; Base.metadata.create_all(engine)"
```

---

**Última Actualización**: 2025-11-22
**Versión**: 2.0

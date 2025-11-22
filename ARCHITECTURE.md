# Arquitectura y Funcionamiento Completo - QA Documentation System

**Fecha**: 2025-11-22
**Versión**: 2.0 (Con Sistema de Autenticación)
**Estado**: Producción Ready

---

## 📋 Tabla de Contenido

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Sistema de Autenticación](#sistema-de-autenticación)
5. [Flujos de Usuario](#flujos-de-usuario)
6. [Arquitectura de Datos](#arquitectura-de-datos)
7. [Integración Frontend-Backend](#integración-frontend-backend)
8. [Seguridad](#seguridad)
9. [Deployment](#deployment)

---

## VISIÓN GENERAL

### Propósito del Sistema

Sistema web para **automatizar la documentación de QA** con:
- ✅ Gestión de múltiples proyectos
- ✅ Sistema de autenticación basado en invitaciones
- ✅ Control de acceso por roles (RBAC)
- ✅ Importación de User Stories desde Excel
- ✅ Generación de Test Cases con IA (Gemini)
- ✅ Editor Gherkin para BDD
- ✅ Gestión de Bugs
- ✅ Generación de Test Plans (PDF/DOCX)

### Usuarios del Sistema

| Rol | Descripción | Permisos Especiales |
|-----|-------------|---------------------|
| **admin** | Administrador del sistema | Gestión de usuarios, crear invitaciones |
| **qa** | QA Engineer | Acceso completo a proyectos |
| **dev** | Developer | Acceso completo a proyectos |
| **manager** | Project Manager | Acceso completo a proyectos |

---

## ARQUITECTURA DEL SISTEMA

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                      USUARIO (Browser)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React SPA)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Module  │  │ Projects     │  │ Test Gen     │     │
│  │ - Login      │  │ - Stories    │  │ - AI Preview │     │
│  │ - Register   │  │ - Test Cases │  │ - Gherkin    │     │
│  │ - Invite     │  │ - Bugs       │  │ - Reports    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  State Management: Context API (Auth + Project)            │
│  Router: React Router v6 (Protected Routes)                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP REST API + JWT
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth API     │  │ Projects API │  │ Generators   │     │
│  │ - JWT Tokens │  │ - CRUD       │  │ - Test Plans │     │
│  │ - Roles      │  │ - Upload     │  │ - Gherkin    │     │
│  │ - Invites    │  │ - AI Gen     │  │ - Bug Docs   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ORM: SQLAlchemy | Validation: Pydantic                    │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (SQLite)                         │
│  Tables: users, projects, user_stories, test_cases, bugs   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                              │
│  - Google Gemini AI (Test Generation)                      │
│  - File System (Gherkin .feature files, Reports)           │
└─────────────────────────────────────────────────────────────┘
```

### Arquitectura de Capas

```
┌─────────────────────────────────────────────┐
│  PRESENTATION LAYER (Frontend)              │
│  - React Components                         │
│  - Feature-Sliced Design                    │
│  - Context Providers (Auth, Project)        │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│  API LAYER (FastAPI Endpoints)              │
│  - /auth/* (Authentication)                 │
│  - /projects/* (Project Management)         │
│  - /user-stories/* (Stories + Upload)       │
│  - /test-cases/* (CRUD + AI Generation)     │
│  - /bugs/* (Bug Reporting)                  │
└──────────────────┬──────────────────────────┘
                   │ Dependencies
┌──────────────────▼──────────────────────────┐
│  BUSINESS LOGIC LAYER                       │
│  - Generators (Test Plan, Gherkin, Bugs)    │
│  - Parsers (Excel/CSV)                      │
│  - Integrations (Gemini AI)                 │
│  - Validators (Pydantic DTOs)               │
└──────────────────┬──────────────────────────┘
                   │ ORM
┌──────────────────▼──────────────────────────┐
│  DATA ACCESS LAYER (SQLAlchemy)             │
│  - Models (UserDB, ProjectDB, etc)          │
│  - Sessions (SessionLocal)                  │
│  - Migrations                               │
└──────────────────┬──────────────────────────┘
                   │ SQL
┌──────────────────▼──────────────────────────┐
│  PERSISTENCE LAYER (SQLite)                 │
│  - data/qa_automation.db                    │
└─────────────────────────────────────────────┘
```

---

## STACK TECNOLÓGICO

### Backend
| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| Framework | FastAPI | 0.109.0 | REST API |
| ASGI Server | Uvicorn | - | HTTP server |
| ORM | SQLAlchemy | 2.0.25 | Database abstraction |
| Database | SQLite | 3.x | Local development |
| Validation | Pydantic | 2.5.3 | DTO validation |
| Auth | JWT + bcrypt | - | Authentication |
| AI | Google Gemini | 2.5-flash | Test generation |
| PDF/DOCX | ReportLab + python-docx | - | Document generation |
| Excel | pandas + openpyxl | - | File parsing |

### Frontend
| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| Framework | React | 18.x | UI framework |
| Language | TypeScript | 5.x | Type safety |
| Build Tool | Vite | 5.x | Fast builds |
| Router | React Router | 6.x | Navigation |
| State | Context API | - | Global state |
| HTTP Client | Axios | - | API calls |
| UI | TailwindCSS | 3.x | Styling |
| Icons | lucide-react | - | Icons |
| Notifications | react-hot-toast | - | Toasts |

---

## SISTEMA DE AUTENTICACIÓN

### Arquitectura de Autenticación

```
┌──────────────────────────────────────────────────────────────┐
│                   INVITATION FLOW                            │
└──────────────────────────────────────────────────────────────┘

1. ADMIN CREATES INVITATION
   ↓
   POST /users/invite {email, full_name, role}
   ↓
   DB: INSERT users (email, full_name, role, is_registered=FALSE)
   ↓
   User in whitelist but NOT registered

2. USER REGISTRATION
   ↓
   POST /auth/check-email {email}
   ↓
   Response: {exists: true, is_registered: false}
   ↓
   Frontend shows: RegisterStep component
   ↓
   POST /auth/register {email, password, full_name}
   ↓
   DB: UPDATE users SET password_hash=hash, is_registered=TRUE
   ↓
   Response: {access_token: JWT, user: {...}}
   ↓
   Auto-login (save token to sessionStorage)

3. USER LOGIN (subsequent)
   ↓
   POST /auth/check-email {email}
   ↓
   Response: {exists: true, is_registered: true, full_name: "..."}
   ↓
   Frontend shows: LoginPasswordStep component
   ↓
   POST /auth/login {email, password}
   ↓
   Backend: verify password_hash + validate is_registered=TRUE
   ↓
   Response: {access_token: JWT, user: {...}}
   ↓
   Save token to sessionStorage

4. ACCESS DENIED
   ↓
   POST /auth/check-email {email}
   ↓
   Response: {exists: false}
   ↓
   Frontend shows: AccessDeniedPage component
```

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "USR-001",        // user_id
    "role": "admin",          // user role
    "exp": 1732320000         // expiration (24h)
  },
  "signature": "..."
}
```

### Protected Routes

**Frontend** (`ProtectedRoute.tsx`):
```typescript
// Check authentication
if (!isAuthenticated) → redirect to /login

// Check role (if required)
if (requiredRoles && !hasRole(...requiredRoles)) → Access Denied
```

**Backend** (FastAPI dependencies):
```python
# Require authentication
current_user: UserDB = Depends(get_current_user)

# Require specific role
current_user: UserDB = Depends(require_role(Role.ADMIN))
```

---

## FLUJOS DE USUARIO

### 1. Flujo de Autenticación (Primer Login)

```
User → /login → Enter email
                    ↓
            Check email in DB
                    ↓
        ┌───────────┴───────────┐
        │                       │
   Email NOT found         Email found
        │                       │
        ↓                       ↓
  Access Denied         is_registered?
                              ↓
                    ┌─────────┴─────────┐
                    │                   │
                 FALSE                TRUE
                    │                   │
                    ↓                   ↓
            Register Form         Password Form
            (set password)        (enter password)
                    │                   │
                    ↓                   ↓
            Create account         Validate password
                    │                   │
                    └─────────┬─────────┘
                              ↓
                      Generate JWT token
                              ↓
                    Save to sessionStorage
                              ↓
                      Navigate to Dashboard
```

### 2. Flujo de Gestión de Proyectos

```
User → Projects List (/)
          ↓
    Click "Create Project"
          ↓
    Fill form: name, description, client, dates
          ↓
    POST /projects
          ↓
    Project created (PROJ-XXX)
          ↓
    Navigate to /projects/PROJ-XXX/dashboard
          ↓
    ProjectContext sets currentProject
          ↓
    All subsequent API calls include project_id
```

### 3. Flujo de User Stories + AI Generation

```
User → /projects/PROJ-001/stories
          ↓
    Upload Excel file
          ↓
    POST /upload?project_id=PROJ-001
          ↓
    Backend parses: columns, acceptance criteria
          ↓
    Save to DB with project_id
          ↓
    Stories displayed in table
          ↓
    User clicks "Generate Tests" on US-001
          ↓
    Configure: 5 tests, 3 scenarios, types=[FUNCTIONAL, UI]
          ↓
    POST /generate-test-cases/US-001/preview
          ↓
    Backend calls Gemini AI with prompt
          ↓
    AI returns test cases (JSON)
          ↓
    Frontend shows ReviewModal (editable preview)
          ↓
    User reviews, edits titles/descriptions
          ↓
    User clicks "Save All"
          ↓
    POST /test-cases/batch
          ↓
    Backend saves to DB + writes .feature files
          ↓
    Navigate to Test Cases page
```

### 4. Flujo de Edición de Gherkin

```
User → /projects/PROJ-001/tests
          ↓
    Click "Edit" on TC-001
          ↓
    GherkinEditor modal opens
          ↓
    GET /test-cases/TC-001/gherkin
          ↓
    Textarea shows .feature content
          ↓
    User edits Gherkin syntax
          ↓
    Click "Save"
          ↓
    PUT /test-cases/TC-001/gherkin
          ↓
    Backend writes to file: output/gherkin/TC-001.feature
          ↓
    Success toast
```

---

## ARQUITECTURA DE DATOS

### Modelo de Datos

```
┌─────────────┐
│   Users     │
│ (Autenticación)│
├─────────────┤
│ id (PK)     │
│ email       │◄──────────────────┐
│ password_hash│                   │
│ full_name   │                   │
│ role        │                   │
│ is_registered│                  │
│ is_active   │                   │
│ invited_by  │                   │
└─────────────┘                   │
                                  │
┌─────────────┐                   │
│  Projects   │                   │
├─────────────┤                   │
│ id (PK)     │                   │
│ name        │                   │
│ description │                   │
│ client      │                   │
│ status      │                   │
│ created_by  │───────────────────┘
│ start_date  │
│ end_date    │
└──────┬──────┘
       │
       │ 1:N
       ↓
┌─────────────┐
│ User Stories│
├─────────────┤
│ id (PK)     │
│ project_id (FK)│
│ title       │
│ description │
│ acceptance_criteria│
│ priority    │
│ status      │
│ epic        │
│ sprint      │
│ story_points│
└──────┬──────┘
       │
       │ 1:N
       ↓
┌─────────────┐
│ Test Cases  │
├─────────────┤
│ id (PK)     │
│ project_id (FK)│
│ user_story_id (FK)│
│ title       │
│ description │
│ test_type   │
│ priority    │
│ status      │
│ gherkin_file│
│ automated   │
└──────┬──────┘
       │
       │ 1:N
       ↓
┌─────────────┐
│ Test Executions│
├─────────────┤
│ id (PK)     │
│ test_case_id (FK)│
│ executed_by │
│ status      │
│ execution_time│
│ notes       │
└─────────────┘

       1:N
       ↓
┌─────────────┐
│ Bug Reports │
├─────────────┤
│ id (PK)     │
│ project_id (FK)│
│ user_story_id (FK)│
│ test_case_id│
│ title       │
│ severity    │
│ priority    │
│ status      │
│ environment │
└─────────────┘
```

### Relaciones Clave

**Cascading Deletes**:
```
Delete Project → Cascade delete:
  - All User Stories
  - All Test Cases
  - All Bug Reports
  - All Test Executions
```

**Project Isolation**:
```
All queries filtered by project_id:
  GET /user-stories?project_id=PROJ-001
  GET /test-cases?project_id=PROJ-001
```

---

## INTEGRACIÓN FRONTEND-BACKEND

### Flujo de Comunicación

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND REQUEST                          │
└─────────────────────────────────────────────────────────────┘

1. User Action (e.g., Click "Generate Tests")
   ↓
2. React Component calls API
   const response = await testCasesApi.generatePreview(storyId)
   ↓
3. API Layer (axios)
   axios.post('/generate-test-cases/US-001/preview', config)
   Headers: { Authorization: 'Bearer {token}' }
   ↓
4. Backend receives request
   FastAPI endpoint: @router.post("/generate-test-cases/{story_id}/preview")
   ↓
5. Authentication Middleware
   Extract JWT → Validate → Get current_user
   ↓
6. Authorization Check
   Check user role if required
   ↓
7. Business Logic
   - Fetch user story from DB
   - Call Gemini AI
   - Parse response
   ↓
8. Response
   return {"suggested_test_cases": [...]}
   ↓
9. Frontend receives response
   Update React state
   ↓
10. UI Update
    Render ReviewModal with test cases
```

### Error Handling

**Backend**:
```python
try:
    # Business logic
except HTTPException as e:
    # Return 4xx/5xx with detail
    raise HTTPException(status_code=400, detail="Error message")
```

**Frontend**:
```typescript
try {
    const data = await api.call();
} catch (error: any) {
    const message = error.response?.data?.detail || 'Error genérico';
    toast.error(message);
}
```

---

## SEGURIDAD

### Authentication Security

| Medida | Implementación |
|--------|----------------|
| Password Hashing | bcrypt con salt automático |
| JWT Secret | ENV variable (NEVER committed) |
| Token Expiration | 24 horas (configurable) |
| HTTPS | Recomendado en producción |
| CORS | Whitelist específico (localhost:5173) |

### Authorization Security

| Medida | Implementación |
|--------|----------------|
| Role-Based Access | Dependencies: `require_role(Role.ADMIN)` |
| Route Protection | Frontend: `ProtectedRoute` component |
| Token Validation | Every API call validates JWT |
| Session Storage | Client-side token storage |

### Input Validation

| Layer | Validación |
|-------|------------|
| Frontend | React form validation + TypeScript types |
| Backend | Pydantic DTOs (automatic validation) |
| Database | SQLAlchemy constraints |

### SQL Injection Prevention

- ✅ SQLAlchemy ORM (parametrized queries)
- ✅ No raw SQL (except migrations)
- ✅ Pydantic validation before DB operations

---

## DEPLOYMENT

### Development

```bash
# Backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run dev  # Vite dev server on port 5173
```

### Production (Ejemplo)

**Backend** (FastAPI):
```bash
# Option 1: Uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Option 2: Gunicorn + Uvicorn workers
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Frontend** (React):
```bash
# Build
npm run build  # Outputs to dist/

# Serve with Nginx/Apache/Node
# Example with serve:
npm install -g serve
serve -s dist -p 3000
```

**Environment Variables** (`.env`):
```bash
# Backend
DATABASE_URL=postgresql://user:pass@host/db  # Production DB
GEMINI_API_KEY=your_key_here
JWT_SECRET_KEY=random_secure_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Frontend
VITE_API_BASE_URL=https://api.yourcompany.com
```

### Database Migration (SQLite → PostgreSQL)

```python
# backend/config.py
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost/qa_automation"
)

# Install driver
pip install psycopg2-binary

# SQLAlchemy handles the rest (same code)
```

---

## MÉTRICAS Y MONITOREO

### Puntos de Observabilidad

**Backend Logs**:
```python
# Uvicorn access logs
INFO:     127.0.0.1:54321 - "POST /auth/login HTTP/1.1" 200 OK

# Application logs
logger.info(f"User {user.email} logged in successfully")
logger.error(f"Failed to generate tests for story {story_id}: {error}")
```

**Frontend Errors**:
```typescript
// Axios interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data);
    return Promise.reject(error);
  }
);
```

### Health Checks

```bash
# Backend health
GET /health
Response: {"status": "healthy", "timestamp": "2025-11-22T10:00:00"}

# Database check
GET /api/v1/projects  # If returns 200, DB is up
```

---

## RESUMEN TÉCNICO

### Decisiones de Arquitectura Clave

1. **Monolithic Architecture**: Frontend + Backend separados pero en un repo
   - **Pro**: Simplicidad, fácil desarrollo
   - **Con**: Requiere escalar junto (ver SCALABILITY.md)

2. **Feature-Sliced Design** (Frontend)
   - **Pro**: Modularidad, reusabilidad
   - **Con**: Curva de aprendizaje

3. **Invitation-Only Registration**
   - **Pro**: Seguridad, control de acceso
   - **Con**: Admin debe crear invitaciones manualmente

4. **JWT Stateless Tokens**
   - **Pro**: Escalable, sin estado en servidor
   - **Con**: No se pueden revocar sin blacklist

5. **SQLite Development / PostgreSQL Production**
   - **Pro**: Fácil setup local, compatible con prod
   - **Con**: Requiere migración

### Limitaciones Actuales

| Limitación | Impacto | Solución Futura |
|------------|---------|-----------------|
| SQLite (development) | No concurrente | PostgreSQL en prod |
| No email notifications | User no recibe invitación por email | Integrar SendGrid/SMTP |
| No audit logs | No se trackean cambios | Implementar audit table |
| No file upload size limit | Posible DoS | Nginx/FastAPI limit |
| Sesión expira en 24h | User debe re-login | Refresh tokens |

---

**Última Actualización**: 2025-11-22
**Versión del Sistema**: 2.0
**Autor**: Claude Code (Anthropic)

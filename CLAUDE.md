# CLAUDE.md - QA Documentation System

**Última Actualización**: 2025-11-22
**Estado**: 🟢 Backend 100% | 🟢 Frontend 100% Funcional
**Branch**: `claude/analyze-main-branch-012dMF1s91s6f5b5W9os6upj`

---

## 📋 ÍNDICE RÁPIDO

1. [Quick Start](#quick-start)
2. [Stack y Arquitectura](#stack-y-arquitectura)
3. [🔐 Sistema de Autenticación](#sistema-de-autenticación)
4. [Roles y Permisos](#roles-y-permisos)
5. [Flujo de Datos](#flujo-de-datos)
6. [Mapa de Archivos](#mapa-de-archivos)
7. [Endpoints API](#endpoints-api-principales)
8. [Troubleshooting](#troubleshooting)

---

## QUICK START

### 1. Iniciar Sistema

```bash
# Backend
cd backend
uvicorn main:app --reload  # http://localhost:8000

# Frontend
cd frontend
npm run dev  # http://localhost:5173
```

### 2. Login Inicial

```
URL: http://localhost:5173/login
Email: admin@qa-system.com
Password: admin123
Role: ADMIN
```

### 3. Crear Primer Usuario

```
Dashboard → Admin → Usuarios → Crear Invitación
Email: qa@company.com
Nombre: QA Engineer
Rol: QA
```

### 4. Usuario Completa Registro

```
1. Logout
2. Login con: qa@company.com
3. Sistema detecta: no registrado → muestra form registro
4. Completar password y nombre
5. Auto-login → Dashboard
```

---

## STACK Y ARQUITECTURA

### Backend
- **Framework**: FastAPI 0.109.0
- **Database**: SQLite (local) → SQLAlchemy ORM
- **Auth**: JWT + bcrypt (passlib)
- **AI**: Google Gemini 2.5-flash
- **Docs**: ReportLab (PDF), python-docx

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Router**: React Router v6
- **State**: Context API (Auth, Project)
- **UI**: TailwindCSS + lucide-react
- **HTTP**: Axios
- **Notifications**: react-hot-toast

### Arquitectura
```
┌─────────────┐      ┌──────────────┐      ┌──────────┐
│  Frontend   │ HTTP │   Backend    │ SQL  │ SQLite   │
│   (React)   │─────→│   (FastAPI)  │─────→│   DB     │
│  Port 5173  │      │  Port 8000   │      │ qa_*.db  │
└─────────────┘      └──────────────┘      └──────────┘
                            │
                            ↓ API
                     ┌──────────────┐
                     │ Gemini AI    │
                     │ (Test Gen)   │
                     └──────────────┘
```

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Flujo de Invitaciones (Implementado)

**Estado**: Sistema basado en invitaciones - solo usuarios pre-aprobados pueden registrarse

#### 1. Admin Crea Invitación
```
Ruta: /admin/users → Click "Crear Invitación"
POST /api/v1/users/invite
Body: {
  "email": "qa@company.com",
  "full_name": "QA Engineer",
  "role": "qa"
}
Resultado: Usuario creado con is_registered=False, password_hash=null
```

#### 2. Multi-Step Login Flow

**Paso 1: Email Input**
```
Usuario ingresa: qa@company.com
POST /api/v1/auth/check-email
Response: {
  "exists": true,
  "is_registered": false,  ← Usuario debe registrarse
  "full_name": null
}
```

**Paso 2a: Registro (si is_registered=false)**
```
Frontend muestra: RegisterStep component
Usuario completa: Nombre + Password (≥8 chars)
POST /api/v1/auth/register
Body: { "email": "qa@company.com", "password": "...", "full_name": "..." }
Response: { "access_token": "...", "user": {...} }  ← Auto-login
```

**Paso 2b: Login (si is_registered=true)**
```
Frontend muestra: LoginPasswordStep component
Usuario ingresa: Password
POST /api/v1/auth/login
Body: { "email": "qa@company.com", "password": "..." }
Response: { "access_token": "...", "user": {...} }
```

**Paso 2c: Acceso Denegado (si exists=false)**
```
Frontend muestra: AccessDeniedPage component
Usuario NO está en whitelist → No puede acceder
```

### Archivos de Autenticación

**Backend:**
```
backend/database/models.py          # UserDB (is_registered, invited_by, etc)
backend/models/user.py              # CheckEmail/Register DTOs
backend/api/endpoints/auth.py       # check-email, register, login
backend/api/endpoints/users.py      # /users/invite (admin only)
backend/migrate_invitation_system.py # Migration script (executed)
```

**Frontend:**
```
frontend/src/features/authentication/ui/
  ├── LoginEmailStep.tsx            # Step 1: Email input
  ├── RegisterStep.tsx              # Step 2a: Password creation
  ├── LoginPasswordStep.tsx         # Step 2b: Password input
  └── AccessDeniedPage.tsx          # Access denied page

frontend/src/pages/LoginPage/       # Orchestrator (multi-step logic)
frontend/src/app/providers/AuthContext.tsx  # login(), register(), logout()
frontend/src/entities/user/api/authApi.ts   # checkEmail(), register()
```

### JWT Token Flow
```
1. Login/Register Success → Backend returns JWT token
2. Frontend saves: sessionStorage.setItem('auth_token', token)
3. Frontend saves: sessionStorage.setItem('auth_user', JSON.stringify(user))
4. All API calls include: Authorization: Bearer {token}
5. Token expiration: 24 hours (configurable in backend/config.py)
6. Logout: sessionStorage.clear()
```

---

## ROLES Y PERMISOS

### Roles Disponibles
```
admin    → Acceso total + gestión de usuarios
qa       → QA Engineer - acceso completo a proyectos
dev      → Developer - acceso completo a proyectos
manager  → Project Manager - acceso completo a proyectos
```

### Matriz de Permisos

| Pantalla/Función           | admin | qa | dev | manager |
|----------------------------|-------|----|-----|---------|
| **Autenticación**          |       |    |     |         |
| Login                      | ✅    | ✅ | ✅  | ✅      |
| Registro (invitado)        | ✅    | ✅ | ✅  | ✅      |
| **Admin**                  |       |    |     |         |
| /admin/users               | ✅    | ❌ | ❌  | ❌      |
| Crear invitaciones         | ✅    | ❌ | ❌  | ❌      |
| Eliminar usuarios          | ✅    | ❌ | ❌  | ❌      |
| **Proyectos**              |       |    |     |         |
| Ver proyectos              | ✅    | ✅ | ✅  | ✅      |
| Crear proyecto             | ✅    | ✅ | ✅  | ✅      |
| Editar proyecto            | ✅    | ✅ | ✅  | ✅      |
| Eliminar proyecto          | ✅    | ✅ | ✅  | ✅      |
| **User Stories**           |       |    |     |         |
| Ver stories                | ✅    | ✅ | ✅  | ✅      |
| Upload Excel               | ✅    | ✅ | ✅  | ✅      |
| Generar test cases con AI  | ✅    | ✅ | ✅  | ✅      |
| **Test Cases**             |       |    |     |         |
| Ver test cases             | ✅    | ✅ | ✅  | ✅      |
| Ejecutar tests             | ✅    | ✅ | ✅  | ✅      |
| Editar Gherkin             | ✅    | ✅ | ✅  | ✅      |
| **Bugs**                   |       |    |     |         |
| Ver bugs                   | ✅    | ✅ | ✅  | ✅      |
| Crear bug report           | ✅    | ✅ | ✅  | ✅      |
| **Reportes**               |       |    |     |         |
| Generar test plan PDF      | ✅    | ✅ | ✅  | ✅      |

### Protección de Rutas

**Frontend** (`frontend/src/app/App.tsx`):
```tsx
// Public route
<Route path="/login" element={<LoginPage />} />

// Protected routes (require authentication)
<Route path="/*" element={
  <ProtectedRoute>
    <Layout>...</Layout>
  </ProtectedRoute>
} />

// Admin-only route
<Route path="/admin/users" element={
  <ProtectedRoute requiredRoles={['admin']}>
    <UsersManagementPage />
  </ProtectedRoute>
} />
```

**Backend** (FastAPI dependencies):
```python
# Require authentication
@router.get("/endpoint")
async def endpoint(current_user: UserDB = Depends(get_current_user)):
    ...

# Require specific role
@router.post("/users/invite")
async def create_invitation(
    current_user: UserDB = Depends(require_role(Role.ADMIN))
):
    ...
```

---

## FLUJO DE DATOS

### 1. Autenticación Completa

```
┌──────────────┐
│ User Browser │
└──────┬───────┘
       │
       │ (1) Enter email: qa@company.com
       ↓
┌──────────────────────────────────────────────────────────┐
│ LoginPage (Multi-Step Orchestrator)                     │
│  - State: currentStep = 'email'                          │
└──────┬───────────────────────────────────────────────────┘
       │
       │ (2) POST /auth/check-email
       ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: auth.py → check_email()                         │
│  - Query DB: SELECT * FROM users WHERE email = ?         │
│  - Returns: {exists: true, is_registered: false}         │
└──────┬───────────────────────────────────────────────────┘
       │
       │ (3) Decision based on response
       ↓
  ┌────┴────┬──────────┬───────────┐
  │         │          │           │
  │ exists  │ exists=T │ exists=T  │
  │ =false  │ is_reg=F │ is_reg=T  │
  │         │          │           │
  ↓         ↓          ↓           │
Access    Register   Login        │
Denied    Step       Password     │
Page                 Step         │
  │         │          │           │
  │         │ (4a) POST /auth/register
  │         │ {email, password, full_name}
  │         ↓          │           │
  │    ┌─────────────────────┐    │
  │    │ Backend:            │    │
  │    │ - Hash password     │    │
  │    │ - Set is_registered │    │
  │    │ - Return JWT token  │    │
  │    └─────────┬───────────┘    │
  │              │                 │
  │              │ (4b) POST /auth/login
  │              │ {email, password}
  │              ↓                 │
  │         ┌─────────────────────┴───┐
  │         │ Backend:                │
  │         │ - Verify password       │
  │         │ - Check is_registered   │
  │         │ - Return JWT token      │
  │         └─────────┬───────────────┘
  │                   │
  │                   │ (5) Save token + user
  │                   ↓
  └──────────→ sessionStorage.setItem('auth_token')
              sessionStorage.setItem('auth_user')
                      │
                      │ (6) Navigate to Dashboard
                      ↓
              ┌───────────────┐
              │   Dashboard   │
              └───────────────┘
```

### 2. Gestión de Usuarios (Admin)

```
Admin Dashboard → Click "Admin" → "Usuarios"
       ↓
GET /users (with Authorization: Bearer {token})
       ↓
Backend validates: token → extract user_id → check role=admin
       ↓
Returns: List of users with is_registered status
       ↓
Frontend displays table with badges:
  - "Registrado" (green) if last_login != null
  - "Pendiente" (yellow) if last_login == null
       ↓
Admin clicks "Crear Invitación"
       ↓
Modal opens → Admin fills: email, full_name, role
       ↓
POST /users/invite {email, full_name, role}
       ↓
Backend creates user:
  - password_hash = null
  - is_registered = false
  - invited_by = admin@qa-system.com
       ↓
User appears in table with "Pendiente" badge
```

### 3. Generación de Test Cases con AI

```
User selects User Story → Click "Generate Tests"
       ↓
GenerateModal opens
  - Configure: # tests, # scenarios, types
       ↓
POST /generate-test-cases/{story_id}/preview
       ↓
Backend:
  1. Fetch user story from DB
  2. Call Gemini AI with prompt
  3. Parse response → Generate test cases
  4. Return JSON (NOT saved to DB)
       ↓
ReviewTestCasesModal displays:
  - List of suggested test cases
  - Editable titles/descriptions
  - Expandable Gherkin preview
       ↓
User reviews → Clicks "Save All"
       ↓
POST /test-cases/batch
Body: { user_story_id, test_cases: [...] }
       ↓
Backend:
  1. Validates user story exists
  2. Generates test_case_id (TC-001, TC-002...)
  3. Saves to DB with project_id
  4. Writes Gherkin .feature files
       ↓
Frontend refreshes test cases table
```

### 4. Multi-Project Architecture

```
User lands on: / (ProjectsListPage)
       ↓
GET /projects → Returns all projects with metrics
       ↓
User clicks project → Navigate to /projects/{id}/dashboard
       ↓
ProjectContext sets: currentProject = {id, name, ...}
       ↓
All subsequent API calls include project_id:
  - GET /user-stories?project_id=PROJ-001
  - GET /test-cases?project_id=PROJ-001
  - POST /upload?project_id=PROJ-001
       ↓
Backend filters all queries by project_id
```

---

## MAPA DE ARCHIVOS

### Backend Crítico

```
backend/
├── database/
│   ├── models.py                    # UserDB, ProjectDB, UserStoryDB, TestCaseDB
│   │                                  ★ UserDB: is_registered, invited_by
│   └── db.py                        # SQLAlchemy setup, SessionLocal
│
├── api/endpoints/
│   ├── auth.py                      # ★ check-email, register, login, logout
│   ├── users.py                     # ★ /users/invite, GET/DELETE users
│   ├── projects.py                  # CRUD projects
│   ├── user_stories.py              # Upload Excel, CRUD stories
│   └── test_cases.py                # Generate AI tests, CRUD test cases
│
├── models/
│   ├── user.py                      # ★ CheckEmail/Register DTOs, Role enum
│   ├── project.py                   # Project DTOs
│   ├── user_story.py                # AcceptanceCriteria, Priority, Status
│   └── test_case.py                 # GherkinScenario, TestType, TestStatus
│
├── integrations/
│   └── gemini_client.py             # AI test generation
│
├── migrate_invitation_system.py    # ★ Migration executed (adds is_registered)
├── config.py                        # Settings (JWT_SECRET, DB_URL, etc)
└── main.py                          # FastAPI app entry
```

### Frontend Crítico

```
frontend/src/
├── app/
│   ├── App.tsx                      # ★ Routes + ProtectedRoute
│   ├── providers/
│   │   ├── AuthContext.tsx          # ★ login(), register(), logout()
│   │   └── ProjectContext.tsx       # currentProject state
│   └── components/
│       └── ProtectedRoute.tsx       # ★ Auth + role validation
│
├── features/
│   └── authentication/              # ★ NEW - Multi-step login
│       └── ui/
│           ├── LoginEmailStep.tsx   # Step 1: Email input
│           ├── RegisterStep.tsx     # Step 2a: Password creation
│           ├── LoginPasswordStep.tsx # Step 2b: Password login
│           └── AccessDeniedPage.tsx # Access denied
│
├── pages/
│   ├── LoginPage/                   # ★ Multi-step orchestrator
│   ├── UsersManagementPage/         # ★ Admin only - invitations
│   ├── ProjectsListPage/            # Landing page
│   ├── DashboardPage/               # Project dashboard
│   ├── StoriesPage/                 # User stories + upload
│   ├── TestCasesPage/               # Test cases + AI generation
│   └── BugsPage/                    # Bug reports
│
├── entities/
│   └── user/
│       ├── model/types.ts           # ★ CheckEmail/Register DTOs
│       └── api/
│           ├── authApi.ts           # ★ checkEmail(), register()
│           └── usersApi.ts          # ★ createInvitation()
│
└── widgets/
    ├── header/Header.tsx            # Top nav + user menu
    └── sidebar/Sidebar.tsx          # Left nav (project context)
```

---

## ENDPOINTS API PRINCIPALES

**Base URL**: `http://localhost:8000/api/v1`

### 🔐 Autenticación

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/check-email` | POST | No | Validate email in whitelist |
| `/auth/register` | POST | No | Complete registration (set password) |
| `/auth/login` | POST | No | Login with email + password |
| `/auth/logout` | POST | Yes | Logout (optional, JWT is stateless) |
| `/auth/me` | GET | Yes | Get current user info |

### 👥 Users (Admin)

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/users` | GET | Yes | admin, manager | List all users |
| `/users/invite` | POST | Yes | admin | Create invitation (no password) |
| `/users/{id}` | DELETE | Yes | admin | Delete user |

### 📁 Projects

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/projects` | GET | Yes | List all projects + metrics |
| `/projects` | POST | Yes | Create project |
| `/projects/{id}` | GET | Yes | Get project details |
| `/projects/{id}` | PUT | Yes | Update project |
| `/projects/{id}` | DELETE | Yes | Delete project (CASCADE) |
| `/projects/{id}/stats` | GET | Yes | Project statistics |

### 📝 User Stories

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/upload?project_id={id}` | POST | Yes | Upload Excel/CSV with stories |
| `/user-stories?project_id={id}` | GET | Yes | List stories (filtered) |
| `/user-stories/{id}` | GET | Yes | Get story details |

### ✅ Test Cases

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/generate-test-cases/{story_id}/preview` | POST | Yes | AI preview (NOT saved) |
| `/test-cases/batch` | POST | Yes | Save multiple test cases |
| `/test-cases?project_id={id}` | GET | Yes | List test cases (filtered) |
| `/test-cases/{id}/gherkin` | GET | Yes | Get .feature file content |
| `/test-cases/{id}/gherkin` | PUT | Yes | Update .feature file |

### 🐛 Bugs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/create-bug-report` | POST | Yes | Create bug report |

### 📊 Reports

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/generate-test-plan?project_id={id}` | POST | Yes | Generate PDF/DOCX test plan |

---

## TROUBLESHOOTING

### 1. Login: "Email o contraseña incorrectos"

**Causa**: Usuario no existe o password incorrecto

**Verificar**:
```bash
# Backend logs
cd backend && python -c "
from database.db import SessionLocal
from database.models import UserDB
db = SessionLocal()
user = db.query(UserDB).filter(UserDB.email == 'admin@qa-system.com').first()
print(f'User: {user.email if user else \"NOT FOUND\"}')
print(f'is_registered: {user.is_registered if user else \"N/A\"}')
db.close()
"
```

**Solución**:
- Admin default: `admin@qa-system.com / admin123`
- Si no existe, ejecutar: `python backend/seed_admin.py`

---

### 2. Register: "Este email no tiene una invitación válida"

**Causa**: Email NO está en whitelist (tabla users)

**Verificar**:
```bash
# Check if invitation exists
cd backend && python -c "
from database.db import SessionLocal
from database.models import UserDB
db = SessionLocal()
user = db.query(UserDB).filter(UserDB.email == 'qa@company.com').first()
if user:
    print(f'✅ Invitation exists')
    print(f'   is_registered: {user.is_registered}')
    print(f'   invited_by: {user.invited_by}')
else:
    print(f'❌ No invitation found')
db.close()
"
```

**Solución**:
1. Login como admin
2. Ir a `/admin/users`
3. Click "Crear Invitación"
4. Completar email, nombre, rol

---

### 3. Login: "Debes completar tu registro antes de iniciar sesión"

**Causa**: Usuario tiene invitación pero `is_registered=False`

**Flujo Correcto**:
1. Usuario va a `/login`
2. Ingresa email → Sistema detecta: `is_registered=False`
3. Sistema muestra: `RegisterStep` (crear password)
4. Usuario completa registro → Auto-login

**Si sigue fallando**:
- Clear sessionStorage: `sessionStorage.clear()`
- Verificar network tab: POST `/auth/check-email` debe retornar `is_registered: false`

---

### 4. Admin: "No puedes eliminar tu propio usuario"

**Causa**: Frontend previene auto-eliminación

**Comportamiento Esperado**: Admin NO puede eliminarse a sí mismo

---

### 5. Protected Route: "Acceso Denegado"

**Causa**: Usuario no tiene rol requerido

**Ejemplo**: Usuario con role=`qa` intenta acceder a `/admin/users` (requiere `admin`)

**Verificar**:
```javascript
// En DevTools Console:
const user = JSON.parse(sessionStorage.getItem('auth_user'));
console.log('Role:', user.role);
```

**Solución**: Solo ADMIN puede acceder a `/admin/users`

---

### 6. Acceptance Criteria: Contador en 0

**Causa**: Excel no tiene columna `acceptance_criteria` o separadores incorrectos

**Formato Correcto**:
```
| id     | title       | acceptance_criteria                    |
|--------|-------------|----------------------------------------|
| US-001 | User Login  | - Validar email\n- Validar password   |
```

**Separadores válidos**: `\n`, `;`, `|`, `- `

**Verificar**:
1. Upload Excel
2. Expandir fila (click chevron `>`)
3. Ver "Criterios de Aceptación (N)"

---

### 7. AI Generation: "Error generating test cases"

**Causa**: `GEMINI_API_KEY` no configurada

**Solución**:
```bash
# backend/.env
GEMINI_API_KEY=your_api_key_here
```

**Restart backend**: `uvicorn main:app --reload`

---

### 8. Frontend: "Cannot read property of undefined"

**Causa**: sessionStorage corrupto o sin usuario

**Solución**:
```javascript
// DevTools Console:
sessionStorage.clear();
location.reload();
```

Luego re-login.

---

### 9. Database: "Table users has no column is_registered"

**Causa**: Migración no ejecutada

**Solución**:
```bash
cd backend
python migrate_invitation_system.py
# Type 'yes' cuando pregunte
```

---

### 10. CORS Error en Frontend

**Causa**: Backend CORS no configurado

**Verificar** `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ESTADO DE PANTALLAS POR ROL

### Pantallas Implementadas ✅

| Pantalla | Ruta | Roles | Estado |
|----------|------|-------|--------|
| **Autenticación** | | | |
| Login (Multi-step) | `/login` | Public | ✅ Completo |
| - Email Step | | Public | ✅ |
| - Register Step | | Public | ✅ |
| - Password Step | | Public | ✅ |
| - Access Denied | | Public | ✅ |
| **Admin** | | | |
| Users Management | `/admin/users` | admin | ✅ Completo |
| - List Users | | admin | ✅ |
| - Create Invitation | | admin | ✅ |
| - Delete User | | admin | ✅ |
| **Projects** | | | |
| Projects List | `/` | Todos | ✅ Completo |
| Project Dashboard | `/projects/:id/dashboard` | Todos | ✅ Completo |
| **User Stories** | | | |
| Stories Page | `/projects/:id/stories` | Todos | ✅ Completo |
| - Upload Excel | | Todos | ✅ |
| - View Acceptance Criteria | | Todos | ✅ |
| **Test Cases** | | | |
| Test Cases Page | `/projects/:id/tests` | Todos | ✅ Completo |
| - Generate AI Tests (Preview) | | Todos | ✅ |
| - Review & Save Tests | | Todos | ✅ |
| - Edit Gherkin | | Todos | ✅ |
| **Bugs** | | | |
| Bugs Page | `/projects/:id/bugs` | Todos | ✅ Completo |
| Bug Details | `/projects/:id/bugs/:bugId` | Todos | ✅ Completo |
| **Reports** | | | |
| Reports Page | `/projects/:id/reports` | Todos | ✅ Completo |
| - Generate Test Plan PDF | | Todos | ✅ |

### Pantallas Pendientes/Placeholder 🚧

| Pantalla | Ruta | Estado |
|----------|------|--------|
| Settings Page | `/projects/:id/settings` | 🚧 Placeholder |

**Nota**: Settings page existe pero solo muestra "Coming soon...". Puede implementarse para configuración de proyecto (team members, integrations, etc).

---

## RESUMEN EJECUTIVO

### ✅ Sistema Completamente Funcional

**Autenticación**:
- Sistema basado en invitaciones (whitelist)
- Multi-step login (email → register/password)
- JWT con expiración 24h
- Roles: admin, qa, dev, manager

**Funcionalidades**:
- ✅ Multi-proyecto (ProjectContext)
- ✅ Upload Excel con user stories
- ✅ Acceptance criteria parsing
- ✅ AI test generation con Gemini
- ✅ Preview & edit antes de guardar
- ✅ Gherkin editor
- ✅ Bug reports
- ✅ Test plan PDF/DOCX generation

**Control de Acceso**:
- ✅ ProtectedRoute con validación de rol
- ✅ /admin/users solo para ADMIN
- ✅ Demás rutas para usuarios autenticados

**Estado del Código**:
- Backend: 100% funcional
- Frontend: 100% funcional
- Database: Migrada con is_registered
- Tests: Pendientes (sistema funciona sin tests)

---

**Última Actualización**: 2025-11-22
**Autor**: Claude Code (Anthropic)

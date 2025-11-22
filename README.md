# QA Documentation Automation System

Sistema de gestión multi-proyecto para equipos de QA que automatiza la generación de test cases, gestión de user stories y reportes de bugs usando IA (Google Gemini).

**🔐 Sistema de Autenticación Implementado** - Control de acceso basado en roles con registro por invitación.

---

## 🎯 Características Principales

### 🔐 Autenticación y Seguridad
- **Registro por invitación**: Solo admins pueden invitar nuevos usuarios
- **Multi-step Login**: Email → Validación → Registro/Login
- **Control de acceso basado en roles**: admin, qa, dev, manager
- **JWT Tokens**: Autenticación stateless con tokens de 24 horas
- **Rutas protegidas**: Frontend y backend con validación de permisos
- **Sesiones seguras**: sessionStorage + auto-refresh de contexto

### Multi-Proyecto
- Gestión de múltiples proyectos QA en un solo sistema
- Métricas y estadísticas por proyecto
- Separación completa de datos entre proyectos

### Gestión de User Stories
- Importación masiva desde Excel/CSV
- Gestión de criterios de aceptación
- Estados: Backlog, To Do, In Progress, In Review, Testing, Done
- Prioridades: Critical, High, Medium, Low

### Generación de Test Cases con IA
- **🚀 Background Processing**: Generación en segundo plano con Celery + Redis
- **Queue System**: Encola múltiples generaciones sin bloquear la UI
- **Real-time Progress**: Badge UI muestra progreso en tiempo real
- **70% más rápido**: Batches paralelos con AsyncIO
- **Preview-Review-Save Workflow**: Genera sugerencias que el QA puede revisar antes de guardar
- Configuración flexible: 1-10 test cases, 1-10 escenarios por test
- Múltiples tipos de test: Functional, UI, API, Integration, Security, etc.
- Generación automática de escenarios Gherkin (Given-When-Then)
- Editor de Gherkin integrado en el frontend
- Control total: todo puede ser editado o eliminado manualmente

### Gestión de Test Cases
- CRUD completo (Create, Read, Update, Delete)
- Creación manual sin IA
- Estados de ejecución: Not Run, Passed, Failed, Blocked, Skipped
- Tracking de tiempo estimado vs real
- Soporte para tests automatizados

### Reportes de Bugs
- Generación de reportes con template
- Clasificación por severidad y prioridad
- Tracking de lifecycle: New → Assigned → In Progress → Fixed → Verified → Closed
- Asociación con user stories y test cases

### Exportación de Documentos
- Test Plans en formato PDF y DOCX
- Bug Reports en Markdown
- Integración con Notion y Azure DevOps (preparado)

---

## 🏗️ Arquitectura

```
testsDocumentationManagement/
├── backend/                    # FastAPI + SQLAlchemy + Gemini AI
│   ├── api/
│   │   ├── endpoints/         # Endpoints REST organizados
│   │   │   ├── auth.py       # Autenticación (login, register, check-email)
│   │   │   ├── users.py      # Gestión de usuarios (CRUD, invitaciones)
│   │   │   ├── projects.py   # Proyectos
│   │   │   ├── user_stories.py
│   │   │   └── test_cases.py
│   │   └── dependencies.py    # JWT validation, role checking
│   ├── database/
│   │   ├── db.py
│   │   └── models.py          # UserDB (is_registered, invited_by, etc.)
│   ├── models/                # Pydantic DTOs
│   │   ├── user.py           # CheckEmail, Register, Login DTOs
│   │   ├── project.py
│   │   ├── user_story.py
│   │   └── test_case.py
│   ├── generators/            # Gherkin, Test Plan, Bug Report
│   ├── integrations/          # Gemini AI client
│   ├── parsers/               # Excel/CSV parser
│   └── main.py               # FastAPI app con CORS, JWT config
│
├── frontend/                  # React 18 + TypeScript + Vite
│   └── src/
│       ├── app/
│       │   ├── App.tsx       # Routing con ProtectedRoute
│       │   ├── components/
│       │   │   └── ProtectedRoute.tsx  # Role-based route guard
│       │   └── providers/
│       │       └── AuthContext.tsx     # Global auth state
│       ├── pages/
│       │   ├── LoginPage/     # Multi-step login orchestrator
│       │   └── UsersManagementPage/  # Admin panel (invitaciones)
│       ├── features/
│       │   └── authentication/
│       │       └── ui/
│       │           ├── LoginEmailStep.tsx
│       │           ├── RegisterStep.tsx
│       │           ├── LoginPasswordStep.tsx
│       │           └── AccessDeniedPage.tsx
│       ├── entities/
│       │   └── user/
│       │       ├── model/types.ts  # User, Role, DTOs
│       │       └── api/
│       │           ├── authApi.ts   # checkEmail, login, register
│       │           └── usersApi.ts  # getAll, createInvitation
│       ├── shared/           # Shared UI components
│       └── widgets/          # Complex widgets
│
├── data/                      # SQLite database
├── output/                    # Generated documents
├── uploads/                   # Uploaded Excel/CSV files
├── .env                       # Environment variables
└── migrate_invitation_system.py # Auth migration script
```

---

## 🚀 Quick Start

### Prerequisitos

- **Docker** (para Redis)
- **Python 3.11+**
- **Node.js 18+**
- **Google Gemini API Key** ([obtener aquí](https://aistudio.google.com/app/apikey))

### ⚡ Inicio Rápido (UN SOLO COMANDO)

```bash
# 1. Configuración inicial (solo primera vez)
make setup

# 2. Editar .env y agregar tu GEMINI_API_KEY
nano .env  # o tu editor favorito

# 3. Iniciar TODOS los servicios
make dev
```

**¡ESO ES TODO!** En 10 segundos tienes:
- ✅ Redis corriendo
- ✅ Celery Worker procesando (background jobs)
- ✅ Backend en http://localhost:8000
- ✅ Frontend en http://localhost:5173

**Credenciales por defecto:**
- Email: `admin@qa-system.com`
- Password: `admin123`

**Detener todo**:
```bash
make dev-stop
```

**Ver más comandos**:
```bash
make help
```

### 📚 Documentación de Comandos

Ver **[README_COMANDOS.md](./README_COMANDOS.md)** para:
- Lista completa de comandos disponibles
- Comandos de debugging
- Logs y troubleshooting
- Comparación de opciones de desarrollo

### 🐳 Alternativa: Docker Completo

Si prefieres TODO en containers:

```bash
# Iniciar con Docker
make dev-docker

# Detener
make dev-docker-stop
```

### 📖 Setup Manual (sin Makefile)

Si prefieres hacerlo paso a paso, ver **[QUICKSTART.md](./QUICKSTART.md)**

---

## 🔐 Sistema de Autenticación

### Flujo de Registro por Invitación

1. **Admin crea invitación** (`/admin/users`)
   - Ingresa email, nombre completo y rol
   - Sistema crea usuario con `is_registered=False`
   - NO se asigna contraseña

2. **Usuario recibe invitación**
   - Accede a la página de login
   - Ingresa su email → `POST /auth/check-email`

3. **Sistema decide la ruta**:
   - Email NO existe → Access Denied
   - Email existe + NO registrado → Formulario de Registro
   - Email existe + Registrado → Login con Password

4. **Registro completado**
   - Usuario crea su contraseña
   - Sistema actualiza `is_registered=True`
   - Auto-login con JWT token

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso total + Gestión de usuarios + Crear invitaciones |
| **qa** | Ver/Crear/Editar Stories, Test Cases, Bugs, Reportes |
| **dev** | Ver Stories, Test Cases, Bugs (Solo lectura en algunos) |
| **manager** | Ver Dashboards, Reportes, Métricas (Solo lectura) |

### Rutas Protegidas

```typescript
// Frontend
<ProtectedRoute requiredRoles={['admin']}>
  <UsersManagementPage />
</ProtectedRoute>

// Backend
@router.get("/users")
async def get_users(
    current_user: UserDB = Depends(require_role(Role.ADMIN))
):
    # Solo admins pueden acceder
```

---

## 📖 Documentación Técnica

### Arquitectura y Diseño
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura completa del sistema (capas, flujos, diagramas)
- **[AUTH_SYSTEM.md](./AUTH_SYSTEM.md)** - Sistema de autenticación detallado
- **[FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)** - Arquitectura frontend (FSD, componentes)
- **[BACKEND_COMPLETE.md](./BACKEND_COMPLETE.md)** - Backend completo (API, DB, generadores)

### Referencia Técnica
- **[CLAUDE.md](./CLAUDE.md)** - Documentación técnica compacta para debugging
- **[SCALABILITY.md](./SCALABILITY.md)** - Recomendaciones de escalabilidad

### Deployment
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment a producción (todas las opciones)
- **[CELERY_REDIS_SETUP.md](./CELERY_REDIS_SETUP.md)** - Background processing

---

## 🔧 Tecnologías

### Backend
- **Framework**: FastAPI 0.109.0
- **Base de Datos**: SQLite + SQLAlchemy 2.0
- **Autenticación**: JWT (python-jose) + bcrypt (passlib)
- **Background Jobs**: Celery 5.3 + Redis 7
- **IA**: Google Gemini API (gemini-2.5-flash)
- **Documentos**: python-docx, reportlab, markdown
- **Validación**: Pydantic 2.5

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Routing**: React Router v6
- **HTTP**: Axios
- **State Management**: Context API
- **Arquitectura**: Feature-Sliced Design (FSD)
- **UI**: TailwindCSS 3.x + lucide-react

---

## 📝 Estado Actual

### ✅ Completado

**Autenticación (100%):**
- ✅ Sistema de invitación por admin
- ✅ Multi-step login (Email → Check → Register/Login)
- ✅ JWT tokens con 24h expiration
- ✅ Role-based access control (admin, qa, dev, manager)
- ✅ ProtectedRoute component con validación de roles
- ✅ Backend dependencies (get_current_user, require_role)
- ✅ Auto-login después de registro
- ✅ UsersManagementPage con estado de registro

**Backend:**
- ✅ Multi-project architecture (database models)
- ✅ Project CRUD endpoints
- ✅ User Story CRUD
- ✅ Test Case CRUD + Gherkin editor
- ✅ Preview-review-save workflow para test cases
- ✅ Bug Reports CRUD
- ✅ Gemini AI integration
- ✅ Excel/CSV parser

**Frontend:**
- ✅ Login multi-step (4 componentes)
- ✅ User management page (admin)
- ✅ Projects List Page (landing page con grid de proyectos)
- ✅ Create/Edit Project modals
- ✅ Routing con `:projectId` (todas las rutas anidadas)
- ✅ Project Context Provider (con localStorage persistence)
- ✅ User Stories page con tabla y visualización
- ✅ Test Cases page con CRUD completo
- ✅ Generate Modal con configuración (1-10 tests, tipos)
- ✅ Review Modal para aprobar sugerencias de IA
- ✅ Gherkin Editor component
- ✅ Test Case Form Modal (creación manual)
- ✅ Bugs page con asignación de devs
- ✅ Bug details page

### 🔄 Mejoras Pendientes (Opcionales)

**Backend:**
- 💡 Endpoint para obtener usuarios por rol: `GET /users?role=dev`
- 💡 Notificaciones cuando se asigna un bug
- 💡 Dashboard de métricas para devs

**Frontend:**
- 💡 Dropdown de usuarios en vez de input libre para asignar bugs
- 💡 Autocompletado de emails de usuarios
- 💡 Dashboard personalizado por rol

---

## 🤝 Filosofía del Sistema

**"IA como Asistente, No como Decisor"**

El sistema NO decide automáticamente cuántos test cases genera. Solo el QA humano puede evaluar la complejidad de una user story y decidir:
- ¿Cuántos test cases necesito? (1-10)
- ¿Qué tipos de tests? (Functional, UI, API, etc.)
- ¿Cuántos escenarios por test? (1-10)

La IA genera **sugerencias** que el QA puede:
- ✏️ Editar (títulos, descripciones)
- 🗑️ Eliminar (si no son relevantes)
- ✅ Aprobar y guardar

**Control Total:**
Todo lo generado por IA puede ser editado o eliminado en cualquier momento.

---

## 🔒 Seguridad

### Medidas Implementadas
- ✅ Autenticación JWT con tokens de 24 horas
- ✅ Hashing de contraseñas con bcrypt
- ✅ Validación de inputs con Pydantic
- ✅ CORS configurado para desarrollo
- ✅ Protected routes en frontend y backend
- ✅ Role-based access control

### Recomendaciones para Producción
Ver **[SCALABILITY.md](./SCALABILITY.md)** para:
- Migración a PostgreSQL
- HTTPS con Let's Encrypt
- Rate limiting
- Security headers
- Auditoría de dependencias

---

## 📄 Licencia

MIT License - Ver LICENSE file para detalles.

---

## 👥 Contribuciones

Este es un proyecto interno. Para modificaciones, consultar:
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura completa del sistema
- **[CLAUDE.md](./CLAUDE.md)** - Documentación técnica para debugging
- **[FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)** - Frontend architecture
- **[BACKEND_COMPLETE.md](./BACKEND_COMPLETE.md)** - Backend complete reference

---

## 📚 Guía de Documentación

| Archivo | Propósito | Audiencia | Tiempo |
|---------|-----------|-----------|--------|
| **README.md** | Overview y quick start | Todos | 5 min |
| **[QUICKSTART.md](./QUICKSTART.md)** | Setup paso a paso | Nuevos devs | 5 min |
| **[README_COMANDOS.md](./README_COMANDOS.md)** | Comandos disponibles (Makefile) | DevOps | 10 min |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Arquitectura completa del sistema | Arquitectos | 20 min |
| **[AUTH_SYSTEM.md](./AUTH_SYSTEM.md)** | Sistema de autenticación | Backend devs | 15 min |
| **[FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)** | Frontend architecture | Frontend devs | 15 min |
| **[BACKEND_COMPLETE.md](./BACKEND_COMPLETE.md)** | Backend reference completo | Backend devs | 20 min |
| **[CLAUDE.md](./CLAUDE.md)** | Debugging y troubleshooting | LLMs/Debugging | 30 min |
| **[SCALABILITY.md](./SCALABILITY.md)** | Escalabilidad y producción | DevOps/CTOs | 25 min |
| **[CELERY_REDIS_SETUP.md](./CELERY_REDIS_SETUP.md)** | Background processing | Backend devs | 15 min |
| **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** | Deployment a producción | DevOps | 20 min |

### 🎯 ¿Qué documentación leer?

- **Para empezar YA**: Este README + `make dev`
- **Para entender comandos**: README_COMANDOS.md
- **Para desarrollo frontend**: FRONTEND_ARCHITECTURE.md
- **Para desarrollo backend**: BACKEND_COMPLETE.md
- **Para entender autenticación**: AUTH_SYSTEM.md
- **Para debugging**: CLAUDE.md
- **Para producción**: SCALABILITY.md + DEPLOYMENT_GUIDE.md

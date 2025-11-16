# QA Documentation Automation System

Sistema de gestión multi-proyecto para equipos de QA que automatiza la generación de test cases, gestión de user stories y reportes de bugs usando IA (Google Gemini).

## 🎯 Características Principales

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
│   ├── api/                   # REST API endpoints
│   ├── database/              # SQLAlchemy models
│   ├── models/                # Pydantic models
│   ├── generators/            # Gherkin, Test Plan, Bug Report generators
│   ├── integrations/          # Gemini AI client
│   ├── parsers/               # Excel/CSV parser
│   └── main.py               # FastAPI app
│
├── frontend-react/            # React 18 + TypeScript + Vite
│   └── src/
│       ├── app/              # App config, routes, store
│       ├── pages/            # Page components
│       ├── features/         # Feature modules (FSD)
│       ├── entities/         # Business entities
│       ├── shared/           # Shared UI components
│       └── widgets/          # Complex widgets
│
├── data/                      # SQLite database
├── output/                    # Generated documents
├── uploads/                   # Uploaded Excel/CSV files
├── .env                       # Environment variables
└── migrate_to_multiproject.py # Database migration script
```

---

## 🚀 Quick Start

### Prerequisitos

- Python 3.11+
- Node.js 18+
- Google Gemini API Key ([obtener aquí](https://aistudio.google.com/app/apikey))

### 1. Setup Backend

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tu GEMINI_API_KEY

# Migrar base de datos (BORRA DATOS EXISTENTES)
python migrate_to_multiproject.py

# Iniciar servidor backend
python backend/main.py
# Backend corriendo en http://localhost:8000
```

### 2. Setup Frontend

```bash
cd frontend-react

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# Frontend corriendo en http://localhost:5173
```

### 3. Crear Tu Primer Proyecto

```bash
# Opción 1: Via API
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Primer Proyecto QA",
    "description": "Proyecto de prueba",
    "client": "Cliente ABC"
  }'

# Opción 2: Via Frontend
# 1. Abrir http://localhost:5173
# 2. Click en "Nuevo Proyecto"
# 3. Llenar formulario
```

---

## 📖 Documentación Técnica

Ver [CLAUDE.md](./CLAUDE.md) para:
- Arquitectura completa del backend
- Todos los endpoints API
- Modelos de base de datos
- Guía de integración frontend-backend
- Lista de tareas pendientes

---

## 🔧 Tecnologías

### Backend
- **Framework**: FastAPI 0.109.0
- **Base de Datos**: SQLite + SQLAlchemy 2.0
- **IA**: Google Gemini API (gemini-2.5-flash)
- **Documentos**: python-docx, reportlab, markdown
- **Validación**: Pydantic 2.5

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Routing**: React Router v6
- **HTTP**: Axios
- **Arquitectura**: Feature-Sliced Design (FSD)

---

## 📝 Estado Actual

### ✅ Completado

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
- ✅ User Stories page con tabla y visualización
- ✅ Test Cases page con CRUD completo
- ✅ Generate Modal con configuración (1-10 tests, tipos)
- ✅ Review Modal para aprobar sugerencias de IA
- ✅ Gherkin Editor component
- ✅ Test Case Form Modal (creación manual)

### ⚠️ En Progreso

**Backend:**
- ⚠️ Actualizar endpoints existentes para requerir `project_id`
- ⚠️ Crear endpoints específicos por proyecto (GET /projects/{id}/user-stories)

**Frontend:**
- ⚠️ Projects List Page (landing page)
- ⚠️ Create/Edit Project modals
- ⚠️ Routing con `:projectId`
- ⚠️ Actualizar todos los API calls con `projectId`
- ⚠️ Eliminar polling de stats (usa refresh manual)
- ⚠️ Project Context Provider

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

## 📄 Licencia

MIT License - Ver LICENSE file para detalles.

---

## 👥 Contribuciones

Este es un proyecto interno. Para modificaciones, consultar [CLAUDE.md](./CLAUDE.md) para arquitectura y guías técnicas.

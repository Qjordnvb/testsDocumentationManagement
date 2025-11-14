# 🤝 Documento de Traspaso - QA Flow Project

## 📌 Para el próximo LLM que continúe este proyecto

### **Contexto Rápido**
Proyecto de automatización de documentación QA que:
- Parsea User Stories desde Excel
- Genera test cases BDD/Gherkin con IA (Gemini)
- Crea documentación profesional (PDF, Word)
- **CAMBIO IMPORTANTE:** Abandonamos Notion, ahora creamos nuestra propia interfaz web

---

## 🎯 Objetivo del Proyecto

Crear **QA Flow**: Una herramienta web de gestión QA que:

1. ✅ Recibe Excel con User Stories
2. ✅ Genera automáticamente test cases con Gemini AI
3. ✅ Muestra dashboard interactivo con métricas
4. ✅ Permite gestionar User Stories, Test Cases y Bug Reports
5. ✅ Exporta a múltiples formatos (PDF, Word, Markdown)
6. ✅ (Opcional) Sincroniza a Azure DevOps

---

## 📂 Estado Actual del Código

### **✅ LO QUE FUNCIONA (core sólido)**

```
src/
├── config.py                          # ✅ Configuración con Pydantic
├── models/
│   ├── user_story.py                  # ✅ Modelo UserStory + AcceptanceCriteria
│   ├── test_case.py                   # ✅ Modelo TestCase + GherkinScenario
│   └── bug_report.py                  # ✅ Modelo BugReport
│
├── parsers/
│   └── file_parser.py                 # ✅ Parser Excel/CSV (auto-detección columnas)
│
├── generators/
│   ├── gherkin_generator.py           # ✅ Genera archivos .feature
│   ├── test_plan_generator.py         # ✅ Genera PDF + Markdown
│   └── bug_template_generator.py      # ✅ Genera plantillas Word
│
├── integrations/
│   ├── gemini_client.py               # ✅ Cliente Gemini AI (gemini-2.5-flash)
│   └── azure_devops_client.py         # ✅ Cliente Azure DevOps
│
├── database/
│   ├── db.py                          # ✅ Setup SQLAlchemy + SQLite
│   └── models.py                      # ✅ Modelos ORM
│
├── cli.py                             # ✅ CLI con Typer (funcional pero no es el foco)
└── main.py                            # ⚠️ API FastAPI básica (NECESITA REFACTOR)
```

### **❌ LO QUE SE DEBE ELIMINAR (complejidad innecesaria)**

```
src/integrations/
├── notion_client.py                   # ❌ ELIMINAR - Ya no usamos Notion
└── mcp_notion_client.py               # ❌ ELIMINAR - Integración MCP compleja

src/
├── cli_notion_setup.py                # ❌ ELIMINAR
├── notion_ai_orchestrator.py          # ❌ ELIMINAR
└── gemini_mcp_orchestrator.py         # ❌ ELIMINAR

*.md relacionados con Notion               # ❌ ELIMINAR
```

### **✨ LO QUE SE DEBE CREAR (nueva interfaz web)**

```
frontend/                              # ✨ CREAR - Interfaz web completa
├── index.html                         # Dashboard principal
├── css/
│   └── styles.css
├── js/
│   ├── app.js                         # Core de la aplicación
│   ├── dashboard.js                   # Lógica del dashboard
│   ├── user-stories.js                # Gestión de User Stories
│   ├── test-cases.js                  # Visualización de test cases
│   └── bug-reports.js                 # Gestión de bugs
└── components/                        # Componentes reutilizables

src/api/                               # ✨ CREAR - Endpoints organizados
├── user_stories.py                    # Endpoints para User Stories
├── test_cases.py                      # Endpoints para Test Cases
├── bug_reports.py                     # Endpoints para Bug Reports
├── files.py                           # Upload/download de archivos
└── dashboard.py                       # Métricas y estadísticas

src/services/                          # ✨ CREAR - Lógica de negocio
├── user_story_service.py
├── test_case_service.py
└── metrics_service.py
```

---

## 🔧 Tecnologías Usadas

### Backend (ya implementado)
- **Python 3.11+**
- **FastAPI** - API REST
- **SQLAlchemy** - ORM
- **SQLite** - Base de datos (archivo: `data/qa_automation.db`)
- **Pydantic** - Validación
- **Google Gemini API** - IA (modelo: `gemini-2.5-flash`)
- **python-docx** - Generación Word
- **reportlab** - Generación PDF

### Frontend (por implementar)
Opciones recomendadas:
1. **Vanilla JS + Tailwind CSS** - Rápido, sin frameworks
2. **Vue.js** - Framework ligero, fácil de aprender
3. **React** - Más robusto, ecosistema grande

---

## 🔑 Archivos Clave para Entender

### 1. `src/config.py`
Configuración con Pydantic Settings. Variables de entorno desde `.env`:
```python
GEMINI_API_KEY=AIzaSyASEXfrbnPp2oXxTmUCsDAMgts53NCgb60
AZURE_DEVOPS_ORG_URL=...
AZURE_DEVOPS_PAT=...
```

### 2. `src/models/user_story.py`
Modelo principal:
```python
class UserStory:
    id: str
    title: str
    description: str
    acceptance_criteria: List[AcceptanceCriteria]
    priority: Priority  # Enum: Critical, High, Medium, Low
    status: Status      # Enum: Backlog, To Do, In Progress, Done
```

### 3. `src/parsers/file_parser.py`
Parser robusto con **auto-detección** de columnas. Funciona con Excel variados.

**Mapeo flexible:**
```python
# Detecta automáticamente estas variantes:
"ID" / "User Story ID" / "Historia ID"
"Title" / "Título" / "Name"
"Description" / "Descripción" / "Details"
"Acceptance Criteria" / "Criterios de Aceptación" / "AC"
```

**Importante:** Salta Epics, solo procesa User Stories.

### 4. `src/integrations/gemini_client.py`
Cliente de Gemini AI. Funciones principales:
```python
generate_gherkin_scenarios(user_story, num_scenarios=5)
# → Genera escenarios BDD automáticamente

suggest_test_types(user_story)
# → Recomienda tipos de tests (Functional, UI, API, etc.)

improve_acceptance_criteria(user_story)
# → Sugiere mejoras a los criterios
```

**Prompt mejorado:** El prompt actual está optimizado para generar escenarios ESPECÍFICOS basados en los criterios de aceptación reales (no genéricos).

### 5. `src/generators/gherkin_generator.py`
Genera archivos `.feature` en formato Gherkin:
```gherkin
Feature: User login
  Scenario: Successful login
    Given I am on the login page
    When I enter valid credentials
    Then I should be redirected to dashboard
```

### 6. `src/database/models.py`
Modelos SQLAlchemy para persistencia:
- `UserStoryDB` - User Stories
- `TestCaseDB` - Test Cases
- `BugReportDB` - Bug Reports

---

## 📊 Flujo de Datos Actual

```
1. Excel File
     ↓
   FileParser.parse_file()
     ↓
   UserStory objects
     ↓
   Save to SQLite (UserStoryDB)
     ↓
   GeminiClient.generate_gherkin_scenarios()
     ↓
   GherkinScenario objects
     ↓
   GherkinGenerator.generate_from_user_story()
     ↓
   .feature files (saved to output/)
     ↓
   TestPlanGenerator.generate_plan()
     ↓
   PDF + Markdown (saved to output/)
```

---

## 🎯 Próximos Pasos (Roadmap)

### **Inmediato (Fase 1):**
1. ❌ **Limpiar código de Notion**
   ```bash
   rm src/integrations/notion_client.py
   rm src/integrations/mcp_notion_client.py
   rm src/*notion*.py
   ```

2. ➕ **Refactorizar API FastAPI**
   - Mover endpoints a `src/api/`
   - Separar lógica de negocio a `src/services/`
   - Agregar CORS para frontend

3. ✨ **Crear frontend básico**
   - `frontend/index.html` - Dashboard
   - Conectar con API usando Fetch
   - Mostrar User Stories en tabla

### **Corto Plazo (Fase 2):**
4. **Módulo de carga de Excel**
   - Drag & drop
   - Preview antes de importar
   - Validación

5. **Vista de Test Cases**
   - Mostrar archivos .feature
   - Syntax highlighting de Gherkin
   - Botón "Generar con IA"

6. **Dashboard con métricas**
   - Total de User Stories
   - Test coverage
   - Gráficos (Chart.js)

### **Mediano Plazo (Fase 3):**
7. **Features avanzadas**
   - Edición inline de test cases
   - Búsqueda y filtros
   - Exportación múltiples formatos
   - Sistema de versiones

---

## 🐛 Problemas Conocidos

### 1. **Integración con Notion abandonada**
- ❌ Era muy compleja
- ❌ Generaba páginas duplicadas
- ❌ No teníamos control sobre la UI
- ✅ **Solución:** Crear nuestra propia interfaz web

### 2. **CLI vs Web**
- El CLI funciona pero no es intuitivo para usuarios no técnicos
- **Solución:** Mantener CLI para uso avanzado, pero el foco es la web UI

### 3. **Prompt de Gemini**
- Versión anterior generaba escenarios genéricos
- ✅ **Ya arreglado:** Prompt mejorado que usa criterios de aceptación específicos

---

## 💻 Comandos Útiles

### **Ejecutar servidor de desarrollo:**
```bash
source venv/bin/activate
uvicorn src.main:app --reload --port 8000
```

### **Ejecutar CLI (funcional actual):**
```bash
source venv/bin/activate

# Parsear Excel
python -m src.cli parse ejemplo_user_stories.xlsx

# Listar User Stories
python -m src.cli list-stories

# Generar test cases con IA
python -m src.cli generate-tests 462504 --use-ai --num-scenarios 5

# Flujo completo
python -m src.cli generate-all ejemplo_user_stories.xlsx "Proyecto X" --use-ai
```

### **Ver API docs (Swagger):**
```
http://localhost:8000/docs
```

---

## 📝 Variables de Entorno (.env)

```bash
# IA
GEMINI_API_KEY=AIzaSyASEXfrbnPp2oXxTmUCsDAMgts53NCgb60

# Azure DevOps (opcional)
AZURE_DEVOPS_ORG_URL=
AZURE_DEVOPS_PAT=
AZURE_DEVOPS_PROJECT=

# App
DEBUG=True
DATABASE_URL=sqlite:///./data/qa_automation.db
OUTPUT_DIR=./output
```

---

## 🎨 Diseño Propuesto del Dashboard

```
┌────────────────────────────────────────────────┐
│  🎯 QA Flow                    [user] [⚙️]     │
├────────────────────────────────────────────────┤
│  📊 Dashboard  📋 User Stories  🧪 Tests  🐛 Bugs │
├────────────────────────────────────────────────┤
│                                                │
│  📈 Métricas del Proyecto                     │
│  ┌─────────┬─────────┬─────────┬──────────┐  │
│  │ 7       │ 4       │ 0       │ 75%      │  │
│  │ Stories │ Tests   │ Bugs    │ Coverage │  │
│  └─────────┴─────────┴─────────┴──────────┘  │
│                                                │
│  📤 Acciones Rápidas                          │
│  [Upload Excel] [Generate Tests] [Export PDF] │
│                                                │
│  📋 User Stories Recientes                    │
│  ┌────────────────────────────────────────┐  │
│  │ ID     │ Title          │ Status │ Tests││
│  ├────────────────────────────────────────┤  │
│  │ 462504 │ Formulario...  │ To Do  │ ✅  ││
│  │ 462475 │ Banner Home    │ Done   │ ✅  ││
│  │ 462757 │ Interna Prod..│ To Do  │ ❌  ││
│  └────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 🚀 Guía Rápida para Empezar

1. **Lee `PROYECTO_REDEFINICION.md`** - Contexto completo
2. **Revisa `src/models/`** - Entiende los modelos de datos
3. **Ejecuta el CLI** - Ve cómo funciona actualmente
4. **Crea `frontend/index.html`** - Empieza con el dashboard
5. **Refactoriza `src/main.py`** - Organiza los endpoints
6. **Conecta frontend con API** - Fetch/Axios

---

## 📚 Referencias

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **SQLAlchemy Docs:** https://docs.sqlalchemy.org/
- **Gemini API:** https://ai.google.dev/tutorials/python_quickstart
- **Gherkin Syntax:** https://cucumber.io/docs/gherkin/reference/
- **Azure DevOps API:** https://learn.microsoft.com/en-us/rest/api/azure/devops/

---

## ✅ Checklist para Validar tu Entendimiento

- [ ] ¿Entiendes por qué abandonamos Notion?
- [ ] ¿Sabes qué archivos eliminar vs mantener?
- [ ] ¿Conoces el flujo de datos actual (Excel → Gemini → .feature)?
- [ ] ¿Entiendes la estructura de UserStory, TestCase, BugReport?
- [ ] ¿Sabes cómo funciona el parser de Excel?
- [ ] ¿Comprendes la integración con Gemini AI?
- [ ] ¿Tienes claro el objetivo: crear interfaz web propia?

---

**Última Actualización:** 2025-11-14
**Versión:** 1.0
**Creado por:** Claude (Sonnet 4.5)
**Proyecto:** QA Flow - Herramienta de Gestión QA

---

## 💬 Notas Finales

Este proyecto tiene **un core muy sólido**:
- ✅ Parser robusto
- ✅ Generación de Gherkin con IA
- ✅ Exportación multi-formato
- ✅ Base de datos funcional

Lo que falta es **una interfaz visual intuitiva** para que usuarios no técnicos puedan usarlo sin CLI.

**El siguiente paso es simple:** Crear un dashboard web que consuma la API FastAPI existente.

¡Buena suerte! 🚀

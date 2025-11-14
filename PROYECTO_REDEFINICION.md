# 🔄 Redefinición del Proyecto: QA Management Tool

## 📋 Resumen Ejecutivo

**Decisión:** Abandonar la integración compleja con Notion y crear una **herramienta de gestión QA dedicada** con interfaz web propia.

**Razón:** La integración con Notion vía MCP/API es demasiado compleja, genera páginas duplicadas, y no proporciona el control necesario sobre la visualización y estructura de la documentación QA.

---

## 🎯 Nueva Visión del Proyecto

### **Nombre Propuesto:**
`QA Flow` o `QA Documentation Hub`

### **Descripción:**
Una aplicación web completa para gestionar todo el flujo de documentación QA:
- Carga de User Stories desde Excel/CSV
- Generación automática de test cases con IA (Gemini)
- Gestión visual de User Stories, Test Cases y Bug Reports
- Dashboard interactivo para seguimiento
- Exportación a múltiples formatos (PDF, Word, Markdown)
- Sincronización opcional a sistemas externos (Azure DevOps)

---

## 👥 Casos de Uso

### ✅ **LO QUE SÍ HACE EL SISTEMA:**

#### **1. QA Manager - Gestión Completa de Proyectos**
```
Día 1: Setup del Proyecto
- Crea nuevo proyecto "Pilsen Fresh - Marketing Campaign"
- Sube archivo Excel con 15 User Stories del cliente
- Sistema parsea automáticamente (detecta columnas)
- Ve dashboard actualizado: 15 historias, 0 tests, 0 bugs

Día 2: Generación de Test Cases
- Selecciona US-001 a US-005 (prioridad alta)
- Click "Generar Test Cases con IA"
- Gemini analiza y genera 15 escenarios en 30 segundos
- Revisa y ajusta test cases en el editor
- Exporta Test Plan en PDF para cliente

Día 3: Seguimiento y Reportes
- Dashboard muestra: 15 US, 45 tests, 12 ejecutados, 2 bugs
- Genera reporte semanal (PDF + Excel)
- Comparte con el equipo
```

#### **2. Tester - Ejecución de Pruebas**
```
Flujo de Testing:
- Abre proyecto "Pilsen Fresh"
- Ve lista de test cases pendientes
- Selecciona TC-001-001 "Login exitoso"
- Lee escenarios Gherkin (Given/When/Then)
- Ejecuta manualmente las pruebas
- Marca resultado: ✅ Pass o ❌ Fail
- Si falla: Crea bug report vinculado al test case
```

#### **3. Team Lead - Métricas y Análisis**
```
Vista de Métricas:
- Dashboard con gráficas:
  • Cobertura de tests: 85%
  • Tests ejecutados: 38/45
  • Bugs abiertos: 3 (2 high, 1 medium)
  • Progreso del sprint: 70%
- Exporta métricas para stakeholders
- Identifica áreas sin cobertura
- Planifica siguiente sprint
```

### ❌ **LO QUE NO HACE EL SISTEMA (Límites del Alcance):**

```
❌ NO es un Test Runner
   - No ejecuta tests automáticamente (Selenium, Playwright, etc.)
   - No corre scripts de testing
   - Solo DOCUMENTA y ORGANIZA los tests

❌ NO gestiona CI/CD
   - No se integra con Jenkins, GitHub Actions, GitLab CI
   - No ejecuta pipelines
   - No hace deploy automático

❌ NO es un Bug Tracker completo
   - No reemplaza Jira/Linear para gestión de sprints
   - No tiene workflows complejos de estados
   - Solo trackea bugs relacionados con QA

❌ NO gestiona infraestructura
   - No provisiona ambientes de testing
   - No gestiona contenedores/servidores
   - No monitorea performance

✅ ENFOQUE: Documentación y organización del proceso QA
   - Centraliza User Stories
   - Genera test cases con IA
   - Documenta bugs
   - Exporta reportes profesionales
```

---

## 🖥️ Mockups Detallados de Interfaz

### **1. Dashboard Principal**

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
│              │                                                 │
│              │  📋 Proyectos Recientes                        │
│              │  • Pilsen Fresh (activo)                       │
│              │  • Mi App Mobile (completado)                  │
│              │  • Portal Web (en progreso)                    │
└──────────────┴─────────────────────────────────────────────────┘
```

### **2. Gestión de User Stories**

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
│  │ US-004  │ Cambiar avatar      │ 🟢 Baja   │ -     │ To Do │ │
│  │ US-005  │ Notificaciones      │ 🟡 Media  │ 1/4 ⚠️│ Prog. │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  [Seleccionar todas] [🤖 Generar Tests con IA (3 seleccionadas)]│
└────────────────────────────────────────────────────────────────┘

// Click en US-001 abre modal:

┌────────────────────────────────────────────────────────────────┐
│  📝 US-001: Login de usuario                           [✕]     │
├────────────────────────────────────────────────────────────────┤
│  **Descripción:**                                              │
│  Como usuario, quiero iniciar sesión con email y contraseña   │
│  para acceder a mi cuenta.                                     │
│                                                                │
│  **Criterios de Aceptación:**                                 │
│  ✅ AC-1: Usuario puede ingresar email y password             │
│  ✅ AC-2: Sistema valida credenciales correctas               │
│  ✅ AC-3: Redirección a dashboard tras login exitoso          │
│  ✅ AC-4: Mensaje de error si credenciales inválidas          │
│                                                                │
│  **Metadata:**                                                 │
│  Prioridad: Alta | Story Points: 5 | Sprint: 1                │
│  Epic: Autenticación | Asignado: Maria G.                     │
│                                                                │
│  **Test Cases Generados: 3**                                  │
│  • TC-001-001: Login exitoso con credenciales válidas         │
│  • TC-001-002: Login fallido con password incorrecta          │
│  • TC-001-003: Login fallido con email inexistente            │
│                                                                │
│  [📝 Editar] [🗑️ Eliminar] [🤖 Regenerar Tests] [💾 Guardar] │
└────────────────────────────────────────────────────────────────┘
```

### **3. Test Cases con Gherkin**

```
┌────────────────────────────────────────────────────────────────┐
│  ✅ Test Cases > US-001: Login de usuario                      │
├────────────────────────────────────────────────────────────────┤
│  TC-001-001: Login exitoso con credenciales válidas           │
│  Generado por: Gemini AI | Última edición: 14/11/2024         │
│  Estado: ✅ Pass | Ejecutado por: Jordan | Fecha: 14/11       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Feature: Autenticación de usuario                            │
│                                                                │
│    Como usuario registrado                                     │
│    Quiero poder iniciar sesión con mis credenciales          │
│    Para acceder a mi cuenta y sus funcionalidades             │
│                                                                │
│  Scenario: Login exitoso con credenciales válidas             │
│    Given el usuario está en la página de login                │
│    And tiene una cuenta registrada con email "user@mail.com"  │
│    When ingresa el email "user@mail.com"                      │
│    And ingresa la contraseña correcta "Pass123!"              │
│    And hace click en el botón "Iniciar Sesión"               │
│    Then es redirigido al dashboard principal                   │
│    And ve un mensaje de bienvenida "Hola, Usuario"           │
│    And el token de sesión es almacenado                       │
│                                                                │
│  Scenario: Login con remember me activado                     │
│    Given el usuario está en la página de login                │
│    When ingresa credenciales válidas                          │
│    And marca la opción "Recordarme"                           │
│    And hace click en "Iniciar Sesión"                        │
│    Then la sesión persiste por 30 días                        │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  [✅ Marcar Pass] [❌ Marcar Fail] [🐛 Reportar Bug]          │
│  [📝 Editar] [📄 Exportar .feature] [📋 Copiar]               │
└────────────────────────────────────────────────────────────────┘
```

### **4. Gestión de Bugs**

```
┌────────────────────────────────────────────────────────────────┐
│  🐛 Bug Reports > Nuevo Bug                              [✕]   │
├────────────────────────────────────────────────────────────────┤
│  Título: *                                                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Login falla cuando email tiene espacios al final        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Proyecto: [Pilsen Fresh ▼]                                   │
│  User Story: [US-001 - Login de usuario ▼]                    │
│  Test Case: [TC-001-003 - Email inexistente ▼]                │
│                                                                │
│  Severidad: [🔴 Alta ▼] | Prioridad: [1 ▼] | Estado: [Nuevo] │
│                                                                │
│  Descripción: *                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Al ingresar un email con espacios al final (ej:         │ │
│  │ "user@mail.com "), el sistema no los elimina y el       │ │
│  │ login falla mostrando "Usuario no encontrado".           │ │
│  │                                                          │ │
│  │ **Comportamiento esperado:**                             │ │
│  │ El sistema debe eliminar espacios leading/trailing      │ │
│  │ antes de validar el email.                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Pasos para reproducir:                                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 1. Ir a /login                                           │ │
│  │ 2. Ingresar email válido: "user@mail.com "              │ │
│  │ 3. Ingresar password correcta                            │ │
│  │ 4. Click en "Iniciar Sesión"                            │ │
│  │ 5. Ver error: "Usuario no encontrado"                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  [📎 Adjuntar Screenshot] [📹 Adjuntar Video]                 │
│                                                                │
│  Ambiente: [Staging ▼] | Browser: [Chrome 120 ▼]             │
│  Asignado a: [Backend Team ▼]                                 │
│                                                                │
│  [💾 Guardar Bug] [📄 Exportar Word] [🗑️ Cancelar]           │
└────────────────────────────────────────────────────────────────┘
```

### **5. Exportación y Reportes**

```
┌────────────────────────────────────────────────────────────────┐
│  📊 Reportes y Exportación                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tipo de reporte:                                             │
│  ○ Test Plan Completo (PDF)                                   │
│  ● Reporte de Ejecución (PDF + Excel)                         │
│  ○ Bug Report Summary (Word)                                  │
│  ○ Métricas del Proyecto (PDF + Charts)                       │
│  ○ User Stories Export (Excel/CSV/JSON)                       │
│                                                                │
│  Configuración:                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Proyecto: [Pilsen Fresh ▼]                               │ │
│  │ Período: [01/11/2024] - [14/11/2024]                     │ │
│  │                                                          │ │
│  │ ☑ Incluir User Stories                                   │ │
│  │ ☑ Incluir Test Cases                                     │ │
│  │ ☑ Incluir resultados de ejecución                        │ │
│  │ ☑ Incluir bugs reportados                                │ │
│  │ ☑ Incluir gráficas de métricas                           │ │
│  │ ☐ Incluir código Gherkin completo                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Formato: [PDF ▼] | Template: [Professional ▼]               │
│                                                                │
│  Preview:                                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  📄 TEST EXECUTION REPORT                                │ │
│  │  Pilsen Fresh - Marketing Campaign                       │ │
│  │  Period: Nov 1-14, 2024                                  │ │
│  │                                                          │ │
│  │  Summary:                                                 │ │
│  │  • Total User Stories: 15                                │ │
│  │  • Total Test Cases: 45                                  │ │
│  │  • Tests Executed: 38                                    │ │
│  │  • Pass: 35 | Fail: 3                                    │ │
│  │  • Coverage: 85%                                         │ │
│  │  [...]                                                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  [📥 Generar y Descargar] [📧 Enviar por Email] [🗑️ Cancelar] │
└────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────┐
│                  FRONTEND (Web UI)                  │
│  - Dashboard de User Stories                        │
│  - Visualización de Test Cases (Gherkin)           │
│  - Gestión de Bug Reports                          │
│  - Métricas y reportes                             │
│  - Carga de archivos Excel/CSV                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTP/REST
                   │
┌──────────────────▼──────────────────────────────────┐
│              BACKEND (FastAPI)                      │
│  - API REST endpoints                               │
│  - Procesamiento de archivos                        │
│  - Integración con Gemini AI                        │
│  - Generación de documentos                         │
│  - Gestión de base de datos                         │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌──────────┐
   │SQLite  │ │Gemini  │ │Azure     │
   │Database│ │AI API  │ │DevOps    │
   └────────┘ └────────┘ └──────────┘
```

---

## 📂 Estructura del Proyecto Actual

### ✅ **Archivos que SE MANTIENEN (Core funcional)**

```
testDocumentationAutomation/
├── src/
│   ├── config.py                    ✅ MANTENER - Configuración base
│   ├── models/
│   │   ├── __init__.py              ✅ MANTENER
│   │   ├── user_story.py            ✅ MANTENER - Modelo principal
│   │   ├── test_case.py             ✅ MANTENER - Modelo de test cases
│   │   └── bug_report.py            ✅ MANTENER - Modelo de bugs
│   │
│   ├── parsers/
│   │   ├── __init__.py              ✅ MANTENER
│   │   └── file_parser.py           ✅ MANTENER - Parser Excel/CSV
│   │
│   ├── generators/
│   │   ├── __init__.py              ✅ MANTENER
│   │   ├── gherkin_generator.py     ✅ MANTENER - Generador de .feature
│   │   ├── test_plan_generator.py   ✅ MANTENER - Test plans MD/PDF
│   │   └── bug_template_generator.py ✅ MANTENER - Plantillas Word
│   │
│   ├── integrations/
│   │   ├── __init__.py              ✅ MANTENER
│   │   ├── gemini_client.py         ✅ MANTENER - IA para test cases
│   │   └── azure_devops_client.py   ✅ MANTENER - Sync Azure DevOps
│   │
│   ├── database/
│   │   ├── __init__.py              ✅ MANTENER
│   │   ├── db.py                    ✅ MANTENER - SQLAlchemy setup
│   │   └── models.py                ✅ MANTENER - Modelos de DB
│   │
│   └── main.py                      ✅ MANTENER + MODIFICAR - API FastAPI
│
├── .env                             ✅ MANTENER - Variables de entorno
├── requirements.txt                 ✅ MANTENER + ACTUALIZAR
├── README.md                        ✅ MANTENER + ACTUALIZAR
└── data/
    └── qa_automation.db             ✅ MANTENER - Base de datos SQLite
```

### ❌ **Archivos que SE ELIMINAN (Complejidad innecesaria)**

```
testDocumentationAutomation/
├── src/
│   ├── integrations/
│   │   ├── notion_client.py         ❌ ELIMINAR - Ya no usaremos Notion
│   │   └── mcp_notion_client.py     ❌ ELIMINAR - Cliente MCP complejo
│   │
│   ├── cli_notion_setup.py          ❌ ELIMINAR - Setup de Notion
│   ├── notion_ai_orchestrator.py    ❌ ELIMINAR - Orquestador Notion
│   └── gemini_mcp_orchestrator.py   ❌ ELIMINAR - Integración MCP
│
├── ARCHITECTURE_NOTION.md           ❌ ELIMINAR - Docs de Notion
├── NOTION_SETUP.md                  ❌ ELIMINAR - Guías de Notion
└── INTEGRATIONS.md                  ❌ ELIMINAR (parcial) - Actualizar sin Notion
```

### ➕ **Archivos NUEVOS a crear**

```
testDocumentationAutomation/
├── frontend/                        ✨ NUEVO - Interfaz web
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── dashboard.js
│   │   ├── user-stories.js
│   │   ├── test-cases.js
│   │   └── bug-reports.js
│   └── components/
│       ├── navbar.html
│       ├── sidebar.html
│       └── widgets.html
│
├── src/
│   ├── api/                         ✨ NUEVO - Endpoints organizados
│   │   ├── __init__.py
│   │   ├── user_stories.py
│   │   ├── test_cases.py
│   │   ├── bug_reports.py
│   │   ├── files.py
│   │   └── dashboard.py
│   │
│   └── services/                    ✨ NUEVO - Lógica de negocio
│       ├── __init__.py
│       ├── user_story_service.py
│       ├── test_case_service.py
│       └── metrics_service.py
│
├── NUEVA_ARQUITECTURA.md            ✨ NUEVO - Documentación actualizada
└── ROADMAP.md                       ✨ NUEVO - Plan de desarrollo
```

---

## 🛠️ Stack Tecnológico

### **Backend (SIN CAMBIOS)**
- ✅ **Python 3.11+**
- ✅ **FastAPI** - REST API
- ✅ **SQLAlchemy** - ORM
- ✅ **SQLite** - Base de datos
- ✅ **Pydantic** - Validación de datos
- ✅ **Google Gemini API** - IA para generar test cases
- ✅ **python-docx** - Generación de Word
- ✅ **reportlab/weasyprint** - Generación de PDF
- ✅ **openpyxl** - Lectura de Excel

### **Frontend (NUEVO)**
- ✨ **HTML5 + CSS3 + JavaScript** (vanilla o framework ligero)
- ✨ **Opciones de Framework:**
  - **React** - Si quieres algo moderno y escalable
  - **Vue.js** - Más simple, curva de aprendizaje suave
  - **Vanilla JS + Tailwind CSS** - Sin frameworks, rápido de implementar
- ✨ **Chart.js** - Gráficos y métricas
- ✨ **DataTables.js** - Tablas interactivas
- ✨ **Axios** - Cliente HTTP para API

### **DevOps**
- ✅ Docker (opcional, para deployment)
- ✅ Git para control de versiones

---

## 📦 Dependencias a Actualizar

### **requirements.txt - ELIMINAR:**
```txt
notion-client==2.2.1         ❌ ELIMINAR
```

### **requirements.txt - MANTENER:**
```txt
fastapi==0.104.1             ✅
uvicorn[standard]==0.24.0    ✅
sqlalchemy==2.0.23           ✅
pydantic==2.5.0              ✅
pydantic-settings==2.1.0     ✅
python-multipart==0.0.6      ✅
openpyxl==3.1.2              ✅
google-generativeai==0.8.5   ✅
python-docx==1.1.0           ✅
reportlab==4.0.7             ✅
markdown==3.5.1              ✅
typer==0.9.0                 ✅
rich==13.7.0                 ✅
```

### **requirements.txt - AGREGAR:**
```txt
jinja2==3.1.2                ✨ NUEVO - Templating HTML
aiofiles==23.2.1             ✨ NUEVO - Manejo async de archivos
python-jose[cryptography]    ✨ NUEVO (opcional) - JWT para auth
passlib[bcrypt]              ✨ NUEVO (opcional) - Password hashing
```

---

## 🎨 Funcionalidades de la Interfaz Web

### **1. Dashboard Principal**
```
┌────────────────────────────────────────────────┐
│  QA Flow Dashboard                      [User] │
├────────────────────────────────────────────────┤
│                                                │
│  📊 Métricas Generales                        │
│  ┌──────────┬──────────┬──────────┬─────────┐│
│  │ 7 User   │ 4 Test   │ 0 Bugs   │ 85%     ││
│  │ Stories  │ Cases    │ Reports  │Coverage ││
│  └──────────┴──────────┴──────────┴─────────┘│
│                                                │
│  📈 Progreso del Proyecto                     │
│  ████████████░░░░░░░░ 60%                    │
│                                                │
│  🎯 Acciones Rápidas                          │
│  [📤 Cargar Excel] [✨ Generar Tests]         │
│  [📄 Exportar PDF] [📊 Ver Reportes]          │
│                                                │
└────────────────────────────────────────────────┘
```

### **2. Módulo User Stories**
- Tabla interactiva con todas las historias
- Filtros por prioridad, status, proyecto
- Vista detallada con criterios de aceptación
- Indicador de cobertura de tests

### **3. Módulo Test Cases**
- Visualización de archivos .feature (Gherkin)
- Agrupación por User Story
- Syntax highlighting para Gherkin
- Botón para ejecutar generación con IA

### **4. Módulo Bug Reports**
- Gestión de bugs encontrados
- Templates pre-cargados
- Exportación a Word

### **5. Módulo de Carga**
- Drag & drop de archivos Excel/CSV
- Preview de datos antes de importar
- Validación de columnas

### **6. Exportación**
- Generar Test Plan completo (PDF)
- Exportar User Stories (Excel, CSV, JSON)
- Descargar archivos .feature
- Exportar Bug Templates (Word)

---

## 🔄 Flujo de Trabajo Propuesto

```
1. Usuario sube Excel con User Stories
        ↓
2. Sistema parsea y guarda en SQLite
        ↓
3. Dashboard muestra User Stories
        ↓
4. Usuario selecciona historias
        ↓
5. Usuario hace clic en "Generar Test Cases con IA"
        ↓
6. Gemini genera escenarios Gherkin
        ↓
7. Sistema guarda .feature files y actualiza DB
        ↓
8. Dashboard muestra test cases generados
        ↓
9. Usuario puede:
   - Ver test cases en la interfaz
   - Editar manualmente
   - Exportar a PDF/Word
   - Sincronizar a Azure DevOps (opcional)
```

---

## 🎬 Demo Completa - Flujo End-to-End

### **Escenario: QA Manager configura proyecto nuevo**

```bash
# ===== DÍA 1: SETUP INICIAL =====

# 1. Iniciar el servidor
$ cd testDocumentationAutomation
$ source venv/bin/activate
$ python -m src.cli server
# ✅ Servidor corriendo en http://localhost:8000

# 2. Abrir navegador
Browser → http://localhost:8000

# 3. Dashboard inicial (vacío)
┌────────────────────────────────────┐
│ 🎯 QA Flow                         │
│                                    │
│ No tienes proyectos aún            │
│ [➕ Crear Primer Proyecto]         │
└────────────────────────────────────┘

# 4. Crear nuevo proyecto
Click "Crear Proyecto"
  Nombre: Pilsen Fresh - Marketing Campaign
  Cliente: Backus (AB InBev)
  Fecha inicio: 01/11/2024
  [💾 Guardar]

# 5. Dashboard actualizado
┌────────────────────────────────────┐
│ 📊 Pilsen Fresh                    │
│ ┌──────┬──────┬──────┬──────┐    │
│ │  0   │  0   │  0   │  0%  │    │
│ │Stories│Tests│ Bugs │Cover │    │
│ └──────┴──────┴──────┴──────┘    │
│                                    │
│ [📤 Subir Excel]                   │
└────────────────────────────────────┘

# 6. Subir archivo Excel
Click "Subir Excel"
Selecciona: pilsen_user_stories.xlsx
[⬆️ Upload]

# Sistema procesa...
✅ Parseadas 15 User Stories
✅ 67 Criterios de Aceptación detectados
✅ Datos guardados en base de datos

# 7. Dashboard actualizado
┌────────────────────────────────────┐
│ 📊 Pilsen Fresh                    │
│ ┌──────┬──────┬──────┬──────┐    │
│ │ 15   │  0   │  0   │  0%  │    │
│ │Stories│Tests│ Bugs │Cover │    │
│ └──────┴──────┴──────┴──────┘    │
│                                    │
│ [✨ Generar Test Cases]            │
└────────────────────────────────────┘


# ===== DÍA 2: GENERACIÓN DE TEST CASES =====

# 8. Ver User Stories
Click en "Stories" (sidebar)

┌─────────────────────────────────────────┐
│ US-001 │ Login usuario    │ Alta │ - │  │
│ US-002 │ Recuperar pass   │ Media│ - │  │
│ US-003 │ Perfil usuario   │ Baja │ - │  │
│ ...    │ ...              │ ...  │ - │  │
└─────────────────────────────────────────┘

# 9. Seleccionar historias prioritarias
☑ US-001 (Login)
☑ US-002 (Recuperar password)
☑ US-005 (Notificaciones)
☑ US-007 (Dashboard)
☑ US-010 (Carrito de compras)

# 10. Generar test cases con IA
Click "🤖 Generar Tests con IA (5 seleccionadas)"

Modal de confirmación:
┌─────────────────────────────────────────┐
│ Configuración de Generación IA          │
│                                         │
│ Modelo: [Gemini 2.5 Flash ▼]           │
│ Escenarios por US: [3 ▼]               │
│ Incluir casos negativos: [✓]           │
│ Incluir edge cases: [✓]                │
│                                         │
│ Costo estimado: ~$0.02                 │
│ Tiempo estimado: 30-45 segundos        │
│                                         │
│ [🚀 Generar] [❌ Cancelar]             │
└─────────────────────────────────────────┘

Click "Generar"

# Sistema procesa con IA...
🤖 Analizando US-001... ✓
🤖 Generando escenarios US-001... ✓ (3 escenarios)
🤖 Analizando US-002... ✓
🤖 Generando escenarios US-002... ✓ (3 escenarios)
🤖 Analizando US-005... ✓
🤖 Generando escenarios US-005... ✓ (4 escenarios)
🤖 Analizando US-007... ✓
🤖 Generando escenarios US-007... ✓ (3 escenarios)
🤖 Analizando US-010... ✓
🤖 Generando escenarios US-010... ✓ (5 escenarios)

✅ 18 Test Cases generados en 42 segundos
💾 Guardados en base de datos
📄 Archivos .feature creados

# 11. Dashboard actualizado
┌────────────────────────────────────┐
│ 📊 Pilsen Fresh                    │
│ ┌──────┬──────┬──────┬──────┐    │
│ │ 15   │ 18   │  0   │ 33%  │    │
│ │Stories│Tests│ Bugs │Cover │    │
│ └──────┴──────┴──────┴──────┘    │
└────────────────────────────────────┘

# 12. Ver test cases generados
Click en "Tests" (sidebar)

┌──────────────────────────────────────────────┐
│ TC-001-001 │ Login exitoso         │ Pass │ │
│ TC-001-002 │ Login fail password   │ -    │ │
│ TC-001-003 │ Login email inválido  │ -    │ │
│ TC-002-001 │ Reset password email  │ -    │ │
│ ...                                          │
└──────────────────────────────────────────────┘

# 13. Revisar test case específico
Click en "TC-001-001"

┌────────────────────────────────────────────┐
│ Feature: Autenticación de usuario         │
│                                            │
│ Scenario: Login exitoso credenciales OK   │
│   Given usuario en página login           │
│   When ingresa email "user@mail.com"      │
│   And ingresa password "Pass123!"         │
│   And click "Iniciar Sesión"             │
│   Then redirigido a dashboard              │
│   And ve mensaje "Bienvenido"             │
└────────────────────────────────────────────┘

# 14. Exportar Test Plan
Click "📄 Exportar PDF"

Generando Test Plan...
✅ TestPlan_PilsenFresh_14Nov2024.pdf
📥 Descargado

# PDF contiene:
- Portada con info del proyecto
- 15 User Stories con detalles
- 18 Test Cases en formato Gherkin
- Matriz de trazabilidad
- Firmas para aprobación


# ===== DÍA 3: EJECUCIÓN Y TRACKING =====

# 15. Tester ejecuta pruebas manualmente
Click en TC-001-001
Ejecuta los pasos del escenario
Resultado: ✅ Todo funciona

Click "✅ Marcar como Pass"
  Ejecutado por: Jordan
  Fecha: 14/11/2024 15:30
  Comentarios: Login funciona correctamente
  [💾 Guardar]

# 16. Tester encuentra un bug
Click en TC-001-003
Ejecuta: Login con email inválido
Resultado: ❌ No muestra mensaje de error

Click "❌ Marcar como Fail"
Click "🐛 Reportar Bug"

┌─────────────────────────────────────────┐
│ Nuevo Bug                               │
│                                         │
│ Título: Login no valida formato email  │
│ US: US-001                              │
│ TC: TC-001-003                          │
│ Severidad: Media                        │
│                                         │
│ Descripción:                            │
│ Al ingresar email sin @, el sistema    │
│ intenta hacer login en vez de mostrar  │
│ error de validación.                    │
│                                         │
│ Pasos:                                  │
│ 1. Ir a /login                         │
│ 2. Ingresar "usuariomail.com"          │
│ 3. Click Iniciar Sesión                │
│ 4. Ver loading infinito                │
│                                         │
│ [📎 Adjuntar screenshot.png]            │
│ [💾 Crear Bug]                          │
└─────────────────────────────────────────┘

# Bug creado: BUG-001

# 17. Dashboard actualizado en tiempo real
┌────────────────────────────────────┐
│ 📊 Pilsen Fresh                    │
│ ┌──────┬──────┬──────┬──────┐    │
│ │ 15   │ 18   │  1   │ 33%  │    │
│ │Stories│Tests│ Bugs │Cover │    │
│ └──────┴──────┴──────┴──────┘    │
│                                    │
│ 📈 Tests: 6/18 ejecutados          │
│    Pass: 5 | Fail: 1               │
│                                    │
│ 🐛 Bugs:                           │
│  • BUG-001 (Media) - US-001        │
└────────────────────────────────────┘

# 18. Generar reporte de ejecución
Click "📊 Reportes"
Tipo: Reporte de Ejecución
Período: 11/11 - 14/11
Formato: PDF + Excel

[📥 Generar]

✅ ExecutionReport_PilsenFresh_Week46.pdf
✅ ExecutionReport_PilsenFresh_Week46.xlsx
📥 Descargados

# PDF contiene:
- Executive Summary
- Tests ejecutados: 6/18 (33%)
- Pass Rate: 83% (5/6)
- Bugs encontrados: 1 (Media)
- Cobertura por módulo
- Recomendaciones


# ===== RESULTADO FINAL =====

Dashboard completo:
┌──────────────────────────────────────────────┐
│ 🎯 QA Flow - Pilsen Fresh                   │
│                                              │
│ ┌──────┬──────┬──────┬──────┐              │
│ │ 15   │ 18   │  1   │ 33%  │              │
│ │Stories│Tests│ Bugs │Cover │              │
│ └──────┴──────┴──────┴──────┘              │
│                                              │
│ 📊 Métricas del Sprint:                     │
│  • Historias completadas: 5/15 (33%)       │
│  • Tests ejecutados: 6/18 (33%)            │
│  • Pass rate: 83%                           │
│  • Bugs críticos: 0                         │
│  • Bugs abiertos: 1 (media)                │
│                                              │
│ 📂 Archivos generados:                      │
│  • TestPlan_PilsenFresh.pdf                │
│  • ExecutionReport_Week46.pdf               │
│  • 18 archivos .feature                     │
│  • BugReport_BUG001.docx                    │
│                                              │
│ ✅ Proyecto en progreso normal              │
└──────────────────────────────────────────────┘
```

### **Resultado Tangible:**

En 3 días, el QA Manager tiene:
- ✅ 15 User Stories organizadas
- ✅ 18 Test Cases profesionales generados con IA
- ✅ 6 Tests ejecutados y documentados
- ✅ 1 Bug reportado y trackeado
- ✅ 2 Reportes PDF para stakeholders
- ✅ Dashboard actualizado en tiempo real
- ✅ Todo centralizado en una herramienta

**SIN necesitar:**
- ❌ Notion (complejidad)
- ❌ Jira (costo)
- ❌ Confluence (documentación)
- ❌ TestRail (tracking)

Todo en UNA SOLA herramienta local. 🚀

---

## 📝 Plan de Implementación

### **Fase 1: Backend API (1-2 días)**
- [ ] Limpiar archivos de Notion
- [ ] Reorganizar API en `/api` endpoints
- [ ] Crear endpoints REST para:
  - GET/POST `/api/user-stories`
  - GET/POST `/api/test-cases`
  - GET/POST `/api/bug-reports`
  - POST `/api/upload` (Excel)
  - GET `/api/dashboard/metrics`
  - POST `/api/generate-tests` (con IA)
  - GET `/api/export/{format}` (PDF, Word, etc.)

### **Fase 2: Frontend Base (2-3 días)**
- [ ] Crear estructura HTML
- [ ] Diseñar UI con CSS (o Tailwind)
- [ ] Implementar Dashboard
- [ ] Conectar con API usando Fetch/Axios

### **Fase 3: Funcionalidades Core (2-3 días)**
- [ ] Módulo de carga de Excel
- [ ] Vista de User Stories (tabla interactiva)
- [ ] Vista de Test Cases (Gherkin viewer)
- [ ] Generación de tests con IA
- [ ] Sistema de exportación

### **Fase 4: Features Avanzadas (3-4 días)**
- [ ] Métricas y gráficos
- [ ] Edición inline de test cases
- [ ] Búsqueda y filtros
- [ ] Sincronización Azure DevOps
- [ ] Sistema de versiones

### **Fase 5: Polish & Deploy (1-2 días)**
- [ ] Testing completo
- [ ] Documentación de usuario
- [ ] Docker setup
- [ ] Deploy (local o cloud)

---

## 🚀 Quick Start para Continuar

### **Paso 1: Limpiar proyecto**
```bash
# Eliminar archivos de Notion
rm src/integrations/notion_client.py
rm src/integrations/mcp_notion_client.py
rm src/cli_notion_setup.py
rm src/notion_ai_orchestrator.py
rm src/gemini_mcp_orchestrator.py

# Actualizar requirements.txt
sed -i '/notion-client/d' requirements.txt
```

### **Paso 2: Crear estructura frontend**
```bash
mkdir -p frontend/{css,js,components}
touch frontend/index.html
touch frontend/css/styles.css
touch frontend/js/app.js
```

### **Paso 3: Reorganizar API**
```bash
mkdir -p src/api
touch src/api/{__init__.py,user_stories.py,test_cases.py,dashboard.py}
```

### **Paso 4: Actualizar main.py**
Modificar `src/main.py` para servir el frontend y organizar las rutas.

---

## 📚 Documentación para el Próximo LLM

### **Contexto del Proyecto:**
Este es un sistema de automatización de documentación QA que:
1. Parsea User Stories desde Excel
2. Genera test cases automáticamente con Gemini AI
3. Crea documentación (PDF, Word, Markdown)
4. Proporciona una interfaz web para gestión

### **Tecnologías Clave:**
- **Backend:** FastAPI + SQLAlchemy + SQLite
- **IA:** Google Gemini API (`gemini-2.5-flash`)
- **Frontend:** HTML/CSS/JS (a implementar)
- **Testing:** Gherkin/BDD

### **Archivos Importantes:**
- `src/config.py` - Configuración y variables de entorno
- `src/models/` - Modelos de datos (UserStory, TestCase, BugReport)
- `src/parsers/file_parser.py` - Parser de Excel con auto-detección
- `src/generators/` - Generadores de documentos
- `src/integrations/gemini_client.py` - Cliente de IA
- `src/database/` - Setup de base de datos

### **Estado Actual:**
- ✅ Backend funcional con CLI
- ✅ Parser de Excel robusto
- ✅ Generación de Gherkin con IA
- ✅ Exportación a PDF/Word
- ❌ Interfaz web (por implementar)
- ❌ API REST organizada (por refactorizar)

### **Próximos Pasos:**
1. Eliminar código de Notion
2. Crear interfaz web
3. Reorganizar API REST
4. Implementar dashboard interactivo

---

## 💡 Recomendaciones Finales

1. **Mantén el core simple:** SQLite + FastAPI + archivos locales
2. **Frontend progresivo:** Empieza con vanilla JS, migra a React si crece
3. **Gemini como ventaja competitiva:** La generación automática de test cases es el diferenciador
4. **Exportación multi-formato:** Mantén PDF, Word, Markdown para flexibilidad
5. **Azure DevOps como bonus:** Sync opcional, no obligatoria

---

## 🎯 Ventajas de este Enfoque

✅ **Control total** sobre UI/UX
✅ **Sin dependencias externas complejas** (Notion, MCP)
✅ **Escalable** - Puedes agregar features sin limitaciones
✅ **Portable** - SQLite + archivos locales = fácil de mover
✅ **Profesional** - Herramienta dedicada vs. adaptación de Notion
✅ **Reutilizable** - Otros proyectos QA pueden usarla

---

**Fecha de Redefinición:** 2025-11-14
**Versión del Documento:** 1.0
**Estado:** Pendiente de aprobación e implementación

# 🧪 QA Documentation Automation

Sistema automatizado para generar documentación de QA a partir de historias de usuario.

## 🚀 Características

- **Parser Flexible**: Lee historias de usuario desde archivos XLSX o CSV
- **Generación con IA**: Usa Google Gemini para generar escenarios de prueba inteligentes en formato Gherkin (BDD)
- **Documentación Completa**: Genera automáticamente:
  - Escenarios Gherkin (.feature files)
  - Test Plans (Markdown y PDF)
  - Plantillas de Bug Reports (Word)
- **Tracking**: Base de datos SQLite para seguimiento de progreso
- **Integraciones**:
  - **Notion**: Sincroniza historias, test cases y bugs
  - **Azure DevOps**: Crea Work Items, Test Cases y Bugs
- **Dual Interface**:
  - CLI para automatización y scripts
  - Web UI para uso interactivo

## 📋 Requisitos Previos

- Python 3.9 o superior
- pip (gestor de paquetes de Python)
- API Key de Google Gemini ([obtener aquí](https://makersuite.google.com/app/apikey))
- (Opcional) Token de Notion para integración
- (Opcional) PAT de Azure DevOps para integración

## 🔧 Instalación

### 1. Clonar o navegar al directorio del proyecto

```bash
cd testDocumentationAutomation
```

### 2. Crear entorno virtual

```bash
python -m venv venv

# En Linux/Mac:
source venv/bin/activate

# En Windows:
venv\Scripts\activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Copiar el archivo de ejemplo y editarlo con tus credenciales:

```bash
cp .env.example .env
```

Editar `.env` y agregar tus API keys:

```env
# REQUERIDO
GEMINI_API_KEY=tu_api_key_de_gemini_aqui

# OPCIONAL - Notion
NOTION_API_KEY=tu_token_de_notion
NOTION_DATABASE_ID=id_de_tu_base_de_datos_notion

# OPCIONAL - Azure DevOps
AZURE_DEVOPS_ORG_URL=https://dev.azure.com/tu_organizacion
AZURE_DEVOPS_PAT=tu_personal_access_token
AZURE_DEVOPS_PROJECT=nombre_de_tu_proyecto
```

### 5. Inicializar la base de datos

```bash
python -m src.cli init
```

## 📖 Uso

### Opción 1: CLI (Línea de Comandos)

#### Comandos Disponibles

```bash
# Ver ayuda
python -m src.cli --help

# Inicializar base de datos
python -m src.cli init

# Parsear archivo de historias de usuario
python -m src.cli parse archivo.xlsx

# Generar test cases para una historia
python -m src.cli generate-tests US-001 --use-ai --num-scenarios 3

# Generar test plan
python -m src.cli generate-plan "Mi Proyecto" --format both

# Crear plantilla de bug report
python -m src.cli create-template

# Listar historias de usuario
python -m src.cli list-stories

# Ver estadísticas
python -m src.cli stats

# Iniciar servidor web
python -m src.cli server
```

#### Ejemplo de Flujo Completo (CLI)

```bash
# 1. Parsear archivo de historias
python -m src.cli parse ejemplos/user_stories.xlsx

# 2. Ver las historias parseadas
python -m src.cli list-stories

# 3. Generar test cases con IA para una historia
python -m src.cli generate-tests US-001 --use-ai --num-scenarios 3

# 4. Generar test plan completo
python -m src.cli generate-plan "Mi Proyecto QA"

# 5. Ver estadísticas
python -m src.cli stats
```

### Opción 2: Web UI

#### Iniciar el servidor

```bash
python -m src.cli server
```

O directamente:

```bash
python src/main.py
```

Luego abre tu navegador en: **http://localhost:8000**

#### Características de la Web UI

- **Upload & Parse**: Arrastra y suelta archivos XLSX/CSV
- **Visualización**: Ve todas tus historias de usuario parseadas
- **Generación**: Genera test cases con un click
- **Test Plans**: Crea test plans en Markdown y PDF
- **Integraciones**: Sincroniza con Notion y Azure DevOps
- **Estadísticas**: Dashboard con métricas del proyecto

### Opción 3: API REST

El servidor FastAPI expone endpoints REST que puedes consumir desde cualquier cliente.

#### Documentación Interactiva

Una vez iniciado el servidor, visita:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

#### Endpoints Principales

```bash
# Health check
GET /api/v1/health

# Upload file
POST /api/v1/upload

# Get user stories
GET /api/v1/user-stories

# Generate test cases
POST /api/v1/generate-test-cases/{story_id}

# Generate test plan
POST /api/v1/generate-test-plan?project_name=MyProject

# Sync to Notion
POST /api/v1/sync-to-notion/{story_id}

# Sync to Azure DevOps
POST /api/v1/sync-to-azure/{story_id}

# Statistics
GET /api/v1/stats
```

## 📁 Formato del Archivo de Entrada

El sistema acepta archivos **XLSX** o **CSV** con las siguientes columnas (el parser es flexible con los nombres):

### Columnas Requeridas

- **ID**: Identificador de la historia (ej: US-001, STORY-123)
- **Title**: Título de la historia de usuario
- **Description**: Descripción o narrativa completa

### Columnas Opcionales

- **Acceptance Criteria**: Criterios de aceptación (separados por líneas, ; o |)
- **Priority**: Critical, High, Medium, Low
- **Status**: Backlog, To Do, In Progress, Testing, Done
- **Epic**: Nombre del épico
- **Sprint**: Sprint asignado
- **Story Points**: Puntos de historia (número)
- **Assigned To**: Persona asignada

### Ejemplo de Archivo CSV

```csv
ID,Title,Description,Acceptance Criteria,Priority,Status
US-001,Login de usuario,Como usuario quiero iniciar sesión con email y contraseña,"- El usuario puede ingresar email y contraseña
- El sistema valida las credenciales
- Login exitoso redirige al dashboard",High,To Do
US-002,Recuperar contraseña,Como usuario quiero recuperar mi contraseña olvidada,"- Usuario puede solicitar link de recuperación
- Email es enviado con el link
- Link expira en 24 horas",Medium,Backlog
```

### Generar Plantilla de Ejemplo

```bash
python -c "from src.parsers import FileParser; FileParser.create_template_excel('plantilla.xlsx')"
```

## 🎯 Integraciones

### Notion

#### 1. Crear Integración en Notion

1. Ve a https://www.notion.so/my-integrations
2. Click en "+ New integration"
3. Dale un nombre y selecciona tu workspace
4. Copia el "Internal Integration Token"

#### 2. Compartir Base de Datos con la Integración

1. Crea una página/base de datos en Notion
2. Click en "Share" (arriba derecha)
3. Invita tu integración
4. Copia el ID de la base de datos desde la URL:
   ```
   https://notion.so/workspace/DATABASE_ID?v=...
                              ^^^^^^^^^^^
   ```

#### 3. Configurar en .env

```env
NOTION_API_KEY=secret_xxx...
NOTION_DATABASE_ID=abc123...
```

#### 4. Sincronizar

```bash
# CLI
python -m src.cli init

# O desde la Web UI, click en "Sync to Notion"
```

### Azure DevOps

#### 1. Crear Personal Access Token (PAT)

1. Ve a https://dev.azure.com/{tu-org}
2. User Settings → Personal Access Tokens
3. New Token con permisos:
   - Work Items: Read, Write
   - Test Management: Read, Write
4. Copia el token

#### 2. Configurar en .env

```env
AZURE_DEVOPS_ORG_URL=https://dev.azure.com/tu-organizacion
AZURE_DEVOPS_PAT=tu_pat_aqui
AZURE_DEVOPS_PROJECT=NombreDelProyecto
```

#### 3. Sincronizar

Las historias se crearán como "User Story" work items en Azure DevOps.

## 🗂️ Estructura del Proyecto

```
testDocumentationAutomation/
├── src/
│   ├── models/              # Modelos de datos (Pydantic)
│   ├── parsers/             # Parser de XLSX/CSV
│   ├── generators/          # Generadores de documentos
│   ├── integrations/        # Clients para APIs externas
│   ├── database/            # Modelos de base de datos (SQLAlchemy)
│   ├── api/                 # Rutas de FastAPI
│   ├── config.py            # Configuración
│   ├── main.py              # Aplicación FastAPI
│   └── cli.py               # Interface CLI
├── frontend/                # Web UI
│   ├── index.html
│   ├── style.css
│   └── app.js
├── output/                  # Documentos generados
├── uploads/                 # Archivos subidos
├── data/                    # Base de datos SQLite
├── requirements.txt
├── .env.example
└── README.md
```

## 🛠️ Tecnologías Utilizadas

- **Backend**: Python 3.9+, FastAPI
- **AI**: Google Gemini (gemini-pro)
- **Parsers**: pandas, openpyxl
- **Generadores**: python-docx, python-pptx, reportlab
- **Base de Datos**: SQLite + SQLAlchemy
- **Integraciones**: notion-client, azure-devops
- **CLI**: typer, rich
- **Frontend**: HTML, CSS, JavaScript (Vanilla)

## 🎓 Ejemplos de Salida

### Archivo Gherkin (.feature)

```gherkin
Feature: Login de usuario
  Como usuario quiero iniciar sesión con email y contraseña

  User Story: US-001
  Priority: High

  Acceptance Criteria:
  - El usuario puede ingresar email y contraseña
  - El sistema valida las credenciales
  - Login exitoso redirige al dashboard

@smoke @positive
Scenario: Login exitoso con credenciales válidas
  Given el usuario está en la página de login
  And el usuario tiene credenciales válidas
  When el usuario ingresa su email
  And el usuario ingresa su contraseña
  And el usuario hace click en el botón Login
  Then el usuario es redirigido al dashboard
  And el usuario ve un mensaje de bienvenida
```

### Test Plan (Markdown)

El sistema genera un test plan completo con:
- Resumen ejecutivo
- Alcance de las pruebas
- Estrategia de testing
- Casos de prueba organizados
- Criterios de entrada/salida
- Cronograma
- Gestión de defectos

### Bug Report (Word)

Template profesional con:
- ID y metadata del bug
- Descripción detallada
- Pasos para reproducir
- Comportamiento esperado vs actual
- Información del ambiente
- Screenshots/attachments

## 🔍 Troubleshooting

### Error: "GEMINI_API_KEY not found"

Asegúrate de:
1. Tener el archivo `.env` en el directorio raíz
2. Haber configurado `GEMINI_API_KEY=tu_clave`
3. Reiniciar el servidor si está corriendo

### Error al parsear archivo

- Verifica que el archivo sea .xlsx o .csv
- Asegúrate que tenga al menos las columnas: ID, Title, Description
- Revisa que no haya filas completamente vacías

### Integración con Notion no funciona

- Verifica que el token sea correcto
- Asegúrate de haber compartido la base de datos con la integración
- Confirma que el DATABASE_ID sea correcto

## 🚀 Próximas Mejoras

- [ ] Soporte para Jira API
- [ ] Exportar a Excel con macros
- [ ] Dashboards avanzados con gráficos
- [ ] Automatización de ejecución de tests
- [ ] Integración con Selenium/Playwright
- [ ] Notificaciones por email/Slack
- [ ] Multi-idioma
- [ ] Docker container

## 📝 Licencia

Este proyecto es de código abierto para uso interno.

## 👥 Contacto

Para preguntas o sugerencias, contacta al equipo de QA.

---

**Hecho con ❤️ para automatizar QA**

# Prompt para Gemini 2.5: Definición de Métricas y Visualizaciones para Admin Dashboard

## 🎯 OBJETIVO

Necesito tu ayuda para diseñar el **Admin Dashboard** de nuestro sistema de gestión de QA (Quality Assurance). Específicamente necesito:

1. **Definir métricas correctas** para mostrar al administrador
2. **Determinar navegación** de las cards (¿a qué pantallas deben redirigir?)
3. **Explicar cálculo de Test Coverage** en un plan de testing real
4. **Generar imágenes y gráficas visuales** para implementar

---

## 📋 CONTEXTO DEL PROYECTO

### Sistema: QA Documentation Management (SaaS Multi-Tenant)

**Propósito**: Plataforma para gestionar el ciclo completo de QA desde user stories hasta reportes de bugs y ejecuciones de pruebas.

**Stack Tecnológico**:
- **Backend**: FastAPI (Python) + SQLAlchemy + SQLite
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **AI**: Google Gemini 2.5-flash (generación automática de test cases)
- **Docs**: ReportLab (PDF) + python-docx (Word)

---

## 👥 ROLES DEL SISTEMA

| Rol | Responsabilidades | Necesidades de Información |
|-----|------------------|---------------------------|
| **ADMIN** | - Gestión de usuarios (invitaciones, roles)<br>- Monitoreo global del sistema<br>- Configuración de plataforma | - Actividad de usuarios<br>- Uso de recursos<br>- Salud general del sistema<br>- Tendencias de adopción |
| **MANAGER** | - Supervisión de múltiples proyectos<br>- Análisis de métricas de calidad<br>- Toma de decisiones estratégicas | - KPIs consolidados<br>- Proyectos en riesgo<br>- Comparativas entre proyectos<br>- Health scores |
| **QA** | - Creación de test cases<br>- Ejecución de pruebas<br>- Documentación de bugs | - Test coverage por proyecto<br>- Pass/Fail rates<br>- Bugs abiertos/críticos |
| **DEV** | - Revisión de bugs<br>- Fix de issues<br>- Consulta de test cases | - Bugs asignados<br>- Test cases relacionados<br>- Criterios de aceptación |

---

## 🔄 WORKFLOW COMPLETO DEL SISTEMA

### 1️⃣ **User Stories** (Historias de Usuario)
```
Entrada: Excel/CSV con user stories
Campos: ID, Title, Description, Acceptance Criteria, Priority, Status
```

**Ejemplo**:
```
US-001: Login de Usuario
Description: Como usuario quiero iniciar sesión con email y password
Acceptance Criteria:
  - Validar email formato correcto
  - Validar password mínimo 8 caracteres
  - Mostrar mensaje error si credenciales incorrectas
  - Redirigir a dashboard si login exitoso
Priority: HIGH
Status: In Progress
```

### 2️⃣ **Test Cases** (Casos de Prueba)
```
Generación: Manual o AI-powered (Gemini)
Formato: Gherkin (.feature files)
Tipos: Functional, Integration, E2E, Regression, Performance
```

**Ejemplo de Test Case generado por AI**:
```gherkin
Feature: User Login
  As a user
  I want to login with my credentials
  So that I can access my dashboard

  Scenario: Successful login with valid credentials
    Given I am on the login page
    And I have a registered account with email "qa@company.com"
    When I enter email "qa@company.com"
    And I enter password "securePass123"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see a welcome message

  Scenario: Failed login with invalid password
    Given I am on the login page
    When I enter email "qa@company.com"
    And I enter password "wrongPassword"
    And I click the login button
    Then I should see error message "Email o contraseña incorrectos"
    And I should remain on the login page
```

**Relación**:
- 1 User Story → N Test Cases
- 1 Test Case → N Scenarios (en Gherkin)

### 3️⃣ **Test Executions** (Ejecuciones de Pruebas)
```
Ejecución: Manual por QA Engineer
Resultados: PASSED, FAILED, BLOCKED, SKIPPED
Evidencias: Screenshots, videos, logs
```

**Datos capturados**:
- Test Case ID
- Scenario ejecutado
- Status final
- Steps results (cada Given/When/Then con su resultado)
- Environment (browser, OS, versión)
- Executed by (usuario)
- Execution date/time
- Evidence files (paths a screenshots/videos)
- Observations

**Ejemplo**:
```json
{
  "test_case_id": "TC-001",
  "scenario": "Successful login with valid credentials",
  "status": "PASSED",
  "steps_results": [
    {"step": "Given I am on the login page", "status": "PASSED"},
    {"step": "When I enter email...", "status": "PASSED"},
    {"step": "Then I should be redirected...", "status": "PASSED"}
  ],
  "environment": "Chrome 120 / Windows 11",
  "executed_by": "qa@company.com",
  "execution_date": "2025-11-24T10:30:00Z",
  "evidence": ["screenshots/login_success.png"]
}
```

### 4️⃣ **Bug Reports** (Reportes de Errores)
```
Creación: Manual por QA/Dev
Prioridad: CRITICAL, HIGH, MEDIUM, LOW
Estado: OPEN, IN_PROGRESS, RESOLVED, CLOSED
```

**Campos de Bug Report**:
- Title
- Severity (CRITICAL, HIGH, MEDIUM, LOW)
- Priority (URGENT, HIGH, MEDIUM, LOW)
- Status
- Test Case ID relacionado (opcional)
- User Story ID relacionado (opcional)
- Steps to Reproduce
- Expected Behavior
- Actual Behavior
- Environment (browser, OS, device)
- Screenshots
- Reported by
- Assigned to (opcional)

---

## 📊 MÉTRICAS ACTUALES DEL ADMIN DASHBOARD

### Métricas Implementadas (Cards):

1. **Total Usuarios** → Muestra cantidad total de usuarios en el sistema
2. **Registrados** → Usuarios que completaron su registro (is_registered=true)
3. **Pendientes** → Usuarios con invitación pero sin completar registro
4. **Tasa de Activación** → Porcentaje: (Registrados / Total) * 100

### Métricas por Rol:

- Administradores (count)
- QA Engineers (count)
- Developers (count)
- Managers (count)

### Tabla de Usuarios Recientes:

Muestra últimos 5 usuarios con: Nombre, Email, Rol, Estado

---

## ❓ PREGUNTAS PARA GEMINI

### 1. Métricas para Admin Dashboard

**Contexto**: El admin NO gestiona proyectos directamente (eso es Manager/QA/Dev). El admin gestiona **usuarios, plataforma, y salud del sistema**.

**Pregunta**:
```
¿Qué métricas son REALMENTE relevantes para un Admin en un sistema SaaS de QA?
```

**Considera**:
- **Adopción**: ¿Usuarios activos vs inactivos? ¿Logins por semana?
- **Uso de recursos**: ¿Proyectos activos? ¿Test cases generados con AI? ¿Storage usado?
- **Salud del sistema**: ¿Errores en background? ¿Reportes generados? ¿Integraciones funcionando?
- **Tendencias**: ¿Crecimiento de usuarios? ¿Actividad por rol?
- **Licenciamiento** (futuro): ¿Usuarios por organización? ¿Límites de uso?

**Comparación con Manager Dashboard** (ya implementado):
- Manager ve: Test Coverage, Bugs, Pass Rate, Health Score, Proyectos en Riesgo
- Admin debe ver: ???

### 2. Navegación de Cards

**Pregunta**:
```
Cuando el admin hace click en cada card/métrica, ¿a qué pantalla debería navegar?
```

**Opciones actuales**:
- `/admin/users` → Gestión de usuarios (ya existe)
- `/admin/projects` → Vista de todos los proyectos (¿crear?)
- `/admin/activity` → Log de actividad del sistema (¿crear?)
- `/admin/analytics` → Dashboard de analytics avanzado (¿crear?)
- `/admin/settings` → Configuración de plataforma (¿crear?)

**Ejemplos de comportamiento esperado**:
- Click en "Total Usuarios" → ¿Navegar a `/admin/users`?
- Click en "Tasa de Activación" → ¿Mostrar modal con breakdown? ¿O navegar a analytics?
- Click en "Usuarios Pendientes" → ¿Filtrar tabla de usuarios por pendientes?

### 3. Cálculo de Test Coverage

**Pregunta**:
```
¿Cómo se calcula REALMENTE el Test Coverage en un plan de testing profesional?
```

**Contexto actual** (implementación):
```python
# Nuestro cálculo actual:
test_coverage = (stories_with_tests / total_user_stories) * 100

# Donde:
# - stories_with_tests = User Stories que tienen al menos 1 test case
# - total_user_stories = Total de user stories en el proyecto
```

**¿Es correcto este enfoque? ¿Deberíamos considerar**:
- **Scenario coverage**: ¿Todos los escenarios posibles cubiertos?
- **Acceptance criteria coverage**: ¿Cada criterio de aceptación tiene test?
- **Execution coverage**: ¿Test cases ejecutados vs creados?
- **Code coverage** (si aplica): ¿Líneas de código cubiertas por tests?

**Ejemplo**:
```
User Story US-001 tiene:
- 3 Acceptance Criteria
- 2 Test Cases creados
- 1 Test Case ejecutado

¿Cuál es el coverage de US-001?
- Opción A: 100% (tiene test cases)
- Opción B: 66% (2 de 3 criterios cubiertos)
- Opción C: 50% (1 de 2 test cases ejecutados)
```

### 4. Visualizaciones y Gráficas

**Solicitud**:
```
Genera imágenes visuales (mockups, diagramas, gráficas) para ayudarnos a implementar:
```

1. **Admin Dashboard completo** con las métricas recomendadas
2. **Breakdown modal** de métricas (ej: actividad de usuarios por día)
3. **Gráfica de Test Coverage** explicando los diferentes niveles
4. **Comparativa** Admin Dashboard vs Manager Dashboard
5. **Flujo de navegación** desde cada card a su pantalla destino
6. **Widgets visuales** para métricas clave (ej: trend charts, sparklines, progress rings)

**Formatos deseados**:
- Wireframes / Mockups de pantallas
- Diagramas de flujo (navegación)
- Gráficas de métricas (bars, lines, donuts, gauges)
- Iconografía sugerida (lucide-react icons)
- Paleta de colores (TailwindCSS compatible)

---

## 🎨 GUIDELINES DE DISEÑO

### UI Framework:
- **Components**: TailwindCSS + lucide-react icons
- **Layout**: Grid responsive (mobile-first)
- **Cards**: Shadow, border-radius, hover effects
- **Colors**: Blue (primary), Purple (admin), Green (success), Red (danger), Yellow (warning)

### Estilo de Cards Actuales:
```jsx
<div className="card"> {/* bg-white shadow rounded-lg p-6 */}
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-600">Métrica</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">123</p>
    </div>
    <div className="bg-blue-100 rounded-full p-3">
      <Icon size={24} className="text-blue-600" />
    </div>
  </div>
</div>
```

---

## 📐 EJEMPLOS DE REFERENCIA

### Manager Dashboard (ya implementado):

**Global Stats Cards**:
1. **Total de Proyectos** (con filtro activos/inactivos)
2. **Cobertura Promedio** de tests
3. **Bugs Críticos** acumulados
4. **Pass Rate** promedio

**Summary Cards**:
- Proyectos en Riesgo (health score < 50)
- Top 3 Proyectos (mejores health scores)

**Projects Table**:
- Nombre, Stories, Tests, Coverage, Bugs, Pass Rate, Health, Acciones

---

## 🚀 DELIVERABLES ESPERADOS

### 1. Documento de Análisis
- Métricas recomendadas para Admin (con justificación)
- Navegación sugerida por card
- Explicación detallada de Test Coverage (con fórmulas)

### 2. Diseños Visuales
- Mockup completo de Admin Dashboard
- Wireframes de pantallas de destino (analytics, activity log)
- Gráficas y widgets visuales

### 3. Implementación Técnica
- Estructura de datos para nuevas métricas
- Endpoints API necesarios
- Queries SQL/ORM para calcular métricas

### 4. Comparativas
- Admin vs Manager (diferencias clave)
- Test Coverage: niveles y fórmulas
- KPIs por rol

---

## 📝 NOTAS ADICIONALES

### Multi-Tenancy:
- Cada organización tiene sus propios proyectos
- Admin puede ser global o por organización
- Métricas deben respetar `organization_id`

### Escalabilidad:
- Sistema debe soportar 100+ proyectos
- Dashboard debe cargar rápido (<2s)
- Métricas pueden pre-calcularse (cache)

### Roadmap Futuro:
- Integraciones con Jira, GitHub, Slack
- Webhooks y notificaciones
- Analytics avanzado con Machine Learning
- Custom dashboards por usuario

---

## 🎯 PROMPT FINAL PARA GEMINI

**Eres un UX/UI Designer y QA Architect experto. Basándote en toda la información anterior**:

1. **Diseña un Admin Dashboard profesional** con métricas relevantes y navegación clara
2. **Explica el cálculo correcto de Test Coverage** con ejemplos y fórmulas
3. **Genera imágenes y visualizaciones** (mockups, wireframes, gráficas, diagramas de flujo)
4. **Propón mejoras** al workflow actual si ves oportunidades
5. **Diferencia claramente** entre lo que debe ver un Admin vs un Manager

**Formato de respuesta**:
- Sección 1: Análisis y Recomendaciones (texto)
- Sección 2: Diseños Visuales (generar imágenes)
- Sección 3: Implementación Técnica (código/pseudocódigo)
- Sección 4: Roadmap de Mejoras

**Genera las visualizaciones en alta resolución y con anotaciones explicativas**.

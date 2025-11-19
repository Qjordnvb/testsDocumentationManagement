# Documento de Diseño Técnico Completo - QA Documentation Management

Este documento detalla el diseño técnico para completar el MVP del proyecto, basado en los requerimientos de `GEMINI_PROMPT_PROJECT_COMPLETION.md` y `QA_WORKFLOW_COMPLETE.md`.

## 🎯 Objetivo
Completar las funcionalidades críticas faltantes para permitir un ciclo de QA completo: Ejecución de Tests, Reporte de Bugs, Tracking de Criterios de Aceptación y Generación de Reportes.

## 🎨 Principios de UX/UI y Accesibilidad (Transversal)

Para asegurar una experiencia de usuario premium y accesible, todas las implementaciones seguirán estos principios:

1.  **Accesibilidad (WCAG 2.1 AA)**:
    *   Todos los elementos interactivos deben ser navegables por teclado (Tab, Enter, Space).
    *   Uso correcto de `aria-labels`, `role` y `tabindex`.
    *   Contraste de colores suficiente para textos e iconos.
    *   Focus visible en todos los elementos interactivos.
2.  **Usabilidad & Feedback**:
    *   **Toast Notifications**: Feedback inmediato para todas las acciones (éxito/error) usando `react-hot-toast`.
    *   **Loading States**: Skeletons o spinners durante cargas de datos.
    *   **Empty States**: Mensajes claros y acciones sugeridas cuando no hay datos.
    *   **Error Handling**: Mensajes de error amigables y accionables, no solo códigos de error.
3.  **Diseño Visual**:
    *   Consistencia con el sistema de diseño existente (Tailwind CSS).
    *   Espaciado y jerarquía visual clara.

---

## 📅 Priorización y Roadmap

### Sprint 1: MVP Execution (Días 1-3)
**Objetivo**: Habilitar la ejecución de tests y el reporte de bugs.
1.  **Feature 1: Test Execution UI**: Modal de ejecución paso a paso.
2.  **Feature 2: BugsPage + Bug Tracking**: Gestión de bugs y ciclo de vida.
3.  **Feature 3: Acceptance Criteria Checkboxes**: Tracking de progreso real.

### Sprint 2: Tracking & Reports (Días 4-6)
**Objetivo**: Mejorar la visibilidad y documentación.
4.  **Feature 4: Evidence Upload & Storage**: Subida de screenshots/videos.
5.  **Feature 5: ReportsPage**: Generación de reportes de ejecución.
6.  **Feature 6: Test Coverage Calculation**: Métricas de cobertura en Dashboard.

---

## 🛠️ Diseño Técnico Detallado

### Feature 1: Test Execution UI ❌ (CRÍTICO)

#### 1. User Story
Como QA Tester, quiero poder ejecutar un test case paso a paso, marcando cada paso como Passed/Failed y adjuntando evidencias, para registrar formalmente el resultado de mis pruebas.

#### 2. Acceptance Criteria
- [ ] Modal de ejecución muestra pasos Gherkin.
- [ ] Timer automático inicia al abrir el modal.
- [ ] Checkbox para marcar cada paso (Given/When/Then).
- [ ] Posibilidad de adjuntar evidencia en pasos fallidos.
- [ ] Guardar ejecución con status final (PASSED/FAILED/BLOCKED).
- [ ] Ver historial de ejecuciones previas.
- [ ] **UX/A11y**: Navegación completa por teclado (Flechas para pasos, Espacio para marcar).
- [ ] **UX/A11y**: Focus trap dentro del modal.
- [ ] **UX/A11y**: Feedback visual claro al pasar/fallar un paso (colores + iconos).

#### 3. Backend API Design
*Ya existe `test_executions` table, pero necesitamos endpoints para gestión de evidencias y updates.*

```python
# POST /test-executions
# Body:
{
  "test_case_id": "TC-001",
  "executed_by": "qa@example.com",
  "execution_date": "2025-11-19T10:00:00",
  "status": "FAILED",
  "execution_time_minutes": 5,
  "passed_steps": 4,
  "failed_steps": 1,
  "total_steps": 5,
  "notes": "Fallo en el último paso",
  "failure_reason": "Mensaje de error inesperado",
  "evidence_files": ["screenshot1.png"]
}
```

#### 4. Frontend Component Design
**Component**: `TestExecutionModal`
- **Props**: `testCase: TestCase`, `onClose: () => void`, `onSave: () => void`
- **State**:
    - `currentStep`: number
    - `stepStatuses`: Record<number, 'pass' | 'fail' | 'skip'>
    - `timer`: number (seconds)
    - `evidence`: File[]
- **UI**:
    - Header con Timer y Título.
    - Lista de pasos Gherkin con checkboxes.
    - Área de "Failure Details" (visible si status === FAILED).
    - Dropzone para evidencias.
    - Footer con botones "Pass & Next", "Fail", "Save Execution".

---

### Feature 2: BugsPage + Bug Tracking ❌ (CRÍTICO)

#### 1. User Story
Como QA Tester, quiero reportar bugs encontrados durante la ejecución de tests y gestionar su ciclo de vida, para asegurar que los defectos sean corregidos.

#### 2. Acceptance Criteria
- [ ] Página `BugsPage` con lista de bugs y filtros.
- [ ] `BugFormModal` para crear/editar bugs.
- [ ] Auto-fill de datos cuando se crea desde un Test Execution fallido.
- [ ] Flujo de estados: NEW -> ASSIGNED -> FIXED -> VERIFIED.
- [ ] **UX/A11y**: Validación de formulario en tiempo real con mensajes de error descriptivos.
- [ ] **UX/A11y**: Notificación Toast al crear/actualizar bug.

#### 3. Backend API Design
*Endpoints ya existen (`/bugs`), falta integración frontend.*

#### 4. Frontend Component Design
**Page**: `BugsPage`
- Tabla con columnas: ID, Title, Severity, Priority, Status, Assigned To.
- Filtros: Status, Severity.

**Component**: `BugFormModal`
- **Props**: `initialData?: Partial<BugReport>`, `onSave: () => void`
- **Logic**: Si viene de un test fallido, pre-llenar `steps_to_reproduce` con los pasos del Gherkin y `test_case_id`.

---

### Feature 3: Acceptance Criteria Checkboxes ❌ (CRÍTICO)

#### 1. User Story
Como QA/Dev, quiero marcar criterios de aceptación individuales como completados, para tener un tracking granular del progreso de una User Story.

#### 2. Acceptance Criteria
- [ ] Checkboxes en `StoryTable` (fila expandida) son interactivos.
- [ ] Al hacer click, se actualiza el estado en BD.
- [ ] Se muestra quién completó y cuándo (tooltip o texto pequeño).
- [ ] Barra de progreso de la story se actualiza automáticamente.
- [ ] **UX/A11y**: Checkboxes accesibles por teclado.
- [ ] **UX/A11y**: Estado de carga optimista (optimistic UI) para respuesta inmediata.

#### 3. Backend API Design
```python
# PUT /user-stories/{story_id}/criteria/{criteria_id}
# Body:
{
  "completed": true
}
# Response:
{
  "story_id": "...",
  "criteria_id": "...",
  "completed": true,
  "completion_percentage": 50.0
}
```

#### 4. Frontend Component Design
**Component**: `CriteriaList` (dentro de `StoryTable`)
- **Logic**: `handleToggle(criteriaId)` llama al API y actualiza el estado local optimísticamente o recarga la data.

---

### Feature 4: Evidence Upload & Storage ❌ (ALTA PRIORIDAD)

#### 1. User Story
Como QA, quiero subir capturas de pantalla y videos como evidencia de mis pruebas, para facilitar la reproducción de bugs a los desarrolladores.

#### 2. Acceptance Criteria
- [ ] Endpoint para subir archivos.
- [ ] Almacenamiento organizado por proyecto/entidad.
- [ ] UI para subir archivos (Drag & Drop).
- [ ] Visualización de thumbnails.

#### 3. Backend API Design
```python
# POST /upload-evidence
# Multipart Form Data: file, project_id, entity_type (bug/execution), entity_id
# Response: { "file_path": "uploads/PROJ-001/bugs/BUG-1/image.png", "url": "..." }
```

---

### Feature 5: ReportsPage ❌ (ALTA PRIORIDAD)

#### 1. User Story
Como QA Lead, quiero generar reportes de ejecución y planes de prueba en PDF/DOCX, para comunicar el estado de calidad a los stakeholders.

#### 2. Acceptance Criteria
- [ ] UI en `ReportsPage` para seleccionar tipo de reporte.
- [ ] Generación de "Execution Report" (nuevo).
- [ ] Descarga de archivos generados.

#### 3. Backend API Design
```python
# POST /generate-execution-report
# Query: project_id, format (pdf/docx)
# Response: { "file_url": "..." }
```

---

### Feature 6: Test Coverage Calculation ❌ (ALTA PRIORIDAD)

#### 1. User Story
Como QA Lead, quiero ver métricas de cobertura de pruebas en el Dashboard, para identificar áreas sin probar.

#### 2. Acceptance Criteria
- [ ] Backend calcula coverage real (Stories con tests / Total stories).
- [ ] Dashboard muestra widgets de cobertura.
- [ ] Alertas visuales si la cobertura es baja.

#### 3. Backend API Design
*Actualizar `GET /projects/{id}/stats` o crear `GET /projects/{id}/coverage` para incluir cálculos detallados.*

---

## 🧪 Verification Plan

### Automated Tests
- **Backend**: Ejecutar `pytest` para asegurar que los nuevos endpoints funcionan y no rompen lógica existente.
- **Frontend**: No hay tests automatizados de frontend configurados actualmente. Se realizará validación manual.

### Manual Verification
1.  **Test Execution**:
    - Crear un Test Case.
    - Abrir modal de ejecución.
    - Marcar pasos, subir una imagen dummy.
    - Guardar como FAILED.
    - Verificar que aparece en historial y permite crear Bug.
2.  **Bug Tracking**:
    - Crear Bug desde el test fallido.
    - Verificar que los datos se pre-cargan.
    - Guardar y verificar en `BugsPage`.
3.  **Criteria**:
    - Ir a `StoriesPage`.
    - Expandir story.
    - Click en checkbox.
    - Refrescar y verificar persistencia.

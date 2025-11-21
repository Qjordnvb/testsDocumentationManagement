# Sprint 2 - Análisis de Tareas de Alta Prioridad

**Fecha:** 2025-11-21
**Objetivo:** Mejorar mantenibilidad, calidad de datos y performance

---

## 📊 Resumen Ejecutivo

| Tarea | Impacto | Esfuerzo | LOC Afectadas | Prioridad |
|-------|---------|----------|---------------|-----------|
| **1. Refactorizar componentes** | 🟢 Alto | 🟡 Medio | ~300 | P0 |
| **2. Validación de schema** | 🟢 Alto | 🟢 Bajo | ~100 | P0 |
| **3. Paginación en reportes** | 🟡 Medio | 🟡 Medio | ~150 | P1 |

---

## 🎯 Tarea 1: Refactorizar Componentes Duplicados

### Análisis de Código Actual

#### Componentes Afectados:
1. **TestRunnerModal** (`frontend/src/features/test-execution/ui/TestRunnerModal.tsx`)
   - **LOC:** ~500 líneas
   - **Modo:** Interactivo (permite marcar steps, adjuntar evidencia)
   - **Features:** Start/Pause, Timer, Save execution

2. **ExecutionDetailsModal** (`frontend/src/features/test-execution/ui/ExecutionDetailsModal.tsx`)
   - **LOC:** ~350 líneas
   - **Modo:** Read-only (muestra ejecuciones pasadas)
   - **Features:** View-only, Report Bug per scenario

#### Código Duplicado Identificado:

**1. Scenario Grouping Logic (~30 líneas)**
```typescript
// DUPLICADO en ambos componentes
const scenarioGroups = useMemo(() => {
  const grouped: Record<string, StepExecutionResult[]> = {};
  results?.forEach(step => {
    const scenario = step.scenario || 'Default Scenario';
    if (!grouped[scenario]) grouped[scenario] = [];
    grouped[scenario].push(step);
  });
  return Object.entries(grouped).map(([scenarioName, steps]) => {
    const passedSteps = steps.filter(s => s.status === 'PASSED').length;
    const failedSteps = steps.filter(s => s.status === 'FAILED').length;
    // ... cálculo de status
    return { scenarioName, steps, passedSteps, failedSteps, status };
  });
}, [results]);
```

**2. Expand/Collapse Logic (~40 líneas)**
```typescript
// DUPLICADO en ambos componentes
const [expandedScenarios, setExpandedScenarios] = useState<Set<...>>(new Set());

const handleExpandCollapseAll = () => {
  if (expandedScenarios.size === scenarioGroups.length) {
    setExpandedScenarios(new Set()); // Collapse all
  } else {
    const allScenarioNames = scenarioGroups.map(s => s.scenarioName);
    setExpandedScenarios(new Set(allScenarioNames));
  }
};
```

**3. Scenario Rendering (~80 líneas por componente)**
```tsx
// DUPLICADO con ligeras variaciones
{scenarios.map((scenario, idx) => (
  <div className={`rounded-lg border ${
    scenario.status === 'passed' ? 'bg-gradient-to-br from-green-50...' :
    scenario.status === 'failed' ? 'bg-gradient-to-br from-red-50...' :
    'bg-white'
  }`}>
    <div className="p-4">
      <div className="flex items-center justify-between">
        {/* Scenario header con chevron */}
        {/* Status badge */}
      </div>
      {/* Action buttons (diferentes en cada componente) */}
    </div>
    {isExpanded && (
      <div className="border-t">
        {/* Steps rendering (diferentes en cada componente) */}
      </div>
    )}
  </div>
))}
```

---

### Solución Propuesta: ScenarioExecutionView

#### Arquitectura del Nuevo Componente

```
/frontend/src/features/test-execution/ui/
├── ScenarioExecutionView.tsx          ← NUEVO (componente compartido)
├── ScenarioCard.tsx                   ← NUEVO (sub-componente)
├── StepExecutionItem.tsx              ← NUEVO (sub-componente)
├── TestRunnerModal.tsx                ← REFACTORIZADO (usa ScenarioExecutionView)
└── ExecutionDetailsModal.tsx          ← REFACTORIZADO (usa ScenarioExecutionView)
```

#### Props del Componente Compartido

```typescript
// ScenarioExecutionView.tsx
interface ScenarioExecutionViewProps {
  // Data
  scenarios: ScenarioGroup[];
  evidenceMap?: Record<number, File>;

  // Mode
  mode: 'interactive' | 'readonly';  // Determina si se puede editar

  // Callbacks (opcionales según el modo)
  onStepStatusChange?: (scenarioIdx: number, stepId: number, status: 'passed' | 'failed') => void;
  onMarkAllSteps?: (scenarioIdx: number, status: 'passed' | 'failed') => void;
  onAddEvidence?: (stepId: number, file: File) => void;
  onRemoveEvidence?: (stepId: number) => void;
  onReportBug?: (scenario: ScenarioGroup) => void;

  // Styling
  className?: string;
  compact?: boolean;  // Modo compacto para espacios reducidos
}

interface ScenarioGroup {
  scenarioName: string;
  steps: StepResult[];
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
}

interface StepResult {
  id: number;
  keyword: string;
  text: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  scenario?: string;
  actual?: string;
  evidence?: string;
}
```

#### Uso en TestRunnerModal

```typescript
// ANTES: 200+ líneas de código
// DESPUÉS: 20 líneas

<ScenarioExecutionView
  scenarios={scenarios}
  evidenceMap={evidenceMap}
  mode="interactive"
  onStepStatusChange={(scenarioIdx, stepId, status) => markStep(scenarioIdx, stepId, status)}
  onMarkAllSteps={handleMarkAllStepsInScenario}
  onAddEvidence={addEvidence}
  onRemoveEvidence={removeEvidence}
  onReportBug={(scenario) => setSelectedScenarioForBug(scenario)}
/>
```

#### Uso en ExecutionDetailsModal

```typescript
// ANTES: 150+ líneas de código
// DESPUÉS: 15 líneas

<ScenarioExecutionView
  scenarios={scenarioGroups}
  mode="readonly"
  onReportBug={projectId ? (scenario) => setSelectedScenarioForBug(scenario) : undefined}
  compact={false}
/>
```

---

### Plan de Implementación

**Paso 1:** Crear `ScenarioExecutionView.tsx`
- Extraer lógica común de ambos componentes
- Implementar modo interactivo vs readonly
- Agregar prop drilling para callbacks

**Paso 2:** Crear sub-componentes
- `ScenarioCard.tsx` - Card de scenario con header y collapse
- `StepExecutionItem.tsx` - Item individual de step con status buttons

**Paso 3:** Refactorizar TestRunnerModal
- Reemplazar rendering de scenarios con `<ScenarioExecutionView>`
- Pasar callbacks necesarios
- Eliminar código duplicado (~150 LOC removidas)

**Paso 4:** Refactorizar ExecutionDetailsModal
- Reemplazar rendering de scenarios con `<ScenarioExecutionView>`
- Pasar callbacks necesarios
- Eliminar código duplicado (~120 LOC removidas)

**Paso 5:** Testing
- Verificar TestRunnerModal funciona igual
- Verificar ExecutionDetailsModal funciona igual
- Probar edge cases (scenarios sin steps, todos passed, etc.)

---

## 🔒 Tarea 2: Validación de Schema para step_results

### Problema Actual

**Backend acepta JSON libre sin validación:**
```python
# backend/database/models.py
class TestExecutionDB(Base):
    step_results = Column(Text, nullable=True)  # ❌ Sin validación
    # Puede contener:
    # - JSON inválido
    # - Campos faltantes (scenario, status, etc.)
    # - Tipos incorrectos (string en lugar de int)
```

**Consecuencias:**
1. **Crashes en reportes** - Si falta `scenario` field, el grouping falla
2. **Datos inconsistentes** - Algunos steps tienen `scenarioName`, otros `scenario`, otros nada
3. **Debug difícil** - Error se detecta solo cuando se genera el reporte

---

### ¿Por Qué es Importante la Validación?

**Sin Validación:**
```python
# Frontend envía esto (incorrecto):
step_results = [
    {
        "step_id": "uno",  # ❌ Debería ser int
        "text": "User logs in",
        # ❌ Falta "scenario"
        # ❌ Falta "status"
    }
]

# Backend lo acepta sin problema
db.add(TestExecutionDB(step_results=json.dumps(step_results)))  # ✅ Se guarda

# Reporte falla días después
grouped = group_by_scenario(step_results)  # ❌ KeyError: 'scenario'
```

**Con Validación:**
```python
# Frontend envía esto (incorrecto):
step_results = [...]

# Backend lo rechaza inmediatamente
validation_error = validate_step_results(step_results)
# ❌ 422 Unprocessable Entity
# {
#   "detail": [
#     {"loc": ["step_results", 0, "step_id"], "msg": "value is not a valid integer"},
#     {"loc": ["step_results", 0, "scenario"], "msg": "field required"}
#   ]
# }

# Frontend detecta el error de inmediato y lo corrige
```

---

### Beneficios de la Validación

| Beneficio | Sin Validación | Con Validación |
|-----------|----------------|----------------|
| **Detección de errores** | Días después (al generar reporte) | Inmediata (al guardar) |
| **Calidad de datos** | Inconsistente | Garantizada |
| **Debug time** | Horas (buscar en logs) | Minutos (error claro) |
| **Crashes en producción** | Frecuentes | Prevenidos |
| **Confianza en reportes** | Baja | Alta |

---

### Solución: Pydantic Models con Validación Estricta

#### Paso 1: Definir Schema Estricto

```python
# backend/models/test_execution.py
from pydantic import BaseModel, Field, validator
from typing import Literal, Optional, List
from backend.models.test_case import TestStatus

class StepResult(BaseModel):
    """Schema estricto para step_results"""
    step_id: int = Field(..., ge=1, description="Step ID (1-indexed)")
    scenario: str = Field(..., min_length=1, description="Scenario name (REQUIRED)")
    keyword: Literal["Given", "When", "Then", "And", "But"] = Field(..., description="Gherkin keyword")
    text: str = Field(..., min_length=1, description="Step text")
    status: TestStatus = Field(..., description="Step execution status")
    actual: Optional[str] = Field(None, description="Actual result (for failed steps)")
    expected: Optional[str] = Field(None, description="Expected result")
    evidence: Optional[str] = Field(None, description="Evidence file path")

    @validator('scenario')
    def scenario_not_empty(cls, v):
        if not v or v.strip() == "":
            raise ValueError("Scenario name cannot be empty")
        return v.strip()

    @validator('text')
    def text_not_empty(cls, v):
        if not v or v.strip() == "":
            raise ValueError("Step text cannot be empty")
        return v.strip()

    class Config:
        # Ejemplo de validación
        schema_extra = {
            "example": {
                "step_id": 1,
                "scenario": "User login with valid credentials",
                "keyword": "Given",
                "text": "the user is on the login page",
                "status": "PASSED",
                "actual": None,
                "expected": None,
                "evidence": None
            }
        }


class TestExecutionCreate(BaseModel):
    """Schema para crear una ejecución de test"""
    test_case_id: str
    executed_by: str
    execution_date: datetime
    status: TestStatus
    environment: str = "QA"
    version: Optional[str] = None
    execution_time_minutes: Optional[float] = None

    # ✅ Validación estricta de step_results
    step_results: List[StepResult] = Field(..., min_items=1)

    evidence_files: Optional[List[str]] = None
    notes: Optional[str] = None
    failure_reason: Optional[str] = None
    bug_ids: Optional[str] = None

    @validator('step_results')
    def validate_step_results(cls, v):
        if not v:
            raise ValueError("Must have at least one step result")

        # Verificar que todos los steps tengan scenario
        scenarios = {step.scenario for step in v}
        if not scenarios:
            raise ValueError("All steps must have a scenario name")

        # Verificar IDs únicos
        step_ids = [step.step_id for step in v]
        if len(step_ids) != len(set(step_ids)):
            raise ValueError("Step IDs must be unique")

        return v
```

#### Paso 2: Actualizar Endpoint de Creación

```python
# backend/api/endpoints/test_execution.py
from backend.models.test_execution import TestExecutionCreate, StepResult

@router.post("/test-executions")
async def create_test_execution(
    execution_data: TestExecutionCreate,  # ✅ Pydantic valida automáticamente
    db: Session = Depends(get_db)
):
    """Create test execution with validated step_results"""

    # Validación de proyecto (opcional pero recomendado)
    test_case = db.query(TestCaseDB).filter(TestCaseDB.id == execution_data.test_case_id).first()
    if not test_case:
        raise HTTPException(404, f"Test case {execution_data.test_case_id} not found")

    # Convertir step_results a JSON
    step_results_json = json.dumps([step.dict() for step in execution_data.step_results])

    # Calcular métricas
    total_steps = len(execution_data.step_results)
    passed_steps = sum(1 for step in execution_data.step_results if step.status == TestStatus.PASSED)
    failed_steps = sum(1 for step in execution_data.step_results if step.status == TestStatus.FAILED)

    # Crear ejecución
    new_execution = TestExecutionDB(
        test_case_id=execution_data.test_case_id,
        executed_by=execution_data.executed_by,
        execution_date=execution_data.execution_date,
        status=execution_data.status,
        environment=execution_data.environment,
        version=execution_data.version,
        execution_time_minutes=execution_data.execution_time_minutes,
        step_results=step_results_json,  # ✅ Garantizado válido
        total_steps=total_steps,
        passed_steps=passed_steps,
        failed_steps=failed_steps,
        evidence_files=json.dumps(execution_data.evidence_files) if execution_data.evidence_files else None,
        notes=execution_data.notes,
        failure_reason=execution_data.failure_reason,
        bug_ids=execution_data.bug_ids
    )

    db.add(new_execution)
    db.commit()
    db.refresh(new_execution)

    return {"message": "Test execution created", "id": new_execution.id}
```

#### Paso 3: Actualizar Frontend

```typescript
// frontend/src/features/test-execution/api/executionApi.ts
interface StepResult {
  step_id: number;  // ✅ int, no string
  scenario: string;  // ✅ required
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';  // ✅ literal type
  text: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED';
  actual?: string;
  expected?: string;
  evidence?: string;
}

interface CreateExecutionRequest {
  test_case_id: string;
  executed_by: string;
  execution_date: string;
  status: 'PASSED' | 'FAILED' | 'BLOCKED';
  step_results: StepResult[];  // ✅ Validado antes de enviar
  execution_time_minutes?: number;
  environment?: string;
  version?: string;
  notes?: string;
  failure_reason?: string;
}

export const createExecution = async (data: CreateExecutionRequest) => {
  // Frontend ya valida el schema antes de enviar
  if (!data.step_results || data.step_results.length === 0) {
    throw new Error("Must have at least one step result");
  }

  // Verificar que todos tengan scenario
  const missingScenario = data.step_results.find(s => !s.scenario || s.scenario.trim() === "");
  if (missingScenario) {
    throw new Error(`Step ${missingScenario.step_id} is missing scenario name`);
  }

  const response = await apiService.post<{ message: string; id: number }>(
    '/test-executions',
    data
  );
  return response.data;
};
```

---

### Plan de Implementación

**Paso 1:** Crear Pydantic models
- `StepResult` con validaciones
- `TestExecutionCreate` con validators

**Paso 2:** Actualizar endpoint
- Usar `TestExecutionCreate` en lugar de dict libre
- Agregar manejo de ValidationError

**Paso 3:** Actualizar frontend
- Añadir TypeScript interfaces estrictas
- Validar antes de enviar

**Paso 4:** Migrar datos existentes (opcional)
- Script para validar y limpiar step_results existentes
- Agregar `scenario: "Default Scenario"` donde falte

---

## ⚡ Tarea 3: Paginación en Reportes

### Problema Actual

**Reportes cargan TODO sin límite:**
```python
# backend/api/endpoints/reports.py
test_cases = db.query(TestCaseDB).filter(...).all()  # ❌ Puede ser 500+
executions = db.query(TestExecutionDB).filter(...).all()  # ❌ Puede ser 10,000+

# Genera documento Word con 10,000 rows
# Tiempo: 2-5 minutos ⏰
# Memoria: 500MB+ 💾
# Timeout: 30s → ❌ Error
```

---

### Solución: Query Parameters de Filtrado

```python
@router.get("/projects/{project_id}/reports/test-execution-summary")
async def generate_test_execution_report(
    project_id: str,
    date_from: Optional[str] = Query(None, description="ISO date: 2024-11-01"),
    date_to: Optional[str] = Query(None, description="ISO date: 2024-11-30"),
    limit: int = Query(100, ge=1, le=1000, description="Max executions to include"),
    test_case_ids: Optional[str] = Query(None, description="Comma-separated test case IDs"),
    db: Session = Depends(get_db)
):
    # Build query con filtros
    query = db.query(TestExecutionDB).filter(
        TestExecutionDB.test_case_id.in_(test_case_ids_list)
    )

    if date_from:
        query = query.filter(TestExecutionDB.execution_date >= parse_date(date_from))

    if date_to:
        query = query.filter(TestExecutionDB.execution_date <= parse_date(date_to))

    # Limitar resultados
    executions = query.order_by(
        TestExecutionDB.execution_date.desc()
    ).limit(limit).all()

    # Generar reporte (ahora rápido)
    # ...
```

**Beneficio:**
- Reporte de 100 executions: ~5 segundos ✅
- Reporte de 10,000 executions: ~2 minutos ❌
- Usuario elige el alcance que necesita

---

## 📈 Métricas de Éxito

| Métrica | Antes | Después | Meta |
|---------|-------|---------|------|
| LOC duplicadas | ~270 | ~50 | <100 |
| Crashes por datos inválidos | ~5/mes | 0 | 0 |
| Tiempo generación reporte (100 exec) | 30s | 5s | <10s |
| Tiempo generación reporte (1000 exec) | Timeout | 45s | <60s |

---

## 🚀 Orden de Implementación Recomendado

1. **Tarea 2 (Validación)** - 2-3 horas
   - Impacto inmediato en calidad de datos
   - No afecta UI existente
   - Previene futuros bugs

2. **Tarea 1 (Refactorización)** - 4-6 horas
   - Mejora mantenibilidad
   - Reduce deuda técnica
   - Facilita futuras features

3. **Tarea 3 (Paginación)** - 3-4 horas
   - Mejora performance
   - Permite proyectos grandes
   - Requiere cambios en frontend también

**Total estimado:** 9-13 horas de desarrollo

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Romper funcionalidad existente al refactorizar | Media | Alto | Testing exhaustivo antes de merge |
| Validación rechaza datos existentes | Alta | Medio | Script de migración de datos |
| Paginación confunde a usuarios | Baja | Bajo | Defaults razonables (últimos 30 días) |

---

**Próximo paso:** ¿Comenzamos con la Tarea 2 (Validación) que tiene el ROI más rápido?

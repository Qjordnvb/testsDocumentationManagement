# Análisis de Mejoras: Bugs por Scenario

## 📋 Cambios Solicitados

### 1. **Botón de Report Bug por Scenario** ✨
**Actual**: 1 bug por test case completo (todos los scenarios)
**Nuevo**: 1 bug por scenario individual

**Ventajas**:
- ✅ Mayor granularidad y precisión
- ✅ Mejor tracking (un scenario puede fallar, otros pasar)
- ✅ Evidencia específica del scenario problemático
- ✅ Facilita re-testing: solo ejecutas el scenario afectado

**Implicación**: Bugs ahora necesitan guardar `scenario_name`

---

### 2. **Background Color por Estado de Scenario** 🎨
**Estados visuales**:
- 🟢 Verde suave: `passed` (bg-green-50 border-green-200)
- 🔴 Rojo suave: `failed` (bg-red-50 border-red-200)
- ⚫ Gris: `skipped` (bg-gray-100 border-gray-300)
- 🔵 Azul/Blanco: `pending` (bg-white border-gray-200)

**Implicación**: Cambio visual en TestRunnerModal, fácil de implementar

---

### 3. **Mark All Steps (Passed/Failed)** ⚡
**Botones por scenario**:
- "✓ Mark All Passed" → Marca todos los steps como passed
- "✗ Mark All Failed" → Marca todos los steps como failed

**Ventajas**:
- ✅ Ahorra tiempo (5 clicks → 1 click)
- ✅ Útil para smoke tests o tests obvios

**Implicación**: Nueva función en `useTestRunner` hook

---

### 4. **Expand/Collapse All Scenarios** 🔽🔼
**Botón global**: "Expand All" / "Collapse All"

**Ventajas**:
- ✅ Vista general rápida
- ✅ Navegación más cómoda con muchos scenarios

**Implicación**: Toggle que actualiza `expandedScenarios` Set

---

### 5. **Bugs Agrupados por Test Case + Scenario** 📊
**Estructura jerárquica**:
```
TC-001: User Authentication
  ├─ Scenario: Valid user login (2 bugs)
  │   ├─ BUG-001: Wrong redirect URL
  │   └─ BUG-005: Session not saved
  ├─ Scenario: Invalid credentials (1 bug)
  │   └─ BUG-002: Error message missing
  └─ Scenario: Password reset (0 bugs)
```

**Opciones de implementación**:
- **Opción A**: Tree View con expand/collapse (más visual, complejo)
- **Opción B**: Grouped Cards anidadas (medio, recomendado)
- **Opción C**: Tabla flat + filtros (simple, rápido)

**Recomendación**: **Opción B** (Grouped Cards)
- Balance entre UX y complejidad
- Fácil de implementar con Tailwind
- Visualmente claro

---

### 6. **Evidencia por Scenario en Bug Details** 📸
**Actual**: Evidencia mezclada de todo el test case
**Nuevo**: Evidencia filtrada solo del scenario del bug

**Ventajas**:
- ✅ Contexto específico
- ✅ No mezcla screenshots de otros scenarios
- ✅ Bug más preciso

**Implicación**: Query execution para filtrar steps por `scenario_name`

---

## 🔧 Cambios Técnicos Requeridos

### Backend

#### 1. **Modelo de Base de Datos**
```python
# backend/database/models.py - BugReportDB
class BugReportDB(Base):
    # ... existing fields ...

    scenario_name = Column(String, nullable=True)  # NEW FIELD
    # Ejemplo: "Valid user login with correct credentials"
```

#### 2. **Migración**
```python
# backend/migrate_add_scenario_to_bugs.py (NUEVO)
def migrate():
    cursor.execute("ALTER TABLE bug_reports ADD COLUMN scenario_name TEXT")
```

#### 3. **Endpoints de Bugs**
```python
# POST /bugs - Recibir scenario_name
# GET /bugs - Retornar scenario_name
# GET /bugs/grouped?project_id=X - Nuevo endpoint para agrupar
```

**Nuevo endpoint**:
```python
@router.get("/bugs/grouped")
async def get_bugs_grouped(
    project_id: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Returns bugs grouped by test_case_id and scenario_name

    Response:
    {
      "test_cases": [
        {
          "test_case_id": "TC-001",
          "test_case_title": "User Authentication",
          "scenarios": [
            {
              "scenario_name": "Valid user login",
              "bugs": [
                { "id": "BUG-001", ... },
                { "id": "BUG-005", ... }
              ]
            }
          ]
        }
      ]
    }
    """
```

#### 4. **Evidencia por Scenario**
```python
# GET /test-executions/{exec_id}/scenario-evidence?scenario_name=X
# Retorna evidencia solo de steps del scenario específico
```

---

### Frontend

#### 1. **TestRunnerModal Enhancements**

**Nuevos estados**:
```typescript
const [expandAll, setExpandAll] = useState(false);
const [bugReportingScenario, setBugReportingScenario] = useState<string | null>(null);
```

**Nuevas funciones**:
```typescript
const handleExpandAll = () => {
  if (expandAll) {
    setExpandedScenarios(new Set());
  } else {
    const allIndexes = scenarios.map((_, idx) => idx);
    setExpandedScenarios(new Set(allIndexes));
  }
  setExpandAll(!expandAll);
};

const handleMarkAllPassed = (scenarioIdx: number) => {
  scenarios[scenarioIdx].steps.forEach(step => {
    markStep(scenarioIdx, step.id, 'passed');
  });
};

const handleMarkAllFailed = (scenarioIdx: number) => {
  scenarios[scenarioIdx].steps.forEach(step => {
    markStep(scenarioIdx, step.id, 'failed');
  });
};

const handleReportScenarioBug = (scenarioName: string) => {
  setBugReportingScenario(scenarioName);
  setShowBugModal(true);
};
```

**Background dinámico**:
```typescript
const getScenarioCardClass = (status: string) => {
  switch (status) {
    case 'passed':
      return 'bg-green-50 border-green-200 shadow-green-100';
    case 'failed':
      return 'bg-red-50 border-red-200 shadow-red-100';
    case 'skipped':
      return 'bg-gray-100 border-gray-300';
    default:
      return 'bg-white border-gray-200';
  }
};
```

**Nueva UI por scenario**:
```tsx
<div className={`card ${getScenarioCardClass(scenario.status)}`}>
  {/* Header con botones */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <ChevronDown />
      <h3>{scenario.scenarioName}</h3>
    </div>

    <div className="flex gap-2">
      {/* Mark All buttons */}
      <button onClick={() => handleMarkAllPassed(idx)}>
        ✓ All Passed
      </button>
      <button onClick={() => handleMarkAllFailed(idx)}>
        ✗ All Failed
      </button>

      {/* Report Bug for this scenario */}
      {scenario.status === 'failed' && (
        <button onClick={() => handleReportScenarioBug(scenario.scenarioName)}>
          <Bug size={16} /> Report Bug
        </button>
      )}
    </div>
  </div>

  {/* Steps (cuando expanded) */}
  {/* ... */}
</div>
```

**Botón Expand/Collapse All**:
```tsx
{/* En el header del modal, junto a los controles */}
<button onClick={handleExpandAll} className="btn-secondary">
  {expandAll ? (
    <><ChevronUp size={18} /> Collapse All</>
  ) : (
    <><ChevronDown size={18} /> Expand All</>
  )}
</button>
```

#### 2. **BugReportModal Changes**

**Nuevo prop**:
```typescript
interface Props {
  // ... existing props ...
  scenarioName?: string; // NEW
}
```

**Pre-fill con scenario específico**:
```typescript
useEffect(() => {
  if (executionDetails && scenarioName) {
    // Filter only steps from this scenario
    const scenarioSteps = executionDetails.step_results.filter(
      step => step.scenario_name === scenarioName && step.status === 'FAILED'
    );

    setStepsToReproduce(scenarioSteps.map(step => `${step.keyword} ${step.text}`));
    setTitle(`Bug in ${testCaseTitle} - Scenario: ${scenarioName}`);
  }
}, [executionDetails, scenarioName]);
```

**Enviar scenario_name al backend**:
```typescript
const bugData: CreateBugDTO = {
  // ... existing fields ...
  scenario_name: scenarioName, // NEW
};
```

#### 3. **BugsPage - Grouped View**

**Opción Recomendada: Grouped Cards**

```tsx
// Fetch grouped bugs
const [groupedBugs, setGroupedBugs] = useState<GroupedBugs[]>([]);

useEffect(() => {
  const fetchGrouped = async () => {
    const data = await bugApi.getGrouped(projectId);
    setGroupedBugs(data.test_cases);
  };
  fetchGrouped();
}, [projectId]);

// Render
return (
  <div className="space-y-6">
    {groupedBugs.map(testCase => (
      <div key={testCase.test_case_id} className="card">
        {/* Test Case Header */}
        <div className="border-b pb-3 mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <FileCheck size={20} className="text-blue-600" />
            {testCase.test_case_id}: {testCase.test_case_title}
          </h3>
          <p className="text-sm text-gray-500">
            {testCase.scenarios.reduce((sum, s) => sum + s.bugs.length, 0)} total bugs
          </p>
        </div>

        {/* Scenarios */}
        <div className="space-y-3">
          {testCase.scenarios.map(scenario => (
            <div key={scenario.scenario_name} className="border-l-4 border-blue-300 pl-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-700">
                  Scenario: {scenario.scenario_name}
                </h4>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {scenario.bugs.length} bug{scenario.bugs.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Bugs of this scenario */}
              <div className="space-y-2">
                {scenario.bugs.map(bug => (
                  <div key={bug.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm font-bold">{bug.id}</span>
                        <span className="ml-2">{bug.title}</span>
                      </div>
                      <BugSeverityBadge severity={bug.severity} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
```

#### 4. **BugDetailsPage - Scenario Evidence**

**Mostrar scenario**:
```tsx
<div className="card">
  <h2 className="text-2xl font-bold">{bug.id}: {bug.title}</h2>

  {bug.scenario_name && (
    <div className="mt-2 text-sm text-gray-600">
      <span className="font-semibold">Scenario:</span> {bug.scenario_name}
    </div>
  )}
</div>
```

**Filtrar evidencia del scenario**:
```typescript
const loadExecutionEvidence = async () => {
  const execDetails = await apiService.getExecutionDetails(executionId);

  // Filter only steps from the scenario
  const scenarioSteps = execDetails.step_results.filter(
    step => step.scenario_name === bug.scenario_name
  );

  const scenarioEvidence = scenarioSteps
    .filter(step => step.evidence_file)
    .map(step => step.evidence_file);

  setEvidence(scenarioEvidence);
};
```

---

## 📊 Comparación de Flujos

### Flujo Actual (Menos Preciso)
```
Test Case TC-001 falla
  └─ 3 scenarios ejecutados
     ├─ Scenario 1: Passed ✓
     ├─ Scenario 2: Failed ✗  ← Solo este falló
     └─ Scenario 3: Passed ✓

Bug Report:
  - Título: "Bug in TC-001"
  - Steps: Mezcla de todos los scenarios
  - Evidencia: Screenshots de todos los scenarios
  - ❌ No es claro cuál scenario falló
```

### Flujo Nuevo (Más Preciso) ✅
```
Test Case TC-001 ejecutado
  └─ 3 scenarios ejecutados
     ├─ Scenario 1: Passed ✓
     ├─ Scenario 2: Failed ✗
     │   └─ Click "Report Bug" en Scenario 2
     └─ Scenario 3: Passed ✓

Bug Report:
  - Título: "Bug in TC-001 - Scenario: User login with valid credentials"
  - Scenario: "User login with valid credentials"
  - Steps: Solo steps del Scenario 2
  - Evidencia: Solo screenshots del Scenario 2
  - ✅ Preciso y contextualizado
```

---

## 🎯 Beneficios del Cambio

### Para QA Testers:
1. ✅ **Menos clicks**: Mark all passed/failed
2. ✅ **Mejor navegación**: Expand/collapse all
3. ✅ **Bugs precisos**: 1 bug = 1 scenario problema
4. ✅ **Re-testing fácil**: Solo ejecuta el scenario afectado
5. ✅ **Evidencia clara**: Screenshots solo del scenario problemático

### Para Developers:
1. ✅ **Contexto específico**: Saben exactamente qué scenario falla
2. ✅ **Reproducción más fácil**: Steps específicos del scenario
3. ✅ **Fix más rápido**: No tienen que adivinar

### Para Managers:
1. ✅ **Métricas granulares**: Bugs por scenario
2. ✅ **Tracking preciso**: Qué scenarios son más problemáticos
3. ✅ **Reportes mejores**: Agrupación lógica

---

## 🚀 Plan de Implementación

### Fase 1: Backend (1-2 horas)
1. ✅ Migración: agregar `scenario_name` a bug_reports
2. ✅ Actualizar POST/GET /bugs con scenario_name
3. ✅ Crear endpoint GET /bugs/grouped
4. ✅ Endpoint para evidencia por scenario (opcional, puede usar existing)

### Fase 2: TestRunnerModal (2-3 horas)
1. ✅ Botón Expand/Collapse All
2. ✅ Botones Mark All Passed/Failed por scenario
3. ✅ Background dinámico por estado
4. ✅ Botón "Report Bug" por scenario
5. ✅ Pasar scenario_name al BugReportModal

### Fase 3: BugReportModal (30 min)
1. ✅ Recibir scenario_name prop
2. ✅ Filtrar steps del scenario específico
3. ✅ Enviar scenario_name al backend

### Fase 4: BugsPage Grouped View (2-3 horas)
1. ✅ Fetch grouped bugs
2. ✅ Render tree structure con cards anidadas
3. ✅ Styling y UX

### Fase 5: BugDetailsPage (1 hora)
1. ✅ Mostrar scenario_name
2. ✅ Filtrar evidencia del scenario

**Total estimado**: 6-9 horas de desarrollo

---

## ⚠️ Consideraciones

### Migración de Datos Existentes
Los bugs actuales no tienen `scenario_name`. Opciones:
1. Dejar NULL (aceptable, bugs viejos sin scenario)
2. Script para inferir scenario desde execution (complejo)

**Recomendación**: Dejar NULL, bugs nuevos tendrán scenario.

### Compatibilidad
- ¿Qué pasa si un bug no tiene scenario_name?
- Mostrar en grupo "Unspecified Scenario"
- No rompe funcionalidad existente

### Testing
- Probar con 1 scenario, 3 scenarios, 10 scenarios
- Probar mark all con evidencia adjunta
- Probar agrupación vacía (sin bugs)

---

## 🎨 Mockup Visual

### TestRunnerModal con Mejoras
```
┌─────────────────────────────────────────────────────────┐
│ TC-001: User Authentication                            │
│ ┌─────────────────────────────────────────────────┐   │
│ │ [Expand All ▼]  [00:45]  [▶ Start]  [💾 Save]  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─── Scenario 1: Valid login ──────────── PASSED ───┐ │ ← Verde
│ │ ▼  [✓ All Passed] [✗ All Failed]                  │ │
│ │                                                     │ │
│ │  1. Given user on login page          ✓           │ │
│ │  2. When enters valid credentials     ✓           │ │
│ │  3. Then redirected to dashboard      ✓           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─── Scenario 2: Invalid credentials ── FAILED ────┐ │ ← Rojo
│ │ ▼  [✓ All Passed] [✗ All Failed] [🐛 Report Bug] │ │
│ │                                                     │ │
│ │  1. Given user on login page          ✓           │ │
│ │  2. When enters invalid password      ✗  📎       │ │
│ │  3. Then see error message            ✗           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─── Scenario 3: Password reset ──────── PENDING ───┐ │ ← Blanco
│ │ ▶  [✓ All Passed] [✗ All Failed]                  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### BugsPage Grouped View
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Bugs - Grouped by Test Case & Scenario              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─ TC-001: User Authentication ──── 3 total bugs ────┐ │
│ │                                                      │ │
│ │  Scenario: Valid user login                2 bugs  │ │
│ │  ┌────────────────────────────────────────────────┐ │ │
│ │  │ BUG-001  Wrong redirect URL         Critical  │ │ │
│ │  │ BUG-005  Session not saved          High      │ │ │
│ │  └────────────────────────────────────────────────┘ │ │
│ │                                                      │ │
│ │  Scenario: Invalid credentials         1 bug      │ │
│ │  ┌────────────────────────────────────────────────┐ │ │
│ │  │ BUG-002  Error message missing      Medium    │ │ │
│ │  └────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ TC-005: Shopping Cart ──────── 1 total bug ───────┐ │
│ │                                                      │ │
│ │  Scenario: Add to cart                 1 bug      │ │
│ │  ┌────────────────────────────────────────────────┐ │ │
│ │  │ BUG-010  Price calculation wrong    Critical  │ │ │
│ │  └────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Conclusión

**Recomendación**: ✅ **Implementar todos los cambios**

Todos los cambios propuestos son excelentes y mejoran significativamente la UX y granularidad del sistema. El esfuerzo de 6-9 horas es razonable para el valor que aporta.

**Prioridad de implementación**:
1. **Alta**: Backend (scenario_name) + TestRunnerModal enhancements
2. **Media**: BugsPage grouped view
3. **Baja**: Evidencia filtrada por scenario (nice to have)

¿Quieres que empiece a implementar? Sugiero empezar por:
1. Migración backend (scenario_name)
2. TestRunnerModal (botones + backgrounds)
3. BugsPage grouped view

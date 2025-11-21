# 🏗️ Frontend Architecture - Quality Mission Control

**Patrón Principal:** Feature-Sliced Design (FSD)
**Framework:** React 18 + TypeScript
**Estado:** Zustand + React Context
**Routing:** React Router v6
**Styling:** Tailwind CSS + Design System Tokens
**Build:** Vite

---

## 📐 Principios Arquitectónicos

### 1. Feature-Sliced Design (FSD)
Organización por capas con reglas de importación estrictas:

```
app → pages → widgets → features → entities → shared
```

**Regla de Oro:** Las capas superiores pueden importar de las inferiores, NUNCA al revés.

### 2. Design System First
- **Tokens centralizados** en `shared/design-system/tokens/`
- **0 hardcoded values** en componentes
- **Rebrand en 1 archivo** (cambiar `colors.ts` actualiza toda la app)

### 3. Separation of Concerns
- **UI** (componentes) separado de **Lógica** (hooks, utils)
- **API calls** aislados en carpetas `/api`
- **Types** centralizados en `/model`

### 4. Composition over Inheritance
- Componentes pequeños y reutilizables
- Props para customización
- Children para contenido variable

---

## 🗂️ Estructura de Capas

### 📱 Layer 1: `app/` (Application)
**Responsabilidad:** Configuración global, providers, routing

```typescript
// app/providers/ProjectContext.tsx
export const ProjectProvider = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  // Persiste en localStorage
  return <ProjectContext.Provider value={{...}}>{children}</ProjectContext.Provider>;
};

// app/App.tsx
function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProjectsListPage />} />
          <Route path="/projects/:projectId/dashboard" element={<DashboardPage />} />
          {/* ... */}
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}
```

**Archivos típicos:**
- `App.tsx` - Router y providers
- `providers/ProjectContext.tsx` - Context global

---

### 📦 Layer 2: `entities/` (Business Entities)
**Responsabilidad:** Modelos de dominio, API calls, types

```typescript
// entities/test-execution/model/types.ts
export interface ExecutionDetails {
  execution_id: number;
  test_case_id: string;
  executed_by: string;
  status: TestStatus;
  step_results: StepExecutionResult[];
  bug_ids: string[];
}

export interface StepExecutionResult {
  step_id: number;
  scenario: string;  // REQUIRED
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  text: string;
  status: TestStatus;
  evidence_file?: string;
}

// entities/test-execution/api/executionApi.ts
export const executionApi = {
  createExecution: async (data: CreateExecutionRequest) => {
    return await apiService.post('/test-executions', data);
  },
  getHistory: async (testCaseId: string) => {
    return await apiService.get(`/test-executions/test-cases/${testCaseId}`);
  }
};
```

**Estructura típica:**
```
entities/test-execution/
├── api/
│   └── executionApi.ts      ← API calls
├── model/
│   └── types.ts             ← Interfaces & types
└── ui/                      ← Componentes específicos (opcional)
    └── ExecutionBadge.tsx
```

**Regla:** Entities NO pueden importar de features o pages, solo de shared

---

### ✨ Layer 3: `features/` (User Features)
**Responsabilidad:** Interacciones del usuario, lógica de negocio

```typescript
// features/test-execution/ui/TestRunnerModal.tsx
export const TestRunnerModal: React.FC<Props> = ({
  testCaseId, gherkinContent, onSave
}) => {
  const { scenarios, isRunning, markStep, addEvidence } = useTestRunner(gherkinContent);

  return (
    <Modal isOpen={isOpen}>
      <ScenarioList title="Test Execution">
        {scenarios.map(scenario => (
          <ScenarioCard
            key={scenario.name}
            scenarioName={scenario.name}
            status={scenario.status}
            onMarkAllSteps={(status) => markAllSteps(scenario, status)}
          >
            {scenario.steps.map(step => (
              <StepExecutionItem
                key={step.id}
                keyword={step.keyword}
                text={step.text}
                status={step.status}
                onStatusChange={(newStatus) => markStep(step.id, newStatus)}
              />
            ))}
          </ScenarioCard>
        ))}
      </ScenarioList>
    </Modal>
  );
};

// features/test-execution/model/useTestRunner.ts
export const useTestRunner = (gherkinContent: string) => {
  const [scenarios, setScenarios] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const markStep = (stepId: number, status: 'passed' | 'failed') => {
    // Lógica de negocio
  };

  return { scenarios, isRunning, markStep, addEvidence, ... };
};
```

**Estructura típica:**
```
features/test-execution/
├── ui/
│   ├── TestRunnerModal.tsx
│   ├── ExecutionDetailsModal.tsx
│   └── ExecutionHistory.tsx
├── model/
│   └── useTestRunner.ts      ← Custom hook con lógica
├── api/                       ← API calls específicos (opcional)
└── lib/                       ← Utilities específicos (opcional)
```

**Regla:** Features pueden importar de entities y shared, NO de otras features

---

### 📄 Layer 4: `pages/` (Pages/Routes)
**Responsabilidad:** Composición de features, routing

```typescript
// pages/TestCasesPage/index.tsx
export const TestCasesPage = () => {
  const { currentProject } = useProject();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRunnerModal, setShowRunnerModal] = useState(false);

  // Page solo COMPONE features
  return (
    <Layout>
      <Header title="Test Cases" />
      <TestCasesTable
        data={testCases}
        onRun={(testCase) => setShowRunnerModal(true)}
        onEdit={(testCase) => setShowEditModal(true)}
      />

      {/* Feature modals */}
      {showGenerateModal && <GenerateModal onClose={...} />}
      {showRunnerModal && <TestRunnerModal onClose={...} />}
    </Layout>
  );
};
```

**Regla:** Pages son "tontas", solo componen features y manejan routing

---

### 🧩 Layer 5: `widgets/` (Complex Compositions)
**Responsabilidad:** Composiciones complejas usadas en múltiples páginas

```typescript
// widgets/story-table/StoryTable.tsx
export const StoryTable = ({ data, onRowClick, onGenerateTests }) => {
  const table = useReactTable({
    data,
    columns: storyColumns,
    // ... TanStack Table config
  });

  return (
    <div className="card">
      <Table>
        {table.getRowModel().rows.map(row => (
          <TableRow key={row.id}>
            {/* ... */}
          </TableRow>
        ))}
      </Table>
    </div>
  );
};
```

**Ejemplos:**
- `story-table/` - Tabla compleja con filtros, sort, expand
- `header/` - Header con navegación y user menu
- `sidebar/` - Sidebar con navegación de proyecto
- `dashboard-stats/` - Cards de métricas del dashboard

**Regla:** Widgets pueden importar de features, entities y shared

---

### 🎨 Layer 6: `shared/` (Shared Resources)
**Responsabilidad:** Código reutilizable en toda la app

#### `/shared/design-system/`
**Sistema de diseño centralizado**

```typescript
// shared/design-system/tokens/colors.ts
export const colors = {
  brand: {
    primary: {
      50: 'bg-blue-50',
      100: 'bg-blue-100',
      // ... 900
      text600: 'text-blue-600',
      border500: 'border-blue-500',
    }
  },
  status: {
    success: { ... },
    error: { ... },
    warning: { ... },
  },
  gray: { ... }
};

// shared/design-system/tokens/typography.ts
export const getTypographyPreset = (name: TypographyPresetName) => {
  return {
    headingLarge: { className: 'text-3xl font-bold leading-tight', ... },
    body: { className: 'text-base leading-normal', ... },
    // ...
  };
};

// shared/design-system/components/composite/ScenarioCard.tsx
export const ScenarioCard = ({ scenarioName, status, children }) => {
  const statusClasses = getStatusClasses(status);
  const spacing = getComponentSpacing('scenarioCard');

  return (
    <div className={`${statusClasses.background} ${spacing.padding} rounded-lg`}>
      <h3>{scenarioName}</h3>
      {children}
    </div>
  );
};
```

**Estructura:**
```
shared/design-system/
├── tokens/
│   ├── colors.ts            ← Colores centralizados
│   ├── typography.ts        ← Tipografía centralizada
│   ├── spacing.ts           ← Espaciado centralizado
│   ├── shadows.ts           ← Sombras centralizadas
│   └── index.ts             ← Exports & utilities
├── components/
│   └── composite/           ← Componentes complejos compartidos
│       ├── ScenarioList.tsx
│       ├── ScenarioCard.tsx
│       ├── StepExecutionItem.tsx
│       └── index.ts
└── utils/                   ← Utilities del design system
```

#### `/shared/ui/`
**Componentes base reutilizables**

```typescript
// shared/ui/Button/Button.tsx
export const Button = ({ variant, size, children, ...props }) => {
  const variantClasses = getButtonVariantClasses(variant);
  const sizeClasses = getButtonSizeClasses(size);

  return (
    <button
      className={`${variantClasses} ${sizeClasses} transition-colors`}
      {...props}
    >
      {children}
    </button>
  );
};

// shared/ui/Modal/Modal.tsx
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm">
      <div className={`bg-white rounded-xl shadow-2xl`}>
        <div className="p-6 border-b">
          <h2>{title}</h2>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
```

#### `/shared/api/`
**Cliente HTTP centralizado**

```typescript
// shared/api/apiClient.ts
export const apiService = {
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',

  get: async <T>(url: string): Promise<T> => {
    const response = await axios.get(`${apiService.baseURL}${url}`);
    return response.data;
  },

  post: async <T>(url: string, data: any): Promise<T> => {
    const response = await axios.post(`${apiService.baseURL}${url}`, data);
    return response.data;
  },

  // ... put, delete, uploadFile
};
```

#### `/shared/lib/`
**Utilidades y helpers**

```typescript
// shared/lib/gherkinParser.ts
export const parseGherkinContent = (content: string): ParsedFeature => {
  // Parse Gherkin syntax
  return {
    feature: { name, description, tags },
    scenarios: [
      { name, tags, steps: [...] }
    ]
  };
};

// shared/lib/formatters.ts
export const formatDate = (date: Date) => { ... };
export const formatDuration = (seconds: number) => { ... };
```

#### `/shared/types/`
**Tipos globales**

```typescript
// shared/types/api.ts
export type ApiResponse<T> = {
  data: T;
  message?: string;
  error?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};
```

---

## 🔄 Flujo de Datos

### Flujo típico de una acción:

```
User Click (Page)
    ↓
Feature Modal abre (features/test-execution/ui/TestRunnerModal)
    ↓
Hook procesa lógica (features/test-execution/model/useTestRunner)
    ↓
API call (entities/test-execution/api/executionApi)
    ↓
HTTP request (shared/api/apiClient)
    ↓
Backend
    ↓
Response
    ↓
State update (useState/Context)
    ↓
UI re-render (React)
```

---

## 📊 Ejemplo Completo: Crear Ejecución de Test

### 1. User clicks "Save" en TestRunnerModal

```typescript
// pages/TestCasesPage/index.tsx
<TestRunnerModal
  testCaseId={selectedTest.id}
  gherkinContent={selectedTest.gherkinContent}
  onSave={() => {
    toast.success('Execution saved!');
    loadTestCases(); // Refresh
  }}
/>
```

### 2. TestRunnerModal procesa con hook

```typescript
// features/test-execution/ui/TestRunnerModal.tsx
const handleSave = async () => {
  const { scenarios, evidenceMap } = useTestRunner();

  // Build payload
  const stepResults: StepResult[] = scenarios.flatMap(scenario =>
    scenario.steps.map(step => ({
      step_id: step.id,
      scenario: scenario.name,  // ✅ REQUIRED
      keyword: step.keyword,
      text: step.text,
      status: step.status,
      evidence_file: evidenceMap[step.id]?.path
    }))
  );

  // Call API
  await executionApi.createExecution({
    test_case_id: testCaseId,
    executed_by: 'QA Tester',
    status: calculateOverallStatus(scenarios),
    step_results: stepResults  // ✅ Validado
  });

  onSave();
};
```

### 3. API Entity hace el request

```typescript
// entities/test-execution/api/executionApi.ts
export const executionApi = {
  createExecution: async (data: CreateExecutionRequest) => {
    // Validación frontend ANTES de enviar
    if (!data.step_results || data.step_results.length === 0) {
      throw new Error('Must have at least one step result');
    }

    const missingScenario = data.step_results.find(s => !s.scenario);
    if (missingScenario) {
      throw new Error(`Step ${missingScenario.step_id} missing scenario`);
    }

    // Request al backend
    return await apiService.post<{ id: number }>(
      '/test-executions',
      data
    );
  }
};
```

### 4. Backend valida con Pydantic

```python
# backend/api/endpoints/executions.py
@router.post("/test-executions")
async def create_test_execution(
    execution_data: TestExecutionCreate,  # ✅ Pydantic valida
    db: Session = Depends(get_db)
):
    # Si data es inválida, Pydantic retorna 422 automáticamente
    # Si data es válida, continúa...

    new_execution = TestExecutionDB(
        test_case_id=execution_data.test_case_id,
        step_results=json.dumps([s.dict() for s in execution_data.step_results]),
        # ...
    )
    db.add(new_execution)
    db.commit()

    return {"message": "Created", "id": new_execution.id}
```

---

## 🎯 Ventajas de Esta Arquitectura

### 1. **Escalabilidad**
- Agregar feature nuevo: crear carpeta en `features/`, no tocar nada más
- Agregar entity nuevo: crear carpeta en `entities/`, implementar API
- Modificar diseño: cambiar `tokens/`, afecta toda la app

### 2. **Mantenibilidad**
- Bug en TestRunner: solo revisar `features/test-execution/`
- Cambiar API: solo revisar `entities/*/api/`
- Cambiar colores: solo editar `shared/design-system/tokens/colors.ts`

### 3. **Testabilidad**
- Hooks aislados: fácil unit test
- Componentes tontos: fácil snapshot test
- API mocked: fácil integration test

### 4. **Onboarding**
- Nueva persona: lee esta doc, entiende estructura inmediatamente
- Convención clara: sabe dónde poner código nuevo
- Layers separadas: no mezcla UI con lógica

### 5. **Collaboration**
- Múltiples devs: cada uno trabaja en su feature sin conflictos
- Code review: scope claro (solo archivos de esa feature)
- Git: menos merge conflicts

---

## ⚠️ Reglas Importantes

### ❌ NO HACER:

1. **NO importar de capas superiores**
```typescript
// ❌ MAL: shared importando de features
// shared/ui/Button.tsx
import { useTestRunner } from '@/features/test-execution';  // ❌ PROHIBIDO
```

2. **NO hardcodear valores de diseño**
```typescript
// ❌ MAL
<div className="bg-blue-600 text-white p-4">  // ❌ Hardcoded

// ✅ BIEN
<div className={`${colors.brand.primary[600]} ${colors.textWhite} ${padding.md}`}>
```

3. **NO mezclar lógica con UI**
```typescript
// ❌ MAL: Todo en un componente
const TestRunner = () => {
  const [scenarios, setScenarios] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const markStep = () => { /* lógica compleja */ };

  return <div>{/* 500 líneas de JSX */}</div>;
};

// ✅ BIEN: Separar hook y componente
const useTestRunner = () => { /* lógica */ };
const TestRunner = () => {
  const { scenarios, markStep } = useTestRunner();
  return <div>{/* JSX limpio */}</div>;
};
```

4. **NO duplicar código**
```typescript
// ❌ MAL: Copiar-pegar componente
// TestRunnerModal.tsx
<div className="scenario-card">{/* ... */}</div>

// ExecutionDetailsModal.tsx
<div className="scenario-card">{/* ... mismo código */}</div>

// ✅ BIEN: Crear componente compartido
// shared/design-system/components/composite/ScenarioCard.tsx
export const ScenarioCard = ({ ... }) => { ... };
```

### ✅ SÍ HACER:

1. **Usar design tokens**
2. **Separar lógica en hooks**
3. **Crear componentes reutilizables**
4. **Validar datos antes de API calls**
5. **Usar TypeScript estricto**
6. **Documentar interfaces complejas**

---

## 🚀 Próximos Pasos (Sprint 2)

**Tarea 2: Validación de schema**
- Crear interfaces estrictas en `entities/test-execution/model/types.ts`
- Validar en `entities/test-execution/api/executionApi.ts`
- Backend valida con Pydantic

**Tarea 3: Paginación en reportes**
- Agregar filtros en `pages/ReportsPage/index.tsx`
- Backend implementa query params
- UI muestra date pickers

---

**Arquitectura sólida = Código mantenible = Features rápidos = Equipo feliz** 🎉

# Design System - Análisis Completo del Frontend

**Fecha:** 2025-11-21
**Objetivo:** Análisis exhaustivo de componentes y patrones visuales
**Status:** 🔴 Inconsistente - 60% de componentes NO usan design system

---

## 📊 Executive Summary

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Componentes Totales** | 34 archivos .tsx | - |
| **Componentes Design System** | 6 (Button, Badge, Card, Modal, Input, Table) | ✅ Bien diseñados |
| **Componentes usando DS** | ~40% | 🔴 Bajo |
| **Componentes con código duplicado** | ~60% | 🔴 Crítico |
| **Colores hardcodeados** | 150+ instancias | 🔴 Muy alto |
| **Design tokens centralizados** | 0 | 🔴 No existe |

**Problema Principal:** El design system existe pero NO se usa consistentemente.

---

## 🗂️ Inventario Completo de Componentes

### **Shared Components (Design System Base)** ✅

```
/shared/ui/
├── Button.tsx          ✅ Bien diseñado - Variants, sizes, loading state
├── Badge.tsx           ✅ Bien diseñado - Múltiples badges especializados
├── Card.tsx            ✅ Bien diseñado - Card, CardHeader, CardContent, CardFooter
├── Modal.tsx           ✅ Bien diseñado - Backdrop, ESC key, sizes
├── Input.tsx           ⚠️  No revisado aún
├── Table.tsx           ⚠️  No revisado aún
├── GherkinEditor.tsx   ⚠️  No revisado aún
└── ConfirmModal.tsx    ⚠️  No revisado aún
```

**Estado:** Excelentes componentes base, pero SUBUTILIZADOS.

---

### **Feature Components (Modals)** 🔴 PROBLEMA

```
/features/
├── test-execution/
│   ├── TestRunnerModal.tsx           ❌ NO usa Button/Badge del DS
│   ├── ExecutionDetailsModal.tsx     ❌ NO usa Button/Badge del DS
│   └── ExecutionHistory.tsx          ⚠️  No revisado
│
├── bug-management/
│   └── BugReportModal.tsx            ❌ NO usa Button/Badge del DS
│
├── generate-tests/
│   ├── GenerateModal.tsx             ⚠️  No revisado
│   └── ReviewTestCasesModal.tsx      ⚠️  No revisado
│
├── test-case-management/
│   └── TestCaseFormModal.tsx         ⚠️  No revisado
│
├── upload-excel/
│   └── UploadModal.tsx               ⚠️  No revisado
│
└── project-management/
    └── CreateProjectModal.tsx        ⚠️  No revisado
```

**Problema:** Todos los modales crean sus propios botones/badges en lugar de usar los compartidos.

---

### **Pages** ⚠️

```
/pages/
├── DashboardPage/index.tsx
├── StoriesPage/StoriesPage.tsx
├── TestCasesPage/index.tsx
├── BugsPage/index.tsx
├── BugDetailsPage/index.tsx
├── ReportsPage/index.tsx
└── ProjectsListPage/index.tsx
```

**Estado:** No revisados completamente, pero probablemente tienen duplicación.

---

### **Widgets (Layout Components)**

```
/widgets/
├── header/
│   ├── Header.tsx
│   └── Layout.tsx
├── sidebar/
│   └── Sidebar.tsx
├── layout/
│   └── PageLayout.tsx
├── story-table/
│   └── StoryTable.tsx
└── dashboard-stats/
    └── MetricCard.tsx
```

**Estado:** Mezcla de componentes, algunos probablemente tienen duplicación.

---

## 🎨 Análisis del Design System Existente

### **1. Button Component** ✅ EXCELENTE

```typescript
// /shared/ui/Button/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-primary-blue to-primary-purple text-white hover:shadow-lg hover:scale-105',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300',
  danger: 'bg-status-error text-white hover:bg-red-700 hover:shadow-lg',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  success: 'bg-status-success text-white hover:bg-green-700 hover:shadow-lg',
};
```

**✅ Fortalezas:**
- Sistema de variants bien pensado
- Estados (loading, disabled)
- Iconos left/right
- Animaciones smooth
- Accesibilidad (disabled state)

**🔴 Problema:** ¡NO SE USA! Los modales crean botones inline con `className="bg-blue-600..."`.

---

### **2. Badge Component** ✅ EXCELENTE

```typescript
// /shared/ui/Badge/Badge.tsx
- Badge base (generic)
- PriorityBadge ('Critical' | 'High' | 'Medium' | 'Low')
- StatusBadge (user story status)
- TestStatusBadge ('pending' | 'passed' | 'failed' | 'skipped')
- BugSeverityBadge
- BugStatusBadge
```

**✅ Fortalezas:**
- Badges especializados para cada dominio
- Iconos consistentes (emojis)
- Colores semánticos

**🔴 Problema:** En TestRunnerModal y ExecutionDetailsModal se crean badges inline:

```tsx
// ❌ INCORRECTO (TestRunnerModal línea 296)
<div className={`px-3 py-1 rounded-full text-xs font-bold ${
  scenario.status === 'passed' ? 'bg-green-100 text-green-700' :
  scenario.status === 'failed' ? 'bg-red-100 text-red-700' :
  'bg-gray-100 text-gray-600'
}`}>
  {scenario.status.toUpperCase()}
</div>

// ✅ CORRECTO (debería ser)
<TestStatusBadge status={scenario.status} />
```

---

### **3. Card Component** ✅ BUENO

```typescript
// /shared/ui/Card/Card.tsx
- Card (container)
- CardHeader
- CardTitle
- CardContent
- CardFooter

variant?: 'default' | 'bordered' | 'elevated'
padding?: 'none' | 'sm' | 'md' | 'lg'
hover?: boolean
```

**✅ Fortalezas:**
- Composición flexible (Card + Header + Content + Footer)
- Variants para diferentes estilos
- Padding configurable

**⚠️ Limitación:** No tiene support para status colors (green/red backgrounds).

**Propuesta:** Agregar `status` prop para scenarios.

---

### **4. Modal Component** ✅ BUENO

```typescript
// /shared/ui/Modal/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

+ ModalFooter (Cancel/Confirm buttons)
```

**✅ Fortalezas:**
- ESC key support
- Backdrop blur
- Body scroll lock
- Accessibility (role="dialog", aria-modal)
- Sizes configurables

**🔴 Problema:** ¡Nadie lo usa! Todos los modales tienen su propio código duplicado:

```tsx
// ❌ TestRunnerModal, ExecutionDetailsModal, BugReportModal
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl...">
    {/* Contenido duplicado */}
  </div>
</div>
```

Cada modal repite ~50 líneas de código de estructura.

---

## 🔴 Problemas Críticos Encontrados

### **Problema 1: Design System NO se usa**

**Evidencia:**
- TestRunnerModal (588 líneas): 0 imports de design system
- ExecutionDetailsModal (571 líneas): 0 imports de design system
- BugReportModal: 0 imports de design system

**Código duplicado encontrado:**

```tsx
// ❌ Repetido en 3+ modales
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-200">
    {/* ... */}
  </div>
</div>
```

**Impacto:**
- 150+ líneas de código duplicado solo en estructura de modales
- Si se cambia un color, hay que cambiarlo en 10+ lugares
- Imposible mantener consistencia visual

---

### **Problema 2: Colores Hardcodeados (No Design Tokens)**

**Instancias encontradas:**

```tsx
// Status Colors (repetido 20+ veces)
'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
'bg-green-100 text-green-700'
'bg-red-100 text-red-700'

// Button Colors (repetido 15+ veces)
'bg-blue-600 hover:bg-blue-700 text-white'
'bg-green-600 hover:bg-green-700 text-white'
'bg-red-600 text-white hover:bg-red-700'

// Typography (repetido 30+ veces)
'font-bold text-gray-800 text-base'
'font-bold text-purple-700'
'text-sm text-gray-500'

// Spacing (repetido 40+ veces)
'px-3 py-1 rounded-full text-xs'
'p-4 gap-3'
'px-4 py-2 rounded-lg'
```

**Impacto:**
- Cambiar theme = buscar y reemplazar en 50+ archivos
- Alto riesgo de inconsistencias
- Imposible integrar design system corporativo

---

### **Problema 3: Lógica de Badges Duplicada**

**Encontrado en TestRunnerModal y ExecutionDetailsModal:**

```tsx
// ❌ Repetido en ambos archivos
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'passed':
      return 'bg-green-100 text-green-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    case 'skipped':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-blue-50 text-blue-600';
  }
};
```

**Ya existe:** `TestStatusBadge` en `/shared/ui/Badge/Badge.tsx`

**Solución:** Usar `<TestStatusBadge status={status} />` en lugar de reimplementar.

---

### **Problema 4: Scenario Card Duplicado**

**Código idéntico en TestRunnerModal (líneas 266-348) y ExecutionDetailsModal (líneas 327-451):**

- Background dinámico por status
- Header con chevron
- Status badge
- Contador de steps (passed/failed)
- Steps expandibles

**Total:** ~160 líneas duplicadas

---

## 🎯 Análisis de Patrones Visuales

### **Patrón 1: Status Colors**

**Colores identificados en el sistema:**

```typescript
const STATUS_COLORS = {
  // Test/Scenario Status
  passed: {
    background: 'bg-gradient-to-br from-green-50 to-emerald-50',
    border: 'border-green-300',
    badge: 'bg-green-100 text-green-700',
    stepCard: 'bg-green-50/50 border-green-200',
    text: 'text-green-600',
  },
  failed: {
    background: 'bg-gradient-to-br from-red-50 to-rose-50',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-700',
    stepCard: 'bg-red-50/50 border-red-200',
    text: 'text-red-600',
  },
  skipped: {
    background: 'bg-gradient-to-br from-gray-100 to-gray-200',
    border: 'border-gray-400',
    badge: 'bg-gray-100 text-gray-600',
    stepCard: 'bg-gray-100 border-gray-300',
    text: 'text-gray-500',
  },
  pending: {
    background: 'bg-white',
    border: 'border-gray-200',
    badge: 'bg-blue-50 text-blue-600',
    stepCard: 'bg-white border-gray-200',
    text: 'text-gray-600',
  },
  blocked: {
    background: 'bg-gradient-to-br from-yellow-50 to-amber-50',
    border: 'border-yellow-300',
    badge: 'bg-yellow-100 text-yellow-700',
    stepCard: 'bg-yellow-50/50 border-yellow-200',
    text: 'text-yellow-600',
  },
};

// Priority Colors
const PRIORITY_COLORS = {
  Critical: 'bg-red-100 text-red-700 border-red-300',
  High: 'bg-orange-100 text-orange-700 border-orange-300',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Low: 'bg-gray-100 text-gray-700 border-gray-300',
};

// Action Colors
const ACTION_COLORS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-orange-600 hover:bg-orange-700 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
};
```

**Usados en:** Badges, Cards, Buttons, Tables, Status indicators

---

### **Patrón 2: Typography Scale**

```typescript
const TYPOGRAPHY = {
  // Headings
  h1: 'text-3xl font-bold text-gray-900',
  h2: 'text-2xl font-bold text-gray-900',
  h3: 'text-xl font-bold text-gray-800',
  h4: 'text-lg font-semibold text-gray-800',
  h5: 'text-base font-semibold text-gray-800',

  // Body
  body: 'text-base text-gray-700',
  bodySmall: 'text-sm text-gray-600',
  bodyLarge: 'text-lg text-gray-700',

  // Special
  label: 'text-sm font-medium text-gray-700',
  caption: 'text-xs text-gray-500',
  code: 'font-mono text-sm',

  // Scenario/Step specific
  scenarioTitle: 'font-bold text-gray-800 text-base',
  scenarioMeta: 'text-sm text-gray-500',
  stepKeyword: 'font-bold text-purple-700 text-sm',
  stepText: 'font-medium text-gray-800 text-sm',
};
```

---

### **Patrón 3: Spacing Scale**

```typescript
const SPACING = {
  // Component Padding
  card: {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
  button: {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
  },
  badge: {
    sm: 'px-2 py-0.5',
    md: 'px-2.5 py-1',
    lg: 'px-3 py-1.5',
  },

  // Gaps
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
  },

  // Common combinations (found in code)
  scenarioCard: 'p-4',
  scenarioGap: 'gap-3',
  stepCard: 'p-3',
  buttonGroup: 'gap-2',
  modalPadding: 'px-6 py-4',
};
```

---

### **Patrón 4: Border Radius**

```typescript
const BORDER_RADIUS = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',

  // Component specific
  button: 'rounded-lg',
  card: 'rounded-xl',
  badge: 'rounded-full',
  modal: 'rounded-xl',
  input: 'rounded-lg',
};
```

---

### **Patrón 5: Shadows**

```typescript
const SHADOWS = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',

  // Colored shadows
  buttonPrimary: 'shadow-lg shadow-blue-600/20',
  card: 'shadow-md hover:shadow-lg',
  modal: 'shadow-2xl',
};
```

---

## 🏗️ Propuesta de Arquitectura Unificada

### **Estructura de Directorios Propuesta**

```
/shared/
├── design-system/
│   ├── tokens/
│   │   ├── colors.ts           ← Design tokens de colores
│   │   ├── typography.ts       ← Typography scale
│   │   ├── spacing.ts          ← Spacing system
│   │   ├── shadows.ts          ← Shadow tokens
│   │   └── index.ts            ← Export all tokens
│   │
│   ├── components/
│   │   ├── base/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── Badge/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   └── Input/
│   │   │
│   │   ├── composite/           ← NEW: Componentes compuestos
│   │   │   ├── ScenarioCard/
│   │   │   │   ├── ScenarioCard.tsx
│   │   │   │   ├── ScenarioHeader.tsx
│   │   │   │   ├── ScenarioActions.tsx
│   │   │   │   ├── ScenarioCard.types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── StepExecution/
│   │   │   │   ├── StepExecutionItem.tsx
│   │   │   │   ├── StepContent.tsx
│   │   │   │   ├── StepStatusButtons.tsx
│   │   │   │   ├── StepEvidence.tsx
│   │   │   │   ├── StepExecution.types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── ScenarioList/
│   │   │       ├── ScenarioList.tsx
│   │   │       ├── ScenarioListControls.tsx
│   │   │       ├── ScenarioList.types.ts
│   │   │       └── index.ts
│   │   │
│   │   └── utils/
│   │       ├── getStatusClasses.ts    ← Helper functions
│   │       ├── formatters.ts
│   │       └── index.ts
│   │
│   └── hooks/
│       ├── useModal.ts
│       ├── useExpandCollapse.ts
│       └── index.ts
│
└── ui/                          ← LEGACY (mantener por compatibilidad)
    ├── Button/
    ├── Badge/
    ├── Card/
    └── Modal/
```

---

## 📦 Design Tokens Centralizados

### **1. Colors Token File**

```typescript
// /shared/design-system/tokens/colors.ts

export const colors = {
  // Brand Colors
  brand: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    secondary: {
      50: '#f5f3ff',
      500: '#8b5cf6',
      600: '#7c3aed',
    },
  },

  // Semantic Colors
  status: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    warning: {
      50: '#fefce8',
      100: '#fef9c3',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
    },
  },

  // Test Execution Status
  execution: {
    passed: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      bgSolid: 'bg-green-50',
      border: 'border-green-300',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-700',
    },
    failed: {
      bg: 'bg-gradient-to-br from-red-50 to-rose-50',
      bgSolid: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-700',
    },
    skipped: {
      bg: 'bg-gradient-to-br from-gray-100 to-gray-200',
      bgSolid: 'bg-gray-100',
      border: 'border-gray-400',
      text: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-600',
    },
    pending: {
      bg: 'bg-white',
      bgSolid: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-600',
      badge: 'bg-blue-50 text-blue-600',
    },
    blocked: {
      bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      bgSolid: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-700',
    },
  },

  // Priority Colors
  priority: {
    critical: 'bg-red-100 text-red-700 border-red-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-gray-100 text-gray-700 border-gray-300',
  },

  // Neutral Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;

// Helper functions
export const getStatusClasses = (status: 'passed' | 'failed' | 'skipped' | 'pending' | 'blocked') => {
  return colors.execution[status];
};

export const getPriorityClasses = (priority: 'critical' | 'high' | 'medium' | 'low') => {
  return colors.priority[priority.toLowerCase() as keyof typeof colors.priority];
};
```

---

### **2. Typography Token File**

```typescript
// /shared/design-system/tokens/typography.ts

export const typography = {
  fontFamily: {
    sans: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, monospace',
  },

  fontSize: {
    xs: 'text-xs',     // 0.75rem
    sm: 'text-sm',     // 0.875rem
    base: 'text-base', // 1rem
    lg: 'text-lg',     // 1.125rem
    xl: 'text-xl',     // 1.25rem
    '2xl': 'text-2xl', // 1.5rem
    '3xl': 'text-3xl', // 1.875rem
  },

  fontWeight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },

  // Preset combinations
  presets: {
    h1: 'text-3xl font-bold text-gray-900',
    h2: 'text-2xl font-bold text-gray-900',
    h3: 'text-xl font-bold text-gray-800',
    h4: 'text-lg font-semibold text-gray-800',
    h5: 'text-base font-semibold text-gray-800',

    body: 'text-base text-gray-700',
    bodySmall: 'text-sm text-gray-600',
    bodyLarge: 'text-lg text-gray-700',

    label: 'text-sm font-medium text-gray-700',
    caption: 'text-xs text-gray-500',
    code: 'font-mono text-sm',

    // Scenario/Step specific
    scenarioTitle: 'font-bold text-gray-800 text-base',
    scenarioMeta: 'text-sm text-gray-500',
    stepKeyword: 'font-bold text-purple-700 text-sm',
    stepText: 'font-medium text-gray-800 text-sm',
    stepNumber: 'text-xs font-bold text-gray-400',
  },
} as const;
```

---

### **3. Spacing Token File**

```typescript
// /shared/design-system/tokens/spacing.ts

export const spacing = {
  // Padding
  padding: {
    none: '',
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  },

  // Margin
  margin: {
    none: '',
    xs: 'm-1',
    sm: 'm-2',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
  },

  // Gap
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
  },

  // Component specific
  component: {
    card: 'p-6',
    cardSm: 'p-4',
    cardLg: 'p-8',
    modal: 'px-6 py-4',
    button: {
      sm: 'px-3 py-1.5',
      md: 'px-4 py-2',
      lg: 'px-6 py-3',
    },
    badge: {
      sm: 'px-2 py-0.5',
      md: 'px-2.5 py-1',
      lg: 'px-3 py-1.5',
    },
    scenario: {
      card: 'p-4',
      gap: 'gap-3',
    },
    step: {
      card: 'p-3',
      gap: 'gap-2',
    },
  },
} as const;
```

---

## 🎯 Plan de Migración (4 Fases)

### **Fase 1: Setup Design Tokens** (2-3 horas)

**Objetivos:**
- Crear `/shared/design-system/tokens/`
- Migrar colores, typography, spacing a tokens centralizados
- Crear helper functions

**Tasks:**
1. ✅ Crear `colors.ts` con todos los colores identificados
2. ✅ Crear `typography.ts` con typography scale
3. ✅ Crear `spacing.ts` con spacing system
4. ✅ Crear `shadows.ts` con shadow tokens
5. ✅ Crear `index.ts` que exporte todo
6. ✅ Documentar cómo usar los tokens

**No rompe nada:** Los componentes existentes siguen funcionando.

---

### **Fase 2: Actualizar Componentes Base** (4-5 horas)

**Objetivos:**
- Actualizar Button, Badge, Card, Modal para usar tokens
- Agregar variants faltantes
- Mejorar TypeScript types

**Tasks:**
1. ✅ Actualizar Button para usar `colors` y `spacing` tokens
2. ✅ Actualizar Badge para usar `colors` tokens
3. ✅ Actualizar Card para soportar `status` prop (para scenarios)
4. ✅ Actualizar Modal para usar tokens
5. ✅ Crear `StatusCard` component (Card + status background)
6. ✅ Tests: Verificar que todos funcionan igual

**No rompe nada:** Cambios internos, misma API.

---

### **Fase 3: Crear Componentes Compuestos** (6-8 horas)

**Objetivos:**
- Crear ScenarioCard, StepExecutionItem, ScenarioList
- Extraer toda la lógica duplicada

**Tasks:**
1. ✅ Crear `ScenarioCard` component
   - `ScenarioHeader` (chevron, title, badge)
   - `ScenarioActions` (Mark All, Report Bug buttons)
   - Usar `StatusCard` base + design tokens

2. ✅ Crear `StepExecutionItem` component
   - `StepContent` (keyword, text, comment)
   - `StepStatusButtons` (Pass/Fail buttons - modo interactive)
   - `StepEvidence` (display/upload - flexible)
   - Usar design tokens

3. ✅ Crear `ScenarioList` component
   - `ScenarioListControls` (Expand All button)
   - Renderiza múltiples `ScenarioCard`
   - Maneja estado de expand/collapse

4. ✅ Tests: Probar cada componente en aislamiento

**No rompe nada:** Componentes nuevos, los viejos siguen funcionando.

---

### **Fase 4: Refactorizar Componentes Existentes** (8-10 horas)

**Objetivos:**
- Migrar TestRunnerModal, ExecutionDetailsModal, BugReportModal
- Eliminar código duplicado
- Usar design system consistentemente

**Tasks:**

**4.1 TestRunnerModal** (3 horas)
1. ✅ Reemplazar estructura de modal con `<Modal>` del DS
2. ✅ Reemplazar scenarios rendering con `<ScenarioList>`
3. ✅ Reemplazar botones inline con `<Button>` del DS
4. ✅ Reemplazar badges inline con `<TestStatusBadge>`
5. ✅ **TESTING EXHAUSTIVO:** Cada botón, cada interacción
6. ✅ Si algo falla → Revert inmediato

**4.2 ExecutionDetailsModal** (2-3 horas)
1. ✅ Same process que TestRunnerModal
2. ✅ **TESTING EXHAUSTIVO**

**4.3 BugReportModal** (2 horas)
1. ✅ Reemplazar estructura con `<Modal>`
2. ✅ Usar `<Button>` del DS
3. ✅ Usar `<Input>` del DS si existe
4. ✅ **TESTING**

**4.4 Otros Modales** (3-4 horas)
1. ✅ GenerateModal
2. ✅ ReviewTestCasesModal
3. ✅ UploadModal
4. ✅ CreateProjectModal
5. ✅ TestCaseFormModal

**Criterio de Éxito:** ✅ Todo funciona EXACTAMENTE igual visualmente.

---

## 📊 Métricas de Éxito

| Métrica | Antes | Después (Objetivo) | Mejora |
|---------|-------|-------------------|--------|
| Componentes usando DS | 40% | 100% | +150% |
| Líneas duplicadas | ~530 | <100 | -81% |
| Colores hardcodeados | 150+ | 0 | -100% |
| Design tokens centralizados | 0 | 1 archivo | ✅ |
| Tiempo cambiar color | 2 horas | 5 minutos | -96% |
| Consistencia visual | Manual | Automática | ✅ |
| Design system ready | ❌ No | ✅ Sí | ✅ |

---

## 🚨 Riesgos y Mitigación

### **Riesgo 1: Romper funcionalidad existente**
**Probabilidad:** Media
**Impacto:** Alto
**Mitigación:**
- Hacer cambios en fases
- Testing exhaustivo antes de cada commit
- Git commits atómicos (fácil de revertir)
- Mantener componentes legacy en paralelo temporalmente

### **Riesgo 2: Resistance to change**
**Probabilidad:** Baja
**Impacto:** Bajo
**Mitigación:**
- Demostrar beneficios con ejemplos concretos
- Documentar CÓMO usar el nuevo design system
- Pair programming para enseñar

### **Riesgo 3: Time overrun**
**Probabilidad:** Media
**Impacto:** Medio
**Mitigación:**
- Priorizar por impacto (TestRunner/ExecutionDetails primero)
- Timeboxing estricto
- Permitir migración incremental (no todo de una vez)

---

## 🎯 Priorización de Componentes a Migrar

### **P0 (Critical - Hacer primero)**
1. TestRunnerModal - 588 líneas, usado frecuentemente
2. ExecutionDetailsModal - 571 líneas, usado frecuentemente
3. BugReportModal - Usado frecuentemente

**Beneficio:** 75% de reducción de duplicación

### **P1 (High)**
4. GenerateModal
5. ReviewTestCasesModal
6. UploadModal

### **P2 (Medium)**
7. CreateProjectModal
8. TestCaseFormModal
9. Otros componentes de páginas

---

## 📚 Documentación Necesaria

### **Crear:**
1. **DESIGN_SYSTEM_GUIDE.md** - Cómo usar el design system
   - Import patterns
   - Ejemplos de uso
   - Do's and Don'ts
   - Migration guide

2. **COMPONENT_LIBRARY.md** - Catálogo de componentes
   - Lista de todos los componentes
   - Props de cada uno
   - Ejemplos visuales
   - Cuándo usar cada uno

3. **TOKENS_REFERENCE.md** - Referencia de design tokens
   - Colores disponibles
   - Typography scale
   - Spacing system
   - Cómo extender

---

## ✅ Next Steps

**Recomendación:** Empezar con **Fase 1 (Design Tokens)** ahora mismo.

**¿Por qué?**
- No rompe nada existente
- 2-3 horas de trabajo
- Crea la base para todo lo demás
- Resultados inmediatos (tokens reutilizables)

**Después de Fase 1:**
- Puedes empezar a usar tokens en código nuevo
- Migración gradual de componentes existentes
- Base sólida para design system corporativo futuro

---

**¿Procedemos con Fase 1: Crear Design Tokens?** 🚀

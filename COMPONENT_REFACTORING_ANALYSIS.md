# Component Refactoring Analysis

**Date:** 2025-11-21
**Goal:** Extract shared components from TestRunnerModal and ExecutionDetailsModal
**Principle:** DRY + Design System Ready + Single Responsibility

---

## 📊 Code Duplication Analysis

### Summary

| Component | LOC | Duplicated Code | Unique Code | Duplication % |
|-----------|-----|-----------------|-------------|---------------|
| TestRunnerModal | 588 | ~280 | ~308 | 48% |
| ExecutionDetailsModal | 571 | ~250 | ~321 | 44% |
| **TOTAL** | **1159** | **~530** | **~629** | **46%** |

**Potential Savings:** ~530 lines can be extracted into reusable components

---

## 🔍 Line-by-Line Comparison

### 1. Expand/Collapse All Logic (IDENTICAL)

**TestRunnerModal (lines 50-68):**
```typescript
const handleExpandCollapseAll = () => {
  const allExpanded = expandedScenarios.size === scenarios.length;
  if (allExpanded) {
    // Collapse all
    scenarios.forEach((_, idx) => {
      if (expandedScenarios.has(idx)) {
        toggleScenario(idx);
      }
    });
  } else {
    // Expand all
    scenarios.forEach((_, idx) => {
      if (!expandedScenarios.has(idx)) {
        toggleScenario(idx);
      }
    });
  }
};
```

**ExecutionDetailsModal (lines 121-130):**
```typescript
const handleExpandCollapseAll = () => {
  if (expandedScenarios.size === scenarioGroups.length) {
    // Collapse all
    setExpandedScenarios(new Set());
  } else {
    // Expand all
    const allScenarioNames = scenarioGroups.map(s => s.scenarioName);
    setExpandedScenarios(new Set(allScenarioNames));
  }
};
```

**✅ Can Extract:** Yes - slight differences but same logic

---

### 2. Scenario Card Rendering (95% IDENTICAL)

**TestRunnerModal (lines 266-348):**
```tsx
<div
  key={scenarioIdx}
  className={`rounded-lg border shadow-sm overflow-hidden transition-all ${
    scenario.status === 'passed' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' :
    scenario.status === 'failed' ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300' :
    scenario.status === 'skipped' ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400' :
    'bg-white border-gray-200'
  }`}
>
  {/* Scenario Header */}
  <div className="p-4">
    <div className="flex items-center justify-between mb-3">
      <div
        onClick={() => toggleScenario(scenarioIdx)}
        className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80"
      >
        {isExpanded ? (
          <ChevronDown size={20} className="text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronRight size={20} className="text-gray-500 flex-shrink-0" />
        )}
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-base">{scenario.scenarioName}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {scenario.steps.length} steps •
            <span className="text-green-600 ml-1">{passedSteps} passed</span> •
            <span className="text-red-600 ml-1">{failedSteps} failed</span>
          </p>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
        scenario.status === 'passed' ? 'bg-green-100 text-green-700' :
        scenario.status === 'failed' ? 'bg-red-100 text-red-700' :
        scenario.status === 'skipped' ? 'bg-gray-100 text-gray-600' :
        'bg-blue-50 text-blue-600'
      }`}>
        {scenario.status.toUpperCase()}
      </div>
    </div>

    {/* Action Buttons Row - DIFFERENT BETWEEN COMPONENTS */}
    {/* TestRunner has: Mark All Passed/Failed buttons */}
    {/* ExecutionDetails has: Only Report Bug button */}
  </div>

  {/* Steps List - MOSTLY IDENTICAL */}
  {isExpanded && (
    <div className="border-t border-gray-100 bg-gray-50">
      {/* ... steps rendering ... */}
    </div>
  )}
</div>
```

**ExecutionDetailsModal (lines 327-451):**
```tsx
<div
  key={scenarioIdx}
  className={`rounded-lg border shadow-sm overflow-hidden transition-all ${
    scenario.status === 'passed' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' :
    scenario.status === 'failed' ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300' :
    scenario.status === 'skipped' ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400' :
    'bg-white border-gray-200'
  }`}
>
  {/* EXACTLY THE SAME STRUCTURE */}
</div>
```

**✅ Can Extract:** Yes - 95% identical, only action buttons differ

---

### 3. Step Rendering (80% IDENTICAL)

**TestRunnerModal (lines 354-436):**
```tsx
<div
  key={step.id}
  className={`flex flex-col p-3 rounded-lg border transition-all ${
    step.status === 'passed' ? 'bg-green-50/50 border-green-200' :
    step.status === 'failed' ? 'bg-red-50/50 border-red-200 shadow-sm' :
    step.status === 'skipped' ? 'bg-gray-100 border-gray-300' :
    'bg-white border-gray-200'
  }`}
>
  <div className="flex items-start gap-3">
    <div className="mt-1.5 text-xs font-bold text-gray-400 w-6 text-right">
      {stepIdx + 1}
    </div>
    <div className="flex-1 pt-1">
      <div className="flex gap-2 text-sm">
        <span className="font-bold text-purple-700">{step.keyword}</span>
        <span className={`font-medium ${
          step.status === 'skipped' ? 'text-gray-400 line-through' : 'text-gray-800'
        }`}>
          {step.text}
        </span>
      </div>
    </div>
    {/* DIFFERENT: TestRunner has Pass/Fail buttons */}
    {step.status !== 'skipped' && (
      <div className="flex gap-1">
        <button onClick={() => markStep(scenarioIdx, step.id, 'passed')}>
          <CheckCircle2 size={20} />
        </button>
        <button onClick={() => markStep(scenarioIdx, step.id, 'failed')}>
          <XCircle size={20} />
        </button>
      </div>
    )}
  </div>

  {/* DIFFERENT: Evidence handling */}
  {/* TestRunner: Upload evidence (interactive) */}
  {/* ExecutionDetails: Display evidence (readonly) */}
</div>
```

**ExecutionDetailsModal (lines 390-446):**
```tsx
<div
  key={stepIdx}
  className={`p-3 rounded-lg border transition-all ${getStepCardClass(step.status)}`}
>
  <div className="flex items-start gap-3">
    <div className="mt-1">{getStatusIcon(step.status)}</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-2">
        <span className="font-bold text-purple-700 text-sm">{step.keyword}</span>
        <span className={`text-sm ${
          step.status === 'SKIPPED' ? 'text-gray-400 line-through' : 'text-gray-800'
        }`}>
          {step.text}
        </span>
      </div>

      {/* DIFFERENT: Shows comment */}
      {step.comment && (
        <p className="text-xs text-gray-600 mt-2 pl-2 border-l-2 border-gray-300">
          💬 {step.comment}
        </p>
      )}

      {/* DIFFERENT: Shows evidence with preview */}
      {step.evidence_file && (
        <div className="mt-3 pl-2 border-l-2 border-blue-300">
          <img src={...} alt="Evidence" className="..." />
        </div>
      )}
    </div>
    <div className="text-xs text-gray-400 font-mono">
      #{stepIdx + 1}
    </div>
  </div>
</div>
```

**✅ Can Extract:** Yes - core structure identical, buttons/evidence are props

---

## 🎨 Design Tokens to Extract

These are currently hardcoded and should become CSS variables or props:

### Color Palette

```typescript
// Status Colors (repeated 20+ times)
const STATUS_COLORS = {
  passed: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    border: 'border-green-300',
    badge: 'bg-green-100 text-green-700',
    stepBg: 'bg-green-50/50 border-green-200'
  },
  failed: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-700',
    stepBg: 'bg-red-50/50 border-red-200'
  },
  skipped: {
    bg: 'bg-gradient-to-br from-gray-100 to-gray-200',
    border: 'border-gray-400',
    badge: 'bg-gray-100 text-gray-600',
    stepBg: 'bg-gray-100 border-gray-300'
  },
  pending: {
    bg: 'bg-white',
    border: 'border-gray-200',
    badge: 'bg-blue-50 text-blue-600',
    stepBg: 'bg-white border-gray-200'
  }
};
```

### Typography (repeated 15+ times)

```typescript
const TYPOGRAPHY = {
  scenarioTitle: 'font-bold text-gray-800 text-base',
  scenarioMeta: 'text-sm text-gray-500',
  stepKeyword: 'font-bold text-purple-700',
  stepText: 'font-medium text-gray-800',
  stepNumber: 'text-xs font-bold text-gray-400',
  badge: 'px-3 py-1 rounded-full text-xs font-bold'
};
```

### Spacing (repeated 25+ times)

```typescript
const SPACING = {
  scenarioCard: 'p-4',
  scenarioGap: 'gap-3',
  stepCard: 'p-3 space-y-3',
  buttonGroup: 'flex items-center gap-2',
  iconSize: 20,
  buttonIconSize: 14
};
```

---

## 🏗️ Proposed Component Architecture

### Directory Structure

```
/features/test-execution/ui/
├── shared/                                  ← NEW FOLDER
│   ├── types.ts                            ← Shared TypeScript interfaces
│   ├── constants.ts                        ← Design tokens (colors, spacing)
│   │
│   ├── ScenarioList/
│   │   ├── ScenarioList.tsx               ← Main container
│   │   ├── ScenarioListControls.tsx       ← Expand All button
│   │   ├── ScenarioList.types.ts
│   │   └── index.ts
│   │
│   ├── ScenarioCard/
│   │   ├── ScenarioCard.tsx               ← Scenario container
│   │   ├── ScenarioHeader.tsx             ← Header with chevron, title, badge
│   │   ├── ScenarioActions.tsx            ← Action buttons row (flexible)
│   │   ├── ScenarioCard.types.ts
│   │   └── index.ts
│   │
│   └── StepExecution/
│       ├── StepExecutionItem.tsx          ← Step container
│       ├── StepContent.tsx                ← Keyword + text + comment
│       ├── StepStatusButtons.tsx          ← Pass/Fail buttons (interactive mode)
│       ├── StepEvidence.tsx               ← Evidence display (flexible)
│       ├── StepExecution.types.ts
│       └── index.ts
│
├── TestRunnerModal.tsx                     ← REFACTORED (uses shared components)
└── ExecutionDetailsModal.tsx               ← REFACTORED (uses shared components)
```

---

## 📐 Component Interfaces (TypeScript)

### Shared Types

```typescript
// shared/types.ts
export type ScenarioStatus = 'passed' | 'failed' | 'skipped' | 'pending';
export type StepStatus = 'passed' | 'failed' | 'skipped' | 'pending' | 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED';
export type ComponentMode = 'interactive' | 'readonly';

export interface BaseScenario {
  scenarioName: string;
  status: ScenarioStatus;
  steps: BaseStep[];
}

export interface BaseStep {
  id: number;
  keyword: string;
  text: string;
  status: StepStatus;
  comment?: string;
  evidence_file?: string;
}

export interface ScenarioStats {
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  totalSteps: number;
}
```

---

### ScenarioList Component

```typescript
// shared/ScenarioList/ScenarioList.types.ts
import { BaseScenario, ComponentMode } from '../types';

export interface ScenarioListProps {
  // Data
  scenarios: BaseScenario[];
  expandedScenarios: Set<number> | Set<string>;

  // Mode
  mode: ComponentMode;

  // Event Handlers
  onToggleScenario: (scenarioIdentifier: number | string) => void;
  onExpandCollapseAll?: () => void;

  // Interactive Mode Callbacks (optional)
  onMarkAllSteps?: (scenarioIdx: number, status: 'passed' | 'failed') => void;
  onMarkStep?: (scenarioIdx: number, stepId: number, status: 'passed' | 'failed') => void;
  onAddEvidence?: (stepId: number, file: File) => void;
  onRemoveEvidence?: (stepId: number) => void;
  evidenceMap?: Record<number, File>;

  // Bug Reporting (optional)
  onReportBug?: (scenario: BaseScenario) => void;

  // Styling
  className?: string;
  showControls?: boolean;  // Show Expand All button
}
```

**Usage in TestRunnerModal:**
```tsx
<ScenarioList
  scenarios={scenarios}
  expandedScenarios={expandedScenarios}
  mode="interactive"
  onToggleScenario={(idx) => toggleScenario(idx as number)}
  onExpandCollapseAll={handleExpandCollapseAll}
  onMarkAllSteps={handleMarkAllStepsInScenario}
  onMarkStep={markStep}
  onAddEvidence={addEvidence}
  onRemoveEvidence={removeEvidence}
  evidenceMap={evidenceMap}
  onReportBug={(scenario) => setSelectedScenarioForBug({
    index: scenarios.indexOf(scenario),
    name: scenario.scenarioName,
    steps: scenario.steps
  })}
  showControls={true}
/>
```

**Usage in ExecutionDetailsModal:**
```tsx
<ScenarioList
  scenarios={scenarioGroups}
  expandedScenarios={expandedScenarios}
  mode="readonly"
  onToggleScenario={(name) => toggleScenario(name as string)}
  onExpandCollapseAll={handleExpandCollapseAll}
  onReportBug={projectId ? (scenario) => setSelectedScenarioForBug(scenario) : undefined}
  showControls={true}
/>
```

---

### ScenarioCard Component

```typescript
// shared/ScenarioCard/ScenarioCard.types.ts
import { BaseScenario, ComponentMode, ScenarioStats } from '../types';

export interface ScenarioCardProps {
  // Data
  scenario: BaseScenario;
  scenarioIdx: number;
  stats: ScenarioStats;
  isExpanded: boolean;

  // Mode
  mode: ComponentMode;

  // Event Handlers
  onToggle: () => void;
  onMarkAllSteps?: (scenarioIdx: number, status: 'passed' | 'failed') => void;
  onReportBug?: (scenario: BaseScenario) => void;

  // Children (for steps)
  children?: React.ReactNode;

  // Styling
  className?: string;
}
```

---

### StepExecutionItem Component

```typescript
// shared/StepExecution/StepExecution.types.ts
import { BaseStep, ComponentMode } from '../types';

export interface StepExecutionItemProps {
  // Data
  step: BaseStep;
  stepIdx: number;
  scenarioIdx: number;

  // Mode
  mode: ComponentMode;

  // Interactive Mode Callbacks (optional)
  onMarkStep?: (scenarioIdx: number, stepId: number, status: 'passed' | 'failed') => void;
  onAddEvidence?: (stepId: number, file: File) => void;
  onRemoveEvidence?: (stepId: number) => void;
  evidenceFile?: File;  // For interactive mode

  // Styling
  className?: string;
}
```

---

## 🎨 Design System Integration

### CSS Variables (Prepare for future design system)

```css
/* shared/styles/design-tokens.css */
:root {
  /* Scenario Status Colors */
  --scenario-passed-bg: linear-gradient(to bottom right, rgb(240 253 244), rgb(209 250 229));
  --scenario-passed-border: rgb(134 239 172);
  --scenario-passed-badge-bg: rgb(220 252 231);
  --scenario-passed-badge-text: rgb(21 128 61);

  --scenario-failed-bg: linear-gradient(to bottom right, rgb(254 242 242), rgb(255 228 230));
  --scenario-failed-border: rgb(252 165 165);
  --scenario-failed-badge-bg: rgb(254 226 226);
  --scenario-failed-badge-text: rgb(185 28 28);

  /* Typography */
  --font-scenario-title: 600 1rem/1.5rem sans-serif;
  --font-step-keyword: 700 0.875rem/1.25rem sans-serif;
  --font-step-text: 500 0.875rem/1.25rem sans-serif;

  /* Spacing */
  --spacing-scenario-card: 1rem;
  --spacing-step-card: 0.75rem;
  --spacing-gap-sm: 0.5rem;
  --spacing-gap-md: 0.75rem;
  --spacing-gap-lg: 1rem;

  /* Icons */
  --icon-size-sm: 14px;
  --icon-size-md: 16px;
  --icon-size-lg: 20px;
}

/* Dark mode support (future) */
@media (prefers-color-scheme: dark) {
  :root {
    --scenario-passed-bg: ...;
    /* ... dark mode colors */
  }
}
```

---

## ⚠️ Migration Strategy (Zero Downtime)

### Phase 1: Create Shared Components (No Breaking Changes)
1. Create `/features/test-execution/ui/shared/` folder
2. Create all new shared components
3. Keep existing TestRunnerModal and ExecutionDetailsModal unchanged
4. **Test new components in isolation** (Storybook if available)

### Phase 2: Refactor TestRunnerModal First
1. Import shared components
2. Replace scenario/step rendering with shared components
3. Keep all props and callbacks identical (no API changes)
4. **Test exhaustively** - every button, every interaction
5. If anything breaks → revert immediately

### Phase 3: Refactor ExecutionDetailsModal
1. Import shared components
2. Replace scenario/step rendering with shared components
3. Keep all props and callbacks identical
4. **Test exhaustively**
5. If anything breaks → revert immediately

### Phase 4: Cleanup
1. Remove duplicated code from original components
2. Update any tests that reference internal DOM structure
3. Document new component architecture

---

## ✅ Acceptance Criteria

Before merging refactored code, ALL must pass:

### Functional Requirements
- [ ] TestRunnerModal: All buttons work (Pass, Fail, Mark All, Report Bug)
- [ ] TestRunnerModal: Evidence upload works
- [ ] TestRunnerModal: Timer works
- [ ] TestRunnerModal: Save execution works
- [ ] ExecutionDetailsModal: All scenarios display correctly
- [ ] ExecutionDetailsModal: Evidence images display
- [ ] ExecutionDetailsModal: Report Bug button works
- [ ] Both: Expand/Collapse All works
- [ ] Both: Dynamic backgrounds by scenario status
- [ ] Both: Status badges show correct colors

### Visual Requirements
- [ ] No visual regression - looks exactly the same
- [ ] All colors match original
- [ ] All spacing matches original
- [ ] All hover states work
- [ ] All transitions work

### Code Quality
- [ ] TypeScript: No `any` types (except where necessary)
- [ ] TypeScript: All props typed correctly
- [ ] No console errors
- [ ] No console warnings
- [ ] Follows React best practices
- [ ] Components are truly reusable (work in both modals)

---

## 📊 Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total LOC | 1159 | ~700 | -40% |
| Duplicated Code | 530 lines | 0 lines | -100% |
| Components | 2 | 8 | +6 reusable |
| Maintainability | Low | High | ⭐⭐⭐⭐⭐ |
| Design System Ready | No | Yes | ⭐⭐⭐⭐⭐ |
| Visual Consistency | Manual | Automatic | ⭐⭐⭐⭐⭐ |

---

## 🚨 Risks and Mitigation

### Risk 1: Breaking Existing Functionality
**Probability:** Medium
**Impact:** High
**Mitigation:**
- Test EVERY interaction before committing
- Keep git commits small and atomic
- Can revert instantly if issues found
- Test in development first, not production

### Risk 2: TypeScript Type Errors
**Probability:** Low
**Impact:** Medium
**Mitigation:**
- Define interfaces first
- Use strict TypeScript (no `any`)
- Fix all type errors before testing

### Risk 3: Visual Regression
**Probability:** Low
**Impact:** Medium
**Mitigation:**
- Compare screenshots before/after
- Test on multiple screen sizes
- Test hover/focus states
- Check color contrast

---

**Next Step:** Create shared types and constants files, then start building atomic components.

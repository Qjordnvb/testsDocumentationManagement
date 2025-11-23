# Frontend Architecture - QA Documentation System

**Framework**: React 18 + TypeScript + Vite
**Architecture**: Feature-Sliced Design (FSD)
**Updated**: 2025-11-22

---

## 📋 Índice

1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura de Directorios](#estructura-de-directorios)
3. [Feature-Sliced Design](#feature-sliced-design)
4. [Sistema de Autenticación](#sistema-de-autenticación)
5. [State Management](#state-management)
6. [Routing](#routing)
7. [Componentes Clave](#componentes-clave)
8. [Convenciones](#convenciones)

---

## STACK TECNOLÓGICO

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool |
| React Router | 6.x | Navigation |
| Axios | latest | HTTP Client |
| TailwindCSS | 3.x | Styling |
| lucide-react | latest | Icons |
| react-hot-toast | latest | Notifications |

---

## ESTRUCTURA DE DIRECTORIOS

```
frontend/src/
├── app/                          # Application layer
│   ├── App.tsx                   # Main app + routing
│   ├── providers/                # Global providers
│   │   ├── AuthContext.tsx       # Authentication state
│   │   └── ProjectContext.tsx    # Project selection state
│   └── components/               # App-level components
│       └── ProtectedRoute.tsx    # Route protection + RBAC
│
├── features/                     # Business features
│   ├── authentication/           # ✨ Multi-step login
│   │   └── ui/
│   │       ├── LoginEmailStep.tsx
│   │       ├── RegisterStep.tsx
│   │       ├── LoginPasswordStep.tsx
│   │       └── AccessDeniedPage.tsx
│   ├── project-management/
│   │   └── ui/
│   │       └── CreateProjectModal.tsx
│   ├── test-generation/
│   │   └── ui/
│   │       ├── GenerateModal.tsx
│   │       └── ReviewTestCasesModal.tsx
│   └── bug-management/
│       └── ui/
│           ├── BugReportModal.tsx
│           └── EditBugModal.tsx
│
├── pages/                        # Page components
│   ├── LoginPage/                # ✨ Multi-step orchestrator
│   ├── UsersManagementPage/      # ✨ Admin only
│   ├── ProjectsListPage/         # Landing page
│   ├── DashboardPage/            # Project dashboard
│   ├── StoriesPage/              # User stories
│   ├── TestCasesPage/            # Test cases
│   ├── BugsPage/                 # Bug list
│   ├── BugDetailsPage/           # Bug details
│   └── ReportsPage/              # Test plans
│
├── widgets/                      # Complex UI blocks
│   ├── header/
│   │   ├── Header.tsx            # Top navigation
│   │   └── Layout.tsx            # Page layout wrapper
│   ├── sidebar/
│   │   └── Sidebar.tsx           # Left navigation (project context)
│   ├── dashboard-stats/
│   │   └── MetricCard.tsx        # Dashboard metrics
│   └── story-table/
│       ├── StoryTable.tsx        # User stories table
│       └── UserStoryCard.tsx     # Story card component
│
├── entities/                     # Business entities
│   ├── user/
│   │   ├── model/
│   │   │   └── types.ts          # ✨ User types + Auth DTOs
│   │   └── api/
│   │       ├── authApi.ts        # ✨ checkEmail, register, login
│   │       └── usersApi.ts       # ✨ createInvitation, CRUD
│   ├── project/
│   │   ├── model/
│   │   │   └── types.ts          # Project types
│   │   └── api/
│   │       └── projectApi.ts     # Project CRUD
│   └── user-story/
│       ├── model/
│       │   └── types.ts          # UserStory types
│       ├── api/
│       │   └── storyApi.ts       # Story CRUD
│       └── ui/
│           └── StoryCard.tsx     # Story UI component
│
└── shared/                       # Shared utilities
    ├── api/
    │   ├── apiClient.ts          # Axios instance
    │   └── index.ts              # API exports
    ├── types/
    │   └── api.ts                # Shared API types
    └── lib/
        └── useTestGenerationPolling.ts  # Background polling
```

---

## FEATURE-SLICED DESIGN

### Capas (Layers)

```
┌─────────────────────────────────────────────────┐
│ app/          Application bootstrap             │
│               - Providers (Auth, Project)       │
│               - Router                          │
│               - Global components               │
├─────────────────────────────────────────────────┤
│ pages/        Full-page components              │
│               - LoginPage, DashboardPage, etc   │
├─────────────────────────────────────────────────┤
│ widgets/      Complex UI blocks                 │
│               - Header, Sidebar, Tables         │
├─────────────────────────────────────────────────┤
│ features/     Business features                 │
│               - Authentication flow             │
│               - Test generation                 │
│               - Bug management                  │
├─────────────────────────────────────────────────┤
│ entities/     Business entities                 │
│               - User (model + API)              │
│               - Project (model + API)           │
│               - UserStory (model + API)         │
├─────────────────────────────────────────────────┤
│ shared/       Reusable utilities                │
│               - API client                      │
│               - Types                           │
│               - Custom hooks                    │
└─────────────────────────────────────────────────┘
```

### Reglas de Dependencia

```
app/       → puede importar de todas las capas
pages/     → puede importar de widgets, features, entities, shared
widgets/   → puede importar de features, entities, shared
features/  → puede importar de entities, shared
entities/  → puede importar solo de shared
shared/    → NO importa de ninguna otra capa
```

---

## SISTEMA DE AUTENTICACIÓN

### Flujo Multi-Step

**LoginPage** (`pages/LoginPage/index.tsx`):
- Orquestador del flujo multi-step
- Maneja transiciones entre steps
- State: `currentStep: 'email' | 'register' | 'password' | 'access-denied'`

**Steps**:
1. **LoginEmailStep** → User ingresa email
2. **Decision Tree**:
   - Email no existe → `AccessDeniedPage`
   - Email existe + no registrado → `RegisterStep`
   - Email existe + registrado → `LoginPasswordStep`

**Componentes**:
```typescript
// Step 1: Email
<LoginEmailStep
  onNext={(email) => handleEmailSubmit(email)}
  isLoading={isLoading}
  error={error}
/>

// Step 2a: Register (invited user)
<RegisterStep
  email={email}
  onRegister={(fullName, password) => handleRegister(fullName, password)}
  onBack={() => setCurrentStep('email')}
  isLoading={isLoading}
  error={error}
/>

// Step 2b: Login (registered user)
<LoginPasswordStep
  email={email}
  fullName={fullName}
  onLogin={(password) => handleLogin(password)}
  onBack={() => setCurrentStep('email')}
  isLoading={isLoading}
  error={error}
/>

// Step 2c: Access Denied
<AccessDeniedPage
  email={email}
  onBack={() => setCurrentStep('email')}
/>
```

### AuthContext

**Location**: `app/providers/AuthContext.tsx`

**State**:
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}
```

**Métodos**:
```typescript
// Login
await login({ email, password });
// → POST /auth/login
// → Save token + user to sessionStorage

// Register (invited user)
await register({ email, password, full_name });
// → POST /auth/register
// → Auto-login (save token)

// Logout
logout();
// → Clear sessionStorage
// → Navigate to /login
```

---

## STATE MANAGEMENT

### Context API (Global State)

**AuthContext** (Autenticación):
```typescript
const { user, token, isAuthenticated, login, register, logout, hasRole } = useAuth();
```

**ProjectContext** (Proyecto Actual):
```typescript
const { currentProject, setCurrentProject, isLoading } = useProject();
```

### Local State (React useState)

Cada componente maneja su propio estado:
```typescript
// Example: GenerateModal
const [numTestCases, setNumTestCases] = useState(5);
const [testTypes, setTestTypes] = useState(['FUNCTIONAL', 'UI']);
const [isGenerating, setIsGenerating] = useState(false);
```

### Server State (Sin caché)

Actualmente **NO hay caché de datos del servidor**.
- Cada vez que se accede a una página, se hace fetch
- Oportunidad de mejora: React Query / SWR

---

## ROUTING

### Estructura de Rutas

```typescript
<BrowserRouter>
  <AuthProvider>
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route path="/*" element={
        <ProtectedRoute>
          <ProjectProvider>
            <Layout>
              <Routes>
                {/* Landing */}
                <Route path="/" element={<ProjectsListPage />} />

                {/* Admin Only */}
                <Route path="/admin/users" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <UsersManagementPage />
                  </ProtectedRoute>
                } />

                {/* Project Routes */}
                <Route path="/projects/:projectId">
                  <Route index element={<Navigate to="dashboard" />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="stories" element={<StoriesPage />} />
                  <Route path="tests" element={<TestCasesPage />} />
                  <Route path="bugs" element={<BugsPage />} />
                  <Route path="bugs/:bugId" element={<BugDetailsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Routes>
            </Layout>
          </ProjectProvider>
        </ProtectedRoute>
      } />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

### ProtectedRoute Component

```typescript
export const ProtectedRoute = ({ children, requiredRoles }: Props) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  // 1. Check if loading
  if (isLoading) return <LoadingSpinner />;

  // 2. Check if authenticated
  if (!isAuthenticated) return <Navigate to="/login" />;

  // 3. Check role (if required)
  if (requiredRoles && !hasRole(...requiredRoles)) {
    return <AccessDeniedPage />;
  }

  // 4. Render children
  return <>{children}</>;
};
```

---

## COMPONENTES CLAVE

### Header + Sidebar (Layout)

**Header** (`widgets/header/Header.tsx`):
- Logo + Project name
- User menu (dropdown)
  - Profile
  - Admin → Usuarios (if role=admin)
  - Logout

**Sidebar** (`widgets/sidebar/Sidebar.tsx`):
- Project navigation (context-aware)
- Links:
  - Dashboard
  - User Stories
  - Test Cases
  - Bugs
  - Reports
  - Settings

**Layout** (`widgets/header/Layout.tsx`):
```typescript
<div className="min-h-screen bg-gray-50">
  <Header />
  <div className="flex">
    <Sidebar />
    <main className="flex-1 p-6">
      {children}
    </main>
  </div>
</div>
```

### Modals

**Pattern**: Controlled components con `onClose` + `onSubmit`

```typescript
interface ModalProps {
  onClose: () => void;
  onSubmit: (data: T) => Promise<void>;
}

// Usage
const [showModal, setShowModal] = useState(false);

<CreateProjectModal
  onClose={() => setShowModal(false)}
  onSubmit={async (data) => {
    await projectApi.create(data);
    setShowModal(false);
    loadProjects();
  }}
/>
```

### Tables

**Pattern**: Expandable rows con Acceptance Criteria

```typescript
// StoryTable expandable row
<tr>
  <td onClick={() => toggleRow(row.id)}>
    {isExpanded ? <ChevronDown /> : <ChevronRight />}
  </td>
  <td>{row.id}</td>
  <td>{row.title}</td>
  <td>
    <AcceptanceCriteriaProgress
      criteria={row.acceptance_criteria}
    />
  </td>
</tr>

{isExpanded && (
  <tr>
    <td colSpan={6}>
      <AcceptanceCriteriaList
        criteria={row.acceptance_criteria}
      />
    </td>
  </tr>
)}
```

---

## CONVENCIONES

### Naming

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Components | PascalCase | `LoginPage`, `StoryTable` |
| Files | PascalCase | `LoginPage.tsx`, `AuthContext.tsx` |
| Hooks | camelCase + use prefix | `useAuth`, `useProject` |
| API functions | camelCase | `projectApi.create()` |
| Types | PascalCase | `User`, `Project`, `LoginRequest` |
| Enums | PascalCase | `Role`, `TestType`, `Priority` |

### File Structure

```
ComponentName/
├── index.tsx           # Main component
├── types.ts            # Local types (if any)
└── styles.css          # Local styles (if any, rare with Tailwind)
```

### Props Types

```typescript
// Always define Props interface
interface ComponentNameProps {
  title: string;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;  // Optional props with ?
}

export const ComponentName = ({ title, onSubmit, isLoading = false }: ComponentNameProps) => {
  // ...
};
```

### API Calls

```typescript
// Always use try-catch
try {
  setLoading(true);
  const data = await api.call();
  // Success handling
  toast.success('Success message');
} catch (error: any) {
  const message = error.response?.data?.detail || 'Error genérico';
  toast.error(message);
} finally {
  setLoading(false);
}
```

### Styling

**TailwindCSS utility-first**:
```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Action
  </button>
</div>
```

---

## MEJORAS FUTURAS

### 1. State Management Avanzado
- React Query para server state + caching
- Zustand para complex global state

### 2. Testing
- Vitest para unit tests
- React Testing Library
- E2E con Playwright

### 3. Performance
- Code splitting con React.lazy
- Memoization (React.memo, useMemo)
- Virtual scrolling para tablas grandes

### 4. Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support

### 5. Error Boundaries
- React Error Boundaries para crashes
- Fallback UI

---

**Última Actualización**: 2025-11-22
**Versión**: 2.0

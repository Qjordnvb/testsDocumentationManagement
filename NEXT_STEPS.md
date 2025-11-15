# 🗺️ QA Flow - Plan de Implementación de Features Faltantes

**Fecha:** 2025-11-14
**Progreso Actual:** 80% Frontend, 100% Backend
**Objetivo:** Completar el 20% restante del MVP

---

## 📋 RESUMEN DE LO QUE FALTA

```
⏳ TestCasesPage      - Ver y ejecutar test cases con Gherkin viewer
⏳ BugReportsPage     - Gestionar bug reports con formularios
⏳ ReportsPage        - Exportar documentación (PDF, Excel, Gherkin)
⏳ Tests Unitarios    - Jest + React Testing Library
⏳ Autenticación      - Sistema de login (opcional)
```

---

## 🎯 PRIORIZACIÓN RECOMENDADA

Basándome en nuestro flujo actual de trabajo (FSD + TypeScript strict + Zustand), recomiendo este orden:

### **Fase 1: Completar Flujo Core (Alta Prioridad)** 📌
1. ✅ TestCasesPage (2-3 horas)
2. ✅ BugReportsPage (2-3 horas)

### **Fase 2: Exportación y Reportes (Media Prioridad)** 📊
3. ⏳ ReportsPage (3-4 horas)

### **Fase 3: Calidad y Testing (Media Prioridad)** 🧪
4. ⏳ Tests Unitarios (4-6 horas)

### **Fase 4: Features Opcionales (Baja Prioridad)** 🔐
5. ⏳ Autenticación (4-6 horas, opcional)

---

## 📝 DETALLE DE IMPLEMENTACIÓN

### 1️⃣ TestCasesPage - Ver y Ejecutar Test Cases

#### **Objetivo**
Página para visualizar todos los test cases generados, ver escenarios Gherkin, y marcar como Pass/Fail durante ejecución.

#### **Componentes a Crear**

**A. Page: TestCasesPage** (`pages/TestCasesPage/`)
```typescript
- TestCasesPage.tsx       // Página principal
- index.ts                // Public API
```

**Funcionalidad:**
- Tabla de test cases con TanStack Table
- Filtros por: user story, tipo de test, status
- Búsqueda global
- Click en row → abre modal con detalles

**B. Widget: TestCaseTable** (`widgets/test-case-table/`)
```typescript
- TestCaseTable.tsx       // Tabla interactiva
- index.ts
```

**Columnas:**
- ID
- Título
- Tipo (Functional, Integration, E2E, etc.)
- User Story (vínculo)
- Status (Pending, Passed, Failed, Skipped)
- Last Execution Date
- Actions (Ver detalles, Ejecutar)

**C. Widget: GherkinViewer** (`widgets/gherkin-viewer/`)
```typescript
- GherkinViewer.tsx       // Viewer con syntax highlighting
- index.ts
```

**Features:**
- Syntax highlighting para Gherkin
  - `Feature:` en azul
  - `Scenario:` en verde
  - `Given/When/Then` en amarillo
  - `And/But` en gris
  - Tags `@smoke` en purple
- Código copiable (botón "Copy")
- Scroll para scenarios largos

**D. Feature: execute-test** (`features/execute-test/`)
```typescript
- ui/ExecuteModal.tsx     // Modal para ejecutar test
- model/executeStore.ts   // Zustand store
- api/executeTest.ts      // API client
- lib/statusHelper.ts     // Helpers para status
```

**Flujo de Ejecución:**
1. Usuario click "Ejecutar Test"
2. Modal muestra Gherkin scenario
3. Usuario marca cada step como Pass/Fail
4. Al finalizar, actualiza status del test case
5. Guarda fecha de ejecución y notas

#### **API Backend (Ya existe)**
```bash
GET /api/v1/test-cases
GET /api/v1/test-cases/{test_id}
PUT /api/v1/test-cases/{test_id}  # Para actualizar status
POST /api/v1/test-cases/{test_id}/execute
```

#### **Stack Técnico**
- **Syntax Highlighting:** `react-syntax-highlighter` o custom CSS
- **Table:** TanStack Table (ya instalado)
- **Icons:** Lucide React (ya instalado)

#### **Estimación**
- ⏱️ **2-3 horas** de desarrollo
- 📦 Archivos nuevos: ~8-10
- 📏 Líneas de código: ~800-1000

---

### 2️⃣ BugReportsPage - Gestionar Bug Reports

#### **Objetivo**
Página para crear, ver y gestionar bug reports vinculados a user stories y test cases.

#### **Componentes a Crear**

**A. Page: BugReportsPage** (`pages/BugReportsPage/`)
```typescript
- BugReportsPage.tsx      // Página principal
- index.ts
```

**B. Widget: BugTable** (`widgets/bug-table/`)
```typescript
- BugTable.tsx            // Tabla de bugs
- index.ts
```

**Columnas:**
- ID
- Título
- Severidad (Critical, High, Medium, Low)
- Prioridad (Critical, High, Medium, Low)
- Status (Open, In Progress, Resolved, Closed)
- User Story (vínculo)
- Test Case (vínculo)
- Reported Date
- Actions

**C. Feature: create-bug** (`features/create-bug/`)
```typescript
- ui/BugModal.tsx         // Modal para crear/editar bug
- model/bugStore.ts       // Zustand store
- api/bugApi.ts           // API client
- lib/bugValidator.ts     // Validación de formulario
```

**Formulario de Bug:**
```
- Título (required)
- Descripción (required, textarea)
- Severity (select: Critical, High, Medium, Low)
- Priority (select: Critical, High, Medium, Low)
- Steps to Reproduce (textarea con bullets)
- Expected Behavior (textarea)
- Actual Behavior (textarea)
- User Story (select dropdown)
- Test Case (select dropdown, opcional)
- Environment (text input, ej: "Chrome 120, Windows 11")
- Screenshots (opcional, file upload)
```

**D. Widget: BugDetailModal** (`widgets/bug-detail/`)
```typescript
- BugDetailModal.tsx      // Modal para ver detalles completos
- index.ts
```

#### **API Backend (Ya existe)**
```bash
GET /api/v1/bug-reports
POST /api/v1/bug-reports
GET /api/v1/bug-reports/{bug_id}
PUT /api/v1/bug-reports/{bug_id}
DELETE /api/v1/bug-reports/{bug_id}
```

#### **Stack Técnico**
- **Forms:** React Hook Form + Zod validation (nuevo)
- **Selects:** HTML native select o headlessui/react
- **File Upload:** Similar a upload-excel feature

#### **Estimación**
- ⏱️ **2-3 horas** de desarrollo
- 📦 Archivos nuevos: ~10-12
- 📏 Líneas de código: ~900-1100
- 📚 Nuevas deps: `react-hook-form`, `zod`

---

### 3️⃣ ReportsPage - Exportar Documentación

#### **Objetivo**
Página para generar y descargar reportes en múltiples formatos (PDF, Excel, Gherkin files).

#### **Componentes a Crear**

**A. Page: ReportsPage** (`pages/ReportsPage/`)
```typescript
- ReportsPage.tsx         // Página principal
- index.ts
```

**Layout sugerido:**
```
┌──────────────────────────────────────────────┐
│  📊 Reportes y Exportación                   │
├──────────────────────────────────────────────┤
│                                              │
│  📄 Test Plan (PDF/Markdown)                 │
│  Generate comprehensive test plan            │
│  [📥 Generate PDF]  [📥 Generate Markdown]   │
│                                              │
│  📊 Test Execution Report (Excel)            │
│  Export test results with statistics         │
│  [📥 Download Excel]                         │
│                                              │
│  🥒 Gherkin Features (ZIP)                   │
│  Export all .feature files                   │
│  [📥 Download ZIP]                           │
│                                              │
│  📋 Bug Report (Word)                        │
│  Generate bug report template                │
│  [📥 Download DOCX]                          │
│                                              │
└──────────────────────────────────────────────┘
```

**B. Feature: export-reports** (`features/export-reports/`)
```typescript
- ui/ExportCard.tsx       // Card para cada tipo de export
- model/exportStore.ts    // Zustand store
- api/exportApi.ts        // API client
- lib/downloadHelper.ts   // Helper para descargas
```

**Tipos de Export:**
1. **Test Plan (PDF)** → `POST /api/v1/generate-test-plan?format=pdf`
2. **Test Plan (Markdown)** → `POST /api/v1/generate-test-plan?format=md`
3. **Execution Report (Excel)** → `GET /api/v1/export/test-results`
4. **Gherkin Files (ZIP)** → `GET /api/v1/export/gherkin-features`
5. **Bug Report Template (DOCX)** → `POST /api/v1/generate-bug-template`

**C. Widget: ExportProgress** (`widgets/export-progress/`)
```typescript
- ExportProgress.tsx      // Progress bar durante generación
- index.ts
```

#### **API Backend (Mayormente existe)**
```bash
POST /api/v1/generate-test-plan
GET /api/v1/export/test-results       # Crear nuevo endpoint
GET /api/v1/export/gherkin-features   # Crear nuevo endpoint
POST /api/v1/generate-bug-template    # Ya existe
```

#### **Stack Técnico**
- **File Downloads:** `file-saver` library o Axios blob response
- **Icons:** Lucide React

#### **Estimación**
- ⏱️ **3-4 horas** de desarrollo (incluye 2 nuevos endpoints backend)
- 📦 Archivos nuevos: ~6-8 (frontend) + 2 (backend)
- 📏 Líneas de código: ~600-800 (frontend) + ~200 (backend)
- 📚 Nuevas deps: `file-saver`

---

### 4️⃣ Tests Unitarios - Jest + React Testing Library

#### **Objetivo**
Agregar tests unitarios para componentes críticos y lógica de negocio.

#### **Setup Inicial**

**A. Instalar Dependencias**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**B. Configurar Vitest** (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@/app': path.resolve(__dirname, './src/app'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      // ... otros aliases
    },
  },
})
```

**C. Setup File** (`src/test/setup.ts`)
```typescript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
```

#### **Tests a Implementar (Prioridad)**

**Componentes UI (shared/ui/):**
```
✓ Button.test.tsx
  - Renders with different variants
  - Handles click events
  - Disabled state
  - Loading state

✓ Modal.test.tsx
  - Opens and closes
  - Calls onClose handler
  - Renders children

✓ Input.test.tsx
  - Handles onChange
  - Shows error state
  - Validation
```

**Features:**
```
✓ upload-excel/fileValidator.test.ts
  - Validates file extensions
  - Validates file size
  - Error messages

✓ generate-tests/testFormatter.test.ts
  - Formats Gherkin scenarios
  - Groups tests by type
  - Formats summaries
```

**Stores (Zustand):**
```
✓ features/upload-excel/uploadStore.test.ts
  - Sets upload state
  - Updates progress
  - Handles errors
```

**API Clients:**
```
✓ entities/user-story/api/storyApi.test.ts (mocked)
  - Fetches stories
  - Creates story
  - Handles errors
```

#### **Estructura de Archivos**
```
src/
├── shared/ui/Button/
│   ├── Button.tsx
│   ├── Button.test.tsx     ← Test junto al componente
│   └── index.ts
├── features/upload-excel/
│   ├── lib/
│   │   ├── fileValidator.ts
│   │   └── fileValidator.test.ts
```

#### **Scripts Package.json**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

#### **Estimación**
- ⏱️ **4-6 horas** para cobertura básica (~40-50%)
- 📦 Archivos test: ~15-20
- 📏 Líneas de código: ~1200-1500
- 🎯 Coverage objetivo: 50-60% (MVP)

---

### 5️⃣ Autenticación (Opcional)

#### **Objetivo**
Sistema de login para proteger la aplicación (opcional, solo si se requiere multi-usuario).

#### **Decisión Arquitectónica**

**Opción A: Sin Autenticación** (Recomendado para uso interno)
- ✅ Más rápido de implementar
- ✅ Menos complejidad
- ❌ No apto para múltiples usuarios

**Opción B: Autenticación Simple** (JWT)
- ✅ Estándar de la industria
- ✅ Stateless
- ❌ Requiere backend adicional

**Opción C: OAuth (Google/Microsoft)**
- ✅ No manejas contraseñas
- ✅ UX familiar
- ❌ Requiere configuración externa

#### **Implementación Recomendada: JWT Simple**

**A. Backend (FastAPI)**

**Nuevos archivos:**
```python
src/
├── auth/
│   ├── __init__.py
│   ├── jwt.py           # JWT encoding/decoding
│   ├── passwords.py     # Bcrypt hashing
│   └── models.py        # User model
```

**Endpoints:**
```python
POST /api/v1/auth/register    # Crear usuario
POST /api/v1/auth/login       # Login → JWT token
POST /api/v1/auth/refresh     # Refresh token
GET  /api/v1/auth/me          # Get current user
```

**Dependencies:**
```bash
pip install python-jose[cryptography] passlib[bcrypt]
```

**B. Frontend**

**Nuevos componentes:**
```typescript
pages/
├── LoginPage/
│   ├── LoginPage.tsx
│   └── index.ts

features/
├── auth/
│   ├── ui/LoginForm.tsx
│   ├── model/authStore.ts    # Zustand store con token
│   ├── api/authApi.ts
│   └── lib/tokenStorage.ts   # localStorage helpers
```

**Protected Routes:**
```typescript
// App.tsx
import { ProtectedRoute } from '@/features/auth'

<Route path="/stories" element={
  <ProtectedRoute>
    <StoriesPage />
  </ProtectedRoute>
} />
```

**Axios Interceptor:**
```typescript
// shared/lib/axios.ts
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

#### **Estimación**
- ⏱️ **4-6 horas** (backend + frontend)
- 📦 Archivos nuevos: ~12-15
- 📏 Líneas de código: ~1000-1300
- ⚠️ **Solo implementar si es necesario**

---

## 📊 RESUMEN DE ESTIMACIONES

| Feature | Prioridad | Tiempo | Complejidad | Nuevas Deps |
|---------|-----------|--------|-------------|-------------|
| TestCasesPage | Alta | 2-3h | Media | `react-syntax-highlighter` |
| BugReportsPage | Alta | 2-3h | Media | `react-hook-form`, `zod` |
| ReportsPage | Media | 3-4h | Media-Alta | `file-saver` |
| Tests Unitarios | Media | 4-6h | Baja-Media | `vitest`, `@testing-library/*` |
| Autenticación | Baja | 4-6h | Alta | `python-jose`, `passlib` |

**Total estimado (sin auth):** 11-16 horas
**Total estimado (con auth):** 15-22 horas

---

## 🎯 RECOMENDACIÓN DE WORKFLOW

### **Sprint 1: Core Features (Recomendado empezar aquí)** 🏃

**Día 1-2:**
1. Implementar TestCasesPage
   - Crear tabla con TanStack Table
   - Implementar GherkinViewer
   - Conectar con backend
   - Testing manual

2. Implementar BugReportsPage
   - Crear formulario con React Hook Form
   - Implementar tabla de bugs
   - Conectar con backend
   - Testing manual

**Entregable:** Flujo end-to-end completo desde Upload → Stories → Generate Tests → View Tests → Report Bugs

### **Sprint 2: Exportación y Calidad** 📊

**Día 3:**
3. Implementar ReportsPage
   - Crear UI de exportación
   - Agregar 2 endpoints faltantes en backend
   - Testing de descargas

**Día 4-5:**
4. Implementar Tests Unitarios
   - Setup Vitest
   - Tests de componentes críticos
   - Tests de utilities
   - Alcanzar 50% coverage

**Entregable:** Aplicación completa con exportación y tests

### **Sprint 3: Opcional** 🔐

**Día 6 (si es necesario):**
5. Implementar Autenticación
   - Backend: JWT + User model
   - Frontend: Login page + Protected routes
   - Testing de auth flow

---

## 🛠️ ARQUITECTURA CONSISTENTE (IMPORTANTE)

### **Seguir patrón FSD en todas las features:**

```
features/[feature-name]/
├── ui/               # Componentes React
├── model/            # Zustand stores
├── api/              # API clients (Axios)
├── lib/              # Utilities y helpers
└── index.ts          # Public API
```

### **Convenciones de código:**
- ✅ TypeScript strict mode
- ✅ Functional components con hooks
- ✅ Zustand para state management
- ✅ TanStack Table para tablas
- ✅ Lucide React para iconos
- ✅ Tailwind para estilos
- ✅ Axios para HTTP
- ✅ Path aliases (@/shared, @/features, etc.)

### **Nomenclatura:**
- **Componentes:** PascalCase (ej: `TestCaseTable.tsx`)
- **Stores:** camelCase + Store (ej: `executeStore.ts`)
- **API clients:** camelCase + Api (ej: `bugApi.ts`)
- **Utilities:** camelCase (ej: `statusHelper.ts`)

---

## 📚 DEPENDENCIAS NUEVAS A INSTALAR

### **Frontend**

**TestCasesPage:**
```bash
npm install react-syntax-highlighter
npm install -D @types/react-syntax-highlighter
```

**BugReportsPage:**
```bash
npm install react-hook-form zod @hookform/resolvers
```

**ReportsPage:**
```bash
npm install file-saver
npm install -D @types/file-saver
```

**Tests:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

**Autenticación (opcional):**
```bash
npm install jwt-decode
```

### **Backend (solo si faltan)**

**Autenticación (opcional):**
```bash
pip install python-jose[cryptography] passlib[bcrypt]
```

---

## 🚀 COMANDOS ÚTILES DURANTE DESARROLLO

### **Frontend**
```bash
# Dev server
npm run dev

# Build (verificar TypeScript)
npm run build

# Lint
npm run lint

# Tests (cuando se implementen)
npm run test
npm run test:ui
npm run test:coverage
```

### **Backend**
```bash
# Iniciar servidor
python3 -m src.main

# Ver logs
python3 -m src.main --reload

# Verificar endpoints
curl http://localhost:8000/docs
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### TestCasesPage
- [ ] Crear estructura de archivos (page, widget, feature)
- [ ] Implementar TestCaseTable con TanStack Table
- [ ] Implementar GherkinViewer con syntax highlighting
- [ ] Implementar ExecuteModal
- [ ] Conectar con API backend
- [ ] Testing manual del flujo completo
- [ ] Commit y push

### BugReportsPage
- [ ] Crear estructura de archivos
- [ ] Implementar BugModal con React Hook Form
- [ ] Implementar validación con Zod
- [ ] Implementar BugTable
- [ ] Conectar con API backend
- [ ] Testing manual del flujo completo
- [ ] Commit y push

### ReportsPage
- [ ] Crear estructura de archivos
- [ ] Implementar UI de exportación
- [ ] Crear 2 nuevos endpoints backend (export results, export gherkin)
- [ ] Implementar download helpers
- [ ] Testing de cada tipo de export
- [ ] Commit y push

### Tests Unitarios
- [ ] Instalar Vitest y testing libraries
- [ ] Configurar vitest.config.ts
- [ ] Crear setup.ts
- [ ] Tests para shared/ui components
- [ ] Tests para features utilities
- [ ] Tests para stores
- [ ] Alcanzar 50% coverage
- [ ] Configurar CI (opcional)
- [ ] Commit y push

### Autenticación (Opcional)
- [ ] Decisión: ¿Realmente se necesita?
- [ ] Implementar User model en backend
- [ ] Implementar JWT encoding/decoding
- [ ] Crear endpoints de auth
- [ ] Implementar LoginPage en frontend
- [ ] Implementar authStore
- [ ] Implementar ProtectedRoute
- [ ] Configurar Axios interceptor
- [ ] Testing del flujo de login
- [ ] Commit y push

---

## 🎉 CRITERIOS DE ACEPTACIÓN (MVP COMPLETO)

El MVP estará **100% completo** cuando:

✅ **Funcionalidad:**
- [x] Usuario puede subir Excel/CSV
- [x] Usuario ve user stories en tabla
- [x] Usuario genera test cases con IA
- [ ] Usuario ve test cases y ejecuta tests
- [ ] Usuario reporta bugs
- [ ] Usuario exporta documentación (PDF, Excel, Gherkin)

✅ **Calidad:**
- [x] Build TypeScript sin errores
- [x] Frontend responsive
- [ ] Tests unitarios > 50% coverage
- [ ] No hay bugs críticos conocidos

✅ **Documentación:**
- [x] README.md actualizado
- [x] PROJECT_STATUS.md actualizado
- [x] Código comentado (JSDoc)

---

## 📞 NOTAS FINALES

### **Filosofía de Desarrollo:**
- 🎯 **Priorizar funcionalidad sobre perfección** (es un MVP)
- 🏗️ **Mantener arquitectura consistente** (FSD)
- 📝 **Documentar decisiones importantes** (comentarios en código)
- 🧪 **Testing manual primero, unitarios después**
- 🚀 **Deploy early, deploy often** (commits frecuentes)

### **Cuándo pedir ayuda:**
- TypeScript errors que no entiendes
- Problemas de integración backend-frontend
- Decisiones arquitectónicas importantes
- Performance issues

### **Recursos:**
- **Swagger UI:** http://localhost:8000/docs (ver endpoints disponibles)
- **FSD Docs:** https://feature-sliced.design
- **TanStack Table:** https://tanstack.com/table
- **React Hook Form:** https://react-hook-form.com
- **Vitest:** https://vitest.dev

---

**Última Actualización:** 2025-11-14
**Autor:** Claude (Sonnet 4.5)
**Versión:** 1.0

---

**¿Listo para empezar? Recomendación: Comienza con TestCasesPage 🚀**

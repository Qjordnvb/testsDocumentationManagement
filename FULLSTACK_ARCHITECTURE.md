# 🏛️ Arquitectura Fullstack QA Flow
**Fecha:** 2025-11-14
**Objetivo:** Alineación completa de patrones frontend-backend para escalabilidad total

---

## 📊 1. ARQUITECTURA BACKEND ACTUAL (Python + FastAPI)

### **Patrón: Layered Architecture + Service Pattern**

```
src/
├── 📝 models/              # DOMAIN LAYER (Pydantic)
│   ├── user_story.py       # UserStory, AcceptanceCriteria, Priority, Status
│   ├── test_case.py        # TestCase, GherkinScenario, TestType
│   └── bug_report.py       # BugReport, BugSeverity, BugStatus
│
├── 🗄️ database/            # DATA ACCESS LAYER (SQLAlchemy)
│   ├── models.py           # UserStoryDB, TestCaseDB, BugReportDB
│   ├── db.py               # SessionLocal, engine, get_db()
│   └── __init__.py
│
├── 🌐 api/                 # PRESENTATION LAYER (FastAPI)
│   ├── routes.py           # REST endpoints (15+)
│   └── dependencies.py     # Dependency injection
│
├── ⚙️ parsers/             # SERVICE LAYER (Business Logic)
│   └── file_parser.py      # FileParser (Excel/CSV parsing)
│
├── 📄 generators/          # SERVICE LAYER (Business Logic)
│   ├── gherkin_generator.py
│   ├── test_plan_generator.py
│   └── bug_report_generator.py
│
├── 🔌 integrations/        # EXTERNAL SERVICES LAYER
│   └── gemini_client.py    # GeminiClient (AI)
│
└── ⚙️ config.py            # CONFIGURATION
    └── Settings (Pydantic)
```

### **Patrones Identificados en Backend:**

| Patrón | Ubicación | Propósito |
|--------|-----------|-----------|
| **Layered Architecture** | Global | Separación por responsabilidad |
| **Repository Pattern** | `database/` | Abstracción de acceso a datos |
| **Service Pattern** | `parsers/`, `generators/` | Lógica de negocio encapsulada |
| **Dependency Injection** | `api/dependencies.py` | Desacoplamiento |
| **DTO Pattern** | `models/` (Pydantic) | Validación y serialización |
| **Factory Pattern** | `generators/` | Creación de documentos |
| **Adapter Pattern** | `integrations/` | Integración con APIs externas |

### **Flujo de Datos en Backend:**

```
1. HTTP Request
   ↓
2. FastAPI Router (api/routes.py)
   ↓
3. Dependency Injection (get_db, get_gemini_client)
   ↓
4. Service Layer (parsers/, generators/)
   ↓
5. Domain Models (models/user_story.py)
   ↓
6. Data Access Layer (database/models.py)
   ↓
7. SQLite Database
   ↓
8. Response (Pydantic serialization)
```

---

## 🎨 2. ARQUITECTURA FRONTEND PROPUESTA (React + TypeScript)

### **Patrón: Feature-Slice Design (FSD) + Clean Architecture Principles**

```
frontend-react/src/
├── 📱 app/                         # APPLICATION LAYER (≈ config.py)
│   ├── providers/                  # Context providers, setup
│   ├── router/                     # React Router config
│   └── App.tsx                     # Root component
│
├── 📄 pages/                       # PRESENTATION LAYER (≈ api/routes.py)
│   ├── DashboardPage/              # Compone widgets + features
│   ├── StoriesPage/
│   └── TestsPage/
│
├── 🧩 widgets/                     # COMPOSITE UI LAYER
│   ├── dashboard-stats/            # Bloques complejos reutilizables
│   ├── sidebar/
│   └── header/
│
├── ⚙️ features/                    # SERVICE LAYER (≈ parsers/, generators/)
│   ├── upload-excel/               # Caso de uso: subir Excel
│   │   ├── ui/                     # UI del feature
│   │   ├── model/                  # Estado (Zustand)
│   │   ├── api/                    # Llamadas al backend
│   │   └── lib/                    # Helpers
│   ├── generate-tests/             # Caso de uso: generar tests
│   ├── story-filters/              # Caso de uso: filtrar stories
│   └── create-bug/                 # Caso de uso: crear bug
│
├── 🎨 entities/                    # DOMAIN LAYER (≈ models/)
│   ├── user-story/                 # Entidad UserStory
│   │   ├── model/                  # Types, store, validations
│   │   ├── ui/                     # StoryCard, StoryBadge
│   │   └── api/                    # CRUD operations
│   ├── test-case/
│   └── bug-report/
│
└── 🧱 shared/                      # INFRASTRUCTURE LAYER (≈ config, utils)
    ├── ui/                         # Design system (Button, Modal)
    ├── hooks/                      # Custom hooks
    ├── lib/                        # Utilities, formatters
    ├── api/                        # Axios client (≈ database/db.py)
    └── types/                      # TypeScript types (≈ models/)
```

---

## 🔗 3. MAPEO FRONTEND ↔ BACKEND

### **3.1 Capas Correspondientes**

| Backend (Python) | Frontend (TypeScript) | Responsabilidad |
|------------------|----------------------|-----------------|
| `models/user_story.py` | `entities/user-story/model/types.ts` | **Domain models** |
| `database/models.py` | N/A (backend-only) | Persistencia |
| `api/routes.py` | `shared/api/apiClient.ts` | **API communication** |
| `parsers/file_parser.py` | `features/upload-excel/` | **Business logic** |
| `generators/gherkin_generator.py` | `features/generate-tests/` | **Business logic** |
| `integrations/gemini_client.py` | `features/generate-tests/api/` | External services |
| `config.py` | `shared/config/constants.ts` | Configuración |

### **3.2 Flujo de Datos Fullstack**

```
FRONTEND                              BACKEND
────────────────────────────────────────────────────────────────

1. User clicks "Upload Excel"
   │
   ↓
2. features/upload-excel/ui/UploadModal.tsx
   │ (UI event)
   ↓
3. features/upload-excel/model/uploadStore.ts
   │ (State management)
   ↓
4. features/upload-excel/api/uploadFile.ts
   │ (API call preparation)
   ↓
5. shared/api/apiClient.ts (Axios)
   │ POST /api/v1/upload
   │
   ├──────────────────────────────────────→ 6. api/routes.py (FastAPI)
                                              │ @router.post("/upload")
                                              ↓
                                           7. parsers/file_parser.py
                                              │ FileParser.parse()
                                              ↓
                                           8. models/user_story.py
                                              │ UserStory (Pydantic validation)
                                              ↓
                                           9. database/models.py
                                              │ UserStoryDB (SQLAlchemy)
                                              ↓
                                           10. SQLite Database
                                              │ INSERT INTO user_stories
   ←──────────────────────────────────────┤
   │ Response: { user_stories: [...] }
   ↓
11. entities/user-story/model/storyStore.ts
   │ (Update state)
   ↓
12. pages/StoriesPage/index.tsx
   │ (Re-render with new data)
   ↓
13. User sees new stories in table
```

---

## 🎯 4. PATRONES COMPARTIDOS (Consistencia Fullstack)

### **4.1 Dependency Injection**

**Backend (Python):**
```python
# api/dependencies.py
def get_gemini_client() -> GeminiClient:
    return GeminiClient(api_key=settings.gemini_api_key)

# api/routes.py
@router.post("/generate-test-cases/{story_id}")
async def generate_test_cases(
    story_id: str,
    gemini: GeminiClient = Depends(get_gemini_client),  # ← Dependency Injection
):
    # ...
```

**Frontend (TypeScript):**
```typescript
// shared/api/apiClient.ts
export const apiClient = axios.create({
  baseURL: '/api/v1',
});

// features/generate-tests/api/generateTests.ts
import { apiClient } from '@/shared/api/apiClient';  // ← Dependency Injection

export const generateTests = async (storyId: string) => {
  return apiClient.post(`/generate-test-cases/${storyId}`);
};
```

### **4.2 Repository Pattern**

**Backend:**
```python
# database/models.py (Repository implícito)
class UserStoryDB(Base):
    __tablename__ = "user_stories"
    # ...

# Uso en routes:
story = db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
```

**Frontend (equivalente):**
```typescript
// entities/user-story/api/storyRepository.ts
export const storyRepository = {
  getAll: () => apiClient.get<UserStory[]>('/user-stories'),
  getById: (id: string) => apiClient.get<UserStory>(`/user-stories/${id}`),
  create: (story: CreateStoryDTO) => apiClient.post('/user-stories', story),
  update: (id: string, story: UpdateStoryDTO) => apiClient.put(`/user-stories/${id}`, story),
};
```

### **4.3 DTO Pattern (Data Transfer Objects)**

**Backend (Pydantic):**
```python
# models/user_story.py
class UserStory(BaseModel):
    id: str
    title: str
    description: str
    priority: Priority
    status: Status
    # ...
```

**Frontend (TypeScript - Mirror exacto):**
```typescript
// entities/user-story/model/types.ts
export interface UserStory {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  // ...
}
```

### **4.4 Service Pattern**

**Backend:**
```python
# generators/gherkin_generator.py
class GherkinGenerator:
    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.gemini_client = gemini_client

    def generate_from_user_story(self, user_story: UserStory, ...):
        # Business logic
```

**Frontend:**
```typescript
// features/generate-tests/lib/testGenerator.ts
export class TestGenerator {
  constructor(private apiClient: ApiClient) {}

  async generateFromStory(story: UserStory, options: GenerateOptions) {
    // Business logic (UI-side)
  }
}
```

---

## 🏗️ 5. ARQUITECTURA COMPLETA (Vista Integrada)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                             │
│  Browser (http://localhost:3000)                                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ HTTP
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TypeScript)                   │
├─────────────────────────────────────────────────────────────────────┤
│  📱 app/          → Application Layer (Config, Providers)           │
│  📄 pages/        → Presentation Layer (Routing, Composition)       │
│  🧩 widgets/      → Composite UI Layer (Complex blocks)             │
│  ⚙️ features/     → Service Layer (Use cases)                       │
│  🎨 entities/     → Domain Layer (Business entities)                │
│  🧱 shared/       → Infrastructure Layer (Utils, API client)        │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ REST API
                     (Proxy: /api → localhost:8000)
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Python + FastAPI)                      │
├─────────────────────────────────────────────────────────────────────┤
│  🌐 api/          → Presentation Layer (REST endpoints)             │
│  ⚙️ parsers/      → Service Layer (Business logic)                  │
│  📄 generators/   → Service Layer (Business logic)                  │
│  📝 models/       → Domain Layer (Pydantic models)                  │
│  🗄️ database/     → Data Access Layer (SQLAlchemy)                  │
│  🔌 integrations/ → External Services (Gemini AI)                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ SQL
┌─────────────────────────────────────────────────────────────────────┐
│                      SQLite Database                                │
│  user_stories | test_cases | bug_reports | test_executions         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✅ 6. VALIDACIÓN: ¿FSD es Compatible con Backend?

### **Respuesta: SÍ, perfectamente compatible**

| Criterio | Backend | Frontend | ¿Compatible? |
|----------|---------|----------|--------------|
| **Separation of Concerns** | ✅ Layered | ✅ FSD layers | ✅ SÍ |
| **Domain Models** | ✅ Pydantic | ✅ TypeScript types | ✅ SÍ (espejo) |
| **Service Pattern** | ✅ parsers/, generators/ | ✅ features/ | ✅ SÍ (equivalente) |
| **Repository Pattern** | ✅ database/ | ✅ entities/*/api/ | ✅ SÍ (equivalente) |
| **Dependency Injection** | ✅ FastAPI Depends | ✅ React Context/Props | ✅ SÍ |
| **API Contract** | ✅ Pydantic schemas | ✅ TypeScript interfaces | ✅ SÍ (mirror) |

### **Ventajas de FSD con este Backend:**

1. **Mapeo 1:1 con Domain Models**
   - `models/user_story.py` ↔ `entities/user-story/model/types.ts`
   - Mismos nombres, misma estructura

2. **Services alineados**
   - `parsers/file_parser.py` ↔ `features/upload-excel/`
   - `generators/gherkin_generator.py` ↔ `features/generate-tests/`

3. **API Client centralizado**
   - `shared/api/apiClient.ts` consume `api/routes.py`
   - Interceptors para errores (como middleware de FastAPI)

4. **Type Safety end-to-end**
   - Backend valida con Pydantic
   - Frontend valida con TypeScript
   - **Mismas interfaces** → sin bugs de integración

---

## 🎯 7. RECOMENDACIONES FINALES

### **7.1 Nomenclatura Consistente**

| Concepto | Backend | Frontend | Consistencia |
|----------|---------|----------|--------------|
| User Story | `UserStory` | `UserStory` | ✅ |
| Test Case | `TestCase` | `TestCase` | ✅ |
| Bug Report | `BugReport` | `BugReport` | ✅ |
| Priority | `Priority` enum | `Priority` type | ✅ |
| Status | `Status` enum | `Status` type | ✅ |

### **7.2 Shared Types (Opcional - Avanzado)**

**Opción:** Generar tipos TypeScript desde Pydantic automáticamente

```bash
# Usar herramienta como pydantic-to-typescript
pip install pydantic-to-typescript

# Generar types automáticamente
pydantic-to-typescript \
  --module src.models.user_story \
  --output frontend-react/src/entities/user-story/model/types.ts
```

**Ventaja:** Garantiza que frontend y backend SIEMPRE estén sincronizados.

### **7.3 Convenciones de Comunicación**

```typescript
// Todas las llamadas API van a través de entities
// features/ NO llaman directamente al backend

// ✅ CORRECTO:
// features/upload-excel/model/useUpload.ts
import { storyRepository } from '@/entities/user-story/api';

const uploadAndParse = async (file: File) => {
  const result = await uploadFile(file);  // ← Función en features/
  const stories = await storyRepository.getAll();  // ← Repository en entities/
  return stories;
};

// ❌ INCORRECTO:
// features/upload-excel/model/useUpload.ts
import { apiClient } from '@/shared/api';  // ❌ No llamar directamente
const stories = await apiClient.get('/user-stories');  // ❌
```

---

## 📝 8. CONCLUSIÓN

### **Arquitectura Fullstack: 9/10**

**✅ Fortalezas:**
- Backend con Layered Architecture sólida
- Frontend FSD alineado perfectamente
- Patrones consistentes (Service, Repository, DTO)
- Type safety end-to-end
- Separación clara de responsabilidades

**⚠️ Mejoras Sugeridas:**
1. Auto-generar tipos TypeScript desde Pydantic (elimina duplicación)
2. Shared error handling (códigos de error consistentes)
3. Logging correlacionado (request IDs entre frontend y backend)
4. API versioning explícito (`/api/v2/` cuando cambie)

**Veredicto Final:**
✅ **FSD es la arquitectura correcta para este frontend**
✅ **Se alinea perfectamente con el backend existente**
✅ **Garantiza escalabilidad total en ambos lados**

---

**Última Actualización:** 2025-11-14
**Autor:** Claude (Sonnet 4.5)

# PLAN MAESTRO DE IMPLEMENTACIÓN MULTI-PROYECTO
## Sistema QA Documentation Automation

**Objetivo**: Implementar arquitectura multi-proyecto donde TODAS las piezas encajen perfectamente.

---

## 📊 ESTADO ACTUAL

### ✅ Backend - Infraestructura de BD
```python
✓ ProjectDB - Tabla creada con relationships
✓ UserStoryDB.project_id - FK con index
✓ TestCaseDB.project_id - FK con index
✓ BugReportDB.project_id - FK con index
✓ TestExecutionDB - Hereda project_id de test_case
✓ Cascade delete configurado
```

### ✅ Backend - Endpoints de Proyectos
```python
✓ GET    /projects              # Lista con métricas calculadas
✓ GET    /projects/{id}         # Detalle con métricas
✓ POST   /projects              # Crear (auto-genera ID)
✓ PUT    /projects/{id}         # Actualizar
✓ DELETE /projects/{id}         # Eliminar con cascade
✓ GET    /projects/{id}/stats   # Estadísticas específicas
```

### ❌ Backend - Endpoints que FALTAN actualizar
```python
❌ POST /upload                        # NO tiene project_id
❌ GET  /user-stories                  # NO filtra por project_id
❌ GET  /test-cases                    # NO filtra por project_id
❌ POST /generate-test-cases/{id}      # NO valida project_id
❌ POST /generate-test-cases/{id}/preview  # NO valida project_id
❌ POST /test-cases/batch              # NO valida project_id
❌ POST /generate-test-plan            # Usa project_name string
❌ POST /create-bug-report             # NO hereda project_id
```

### ✅ Frontend - Componentes de Features
```typescript
✓ StoriesPage - Tabla de user stories
✓ TestCasesPage - CRUD completo de test cases
✓ GenerateModal - Configuración (1-10 tests, tipos)
✓ ReviewTestCasesModal - Review de sugerencias IA
✓ GherkinEditor - Editor de .feature files
✓ TestCaseFormModal - Creación manual
```

### ❌ Frontend - Componentes que FALTAN
```typescript
❌ Project Entity (types, api)
❌ ProjectsListPage (landing)
❌ CreateProjectModal
❌ EditProjectModal
❌ ProjectDashboard (métricas del proyecto)
❌ ProjectContext Provider
❌ Routing con :projectId
❌ Actualizar TODOS los API calls
❌ Eliminar polling de stats
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### FASE 1: Backend - Actualizar Endpoints (CRÍTICO)
**Duración**: ~2 horas
**Objetivo**: Todos los endpoints requieren/validan project_id

#### 1.1 - POST /upload (PRIORIDAD 1)
```python
# Ubicación: backend/api/routes.py línea ~254

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    project_id: str = Query(..., description="Project ID"),  # ← ADD
    db: Session = Depends(get_db)
):
    # VALIDAR que proyecto existe
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(404, f"Project {project_id} not found")

    # ... parse file ...

    # AGREGAR project_id al crear user stories
    for user_story in result.user_stories:
        existing_story = db.query(UserStoryDB).filter(
            UserStoryDB.id == user_story.id,
            UserStoryDB.project_id == project_id  # ← ADD para UPSERT correcto
        ).first()

        if existing_story:
            # Update
            existing_story.title = user_story.title
            # ... otros campos ...
        else:
            # Insert con project_id
            new_story = UserStoryDB(
                **user_story.dict(),
                project_id=project_id  # ← ADD
            )
            db.add(new_story)
```

**Testing**:
```bash
curl -X POST "http://localhost:8000/api/v1/upload?project_id=PROJ-001" \
  -F "file=@test.xlsx"
# Verificar: user stories creadas con project_id
```

---

#### 1.2 - GET /user-stories (PRIORIDAD 1)
```python
# Ubicación: backend/api/routes.py línea ~175

@router.get("/user-stories")
async def get_user_stories(
    project_id: str = Query(..., description="Filter by project"),  # ← ADD
    db: Session = Depends(get_db)
):
    # FILTRAR por project_id
    stories = db.query(UserStoryDB).filter(
        UserStoryDB.project_id == project_id  # ← ADD
    ).all()

    # ... resto del código igual ...
```

**Testing**:
```bash
curl "http://localhost:8000/api/v1/user-stories?project_id=PROJ-001"
# Verificar: solo stories del PROJ-001
```

---

#### 1.3 - GET /test-cases (PRIORIDAD 1)
```python
# Ubicación: backend/api/routes.py línea ~310

@router.get("/test-cases")
async def get_test_cases(
    project_id: str = Query(..., description="Filter by project"),  # ← ADD
    db: Session = Depends(get_db)
):
    # FILTRAR por project_id
    test_cases = db.query(TestCaseDB).filter(
        TestCaseDB.project_id == project_id  # ← ADD
    ).all()

    # ... resto del código igual ...
```

**Testing**:
```bash
curl "http://localhost:8000/api/v1/test-cases?project_id=PROJ-001"
# Verificar: solo test cases del PROJ-001
```

---

#### 1.4 - POST /generate-test-cases/{story_id} (PRIORIDAD 2)
```python
# Ubicación: backend/api/routes.py línea ~220

@router.post("/generate-test-cases/{story_id}")
async def generate_test_cases(
    story_id: str,
    use_ai: bool = True,
    num_scenarios: int = 3,
    db: Session = Depends(get_db),
    gemini_client: GeminiClient = Depends(get_gemini_client)
):
    # OBTENER user story
    user_story = db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
    if not user_story:
        raise HTTPException(404, f"User story {story_id} not found")

    # ... generar test cases ...

    # HEREDAR project_id de user story
    for test_case in test_cases:
        test_case_db = TestCaseDB(
            id=test_case.id,
            project_id=user_story.project_id,  # ← ADD (heredar)
            user_story_id=story_id,
            title=test_case.title,
            # ... resto de campos ...
        )
        db.add(test_case_db)
```

**Testing**:
```bash
curl -X POST "http://localhost:8000/api/v1/generate-test-cases/US-001?use_ai=true"
# Verificar: test cases creados con project_id de US-001
```

---

#### 1.5 - POST /generate-test-cases/{story_id}/preview (PRIORIDAD 2)
```python
# Ubicación: backend/api/routes.py línea ~375

@router.post("/generate-test-cases/{story_id}/preview")
async def preview_test_cases(
    story_id: str,
    num_test_cases: int = Query(default=5, ge=1, le=10),
    scenarios_per_test: int = Query(default=3, ge=1, le=10),
    test_types: List[str] = Query(default=["FUNCTIONAL", "UI"]),
    use_ai: bool = True,
    db: Session = Depends(get_db),
    gemini_client: GeminiClient = Depends(get_gemini_client)
):
    # VALIDAR que user story existe y obtener project_id
    user_story = db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
    if not user_story:
        raise HTTPException(404, f"User story {story_id} not found")

    # INCLUIR project_id en response (para validación frontend)
    return {
        "project_id": user_story.project_id,  # ← ADD
        "user_story_id": story_id,
        "user_story_title": user_story.title,
        "suggested_test_cases": [...],
        # ... resto de campos ...
    }
```

**Testing**:
```bash
curl -X POST "http://localhost:8000/api/v1/generate-test-cases/US-001/preview"
# Verificar: response incluye project_id
```

---

#### 1.6 - POST /test-cases/batch (PRIORIDAD 2)
```python
# Ubicación: backend/api/routes.py línea ~540

@router.post("/test-cases/batch")
async def create_test_cases_batch(
    test_cases_data: dict,
    db: Session = Depends(get_db)
):
    user_story_id = test_cases_data.get("user_story_id")

    # OBTENER user story para heredar project_id
    user_story = db.query(UserStoryDB).filter(
        UserStoryDB.id == user_story_id
    ).first()
    if not user_story:
        raise HTTPException(404, f"User story {user_story_id} not found")

    # CREAR test cases con project_id heredado
    for tc_data in test_cases_data.get("test_cases", []):
        # ... generar ID ...

        new_test_case = TestCaseDB(
            id=test_case_id,
            project_id=user_story.project_id,  # ← ADD (heredar)
            user_story_id=user_story_id,
            # ... resto de campos ...
        )
        db.add(new_test_case)
```

**Testing**:
```bash
curl -X POST "http://localhost:8000/api/v1/test-cases/batch" \
  -H "Content-Type: application/json" \
  -d '{"user_story_id": "US-001", "test_cases": [...]}'
# Verificar: test cases creados con project_id de US-001
```

---

#### 1.7 - POST /generate-test-plan (PRIORIDAD 3)
```python
# Ubicación: backend/api/routes.py línea ~695

@router.post("/generate-test-plan")
async def generate_test_plan(
    project_id: str = Query(..., description="Project ID"),  # ← CHANGE
    format: str = Query("both", description="pdf, docx, or both"),
    db: Session = Depends(get_db)
):
    # OBTENER proyecto
    project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project:
        raise HTTPException(404, f"Project {project_id} not found")

    # FILTRAR user stories y test cases por project_id
    user_stories = db.query(UserStoryDB).filter(
        UserStoryDB.project_id == project_id
    ).all()

    test_cases = db.query(TestCaseDB).filter(
        TestCaseDB.project_id == project_id
    ).all()

    # USAR project.name en lugar de parámetro
    generator = TestPlanGenerator()
    files = generator.generate_test_plan(
        project_name=project.name,  # ← CHANGE
        user_stories=user_stories,
        test_cases=test_cases,
        format=format
    )
```

**Testing**:
```bash
curl -X POST "http://localhost:8000/api/v1/generate-test-plan?project_id=PROJ-001&format=pdf"
# Verificar: PDF generado solo con datos del PROJ-001
```

---

#### 1.8 - POST /create-bug-report (PRIORIDAD 3)
```python
# Ubicación: backend/api/routes.py línea ~720

@router.post("/create-bug-report")
async def create_bug_report(
    bug_data: BugReport,
    db: Session = Depends(get_db)
):
    # HEREDAR project_id de user_story o test_case
    project_id = None

    if bug_data.user_story_id:
        user_story = db.query(UserStoryDB).filter(
            UserStoryDB.id == bug_data.user_story_id
        ).first()
        if user_story:
            project_id = user_story.project_id

    if bug_data.test_case_id and not project_id:
        test_case = db.query(TestCaseDB).filter(
            TestCaseDB.id == bug_data.test_case_id
        ).first()
        if test_case:
            project_id = test_case.project_id

    # VALIDAR que tenemos project_id
    if not project_id:
        raise HTTPException(
            400,
            "Bug must be associated with a user_story_id or test_case_id"
        )

    # CREAR bug con project_id
    new_bug = BugReportDB(
        id=bug_id,
        project_id=project_id,  # ← ADD (heredar)
        # ... resto de campos ...
    )
```

**Testing**:
```bash
curl -X POST "http://localhost:8000/api/v1/create-bug-report" \
  -H "Content-Type: application/json" \
  -d '{"title": "Bug test", "user_story_id": "US-001", ...}'
# Verificar: bug creado con project_id de US-001
```

---

### CHECKPOINT BACKEND
**Después de completar Fase 1:**
```bash
# Test completo del backend
python backend/main.py

# 1. Crear proyecto
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project", "client": "Test Client"}'
# Response: {"id": "PROJ-001", ...}

# 2. Upload stories
curl -X POST "http://localhost:8000/api/v1/upload?project_id=PROJ-001" \
  -F "file=@test.xlsx"

# 3. Get stories (solo del proyecto)
curl "http://localhost:8000/api/v1/user-stories?project_id=PROJ-001"

# 4. Generate test cases
curl -X POST "http://localhost:8000/api/v1/generate-test-cases/US-001/preview"

# 5. Get test cases (solo del proyecto)
curl "http://localhost:8000/api/v1/test-cases?project_id=PROJ-001"

# 6. Get stats
curl "http://localhost:8000/api/v1/projects/PROJ-001/stats"

# ✓ TODO debe funcionar correctamente
```

---

### FASE 2: Frontend - Infraestructura de Proyectos
**Duración**: ~3 horas
**Objetivo**: Crear estructura base para multi-proyecto

#### 2.1 - Project Entity
```typescript
// frontend-react/src/entities/project/model/types.ts
export type ProjectStatus = 'active' | 'archived' | 'completed';

export interface Project {
  id: string;
  name: string;
  description?: string;
  client?: string;
  team_members?: string[];
  status: ProjectStatus;
  default_test_types?: string[];
  start_date?: string;
  end_date?: string;
  created_date: string;
  updated_date: string;
  total_user_stories: number;
  total_test_cases: number;
  total_bugs: number;
  test_coverage: number;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  client?: string;
  team_members?: string[];
  default_test_types?: string[];
  start_date?: string;
  end_date?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  client?: string;
  team_members?: string[];
  status?: ProjectStatus;
  default_test_types?: string[];
  start_date?: string;
  end_date?: string;
}

// frontend-react/src/entities/project/api/projectApi.ts
import axios from 'axios';
import type { Project, CreateProjectDTO, UpdateProjectDTO } from '../model/types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const projectApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await api.get<{ projects: Project[] }>('/projects');
    return data.projects;
  },

  getById: async (id: string): Promise<Project> => {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },

  create: async (projectData: CreateProjectDTO): Promise<Project> => {
    const { data } = await api.post<Project>('/projects', projectData);
    return data;
  },

  update: async (id: string, updates: UpdateProjectDTO): Promise<Project> => {
    const { data } = await api.put<Project>(`/projects/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  getStats: async (id: string) => {
    const { data } = await api.get(`/projects/${id}/stats`);
    return data;
  },
};

// frontend-react/src/entities/project/index.ts
export * from './model/types';
export * from './api/projectApi';
```

**Testing**:
```bash
# Iniciar frontend
cd frontend-react && npm run dev
# Abrir consola del navegador
import { projectApi } from '@/entities/project';
await projectApi.getAll(); // Debe retornar lista de proyectos
```

---

#### 2.2 - ProjectContext Provider
```typescript
// frontend-react/src/app/providers/ProjectContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { Project } from '@/entities/project';

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('currentProject');
    if (stored) {
      try {
        setCurrentProject(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored project:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage when changes
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('currentProject', JSON.stringify(currentProject));
    } else {
      localStorage.removeItem('currentProject');
    }
  }, [currentProject]);

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject, isLoading }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};

// Wrappear App.tsx
import { ProjectProvider } from '@/app/providers/ProjectContext';

function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        {/* ... routes ... */}
      </ProjectProvider>
    </BrowserRouter>
  );
}
```

**Testing**:
```typescript
// En cualquier componente
const { currentProject, setCurrentProject } = useProject();
console.log(currentProject); // null o proyecto
```

---

#### 2.3 - ProjectsListPage (Landing)
```typescript
// frontend-react/src/pages/ProjectsListPage/index.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '@/entities/project';
import { useProject } from '@/app/providers/ProjectContext';
import type { Project } from '@/entities/project';

export const ProjectsListPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const navigate = useNavigate();
  const { setCurrentProject } = useProject();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getAll();
      setProjects(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    navigate(`/projects/${project.id}/dashboard`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin text-6xl">⚙️</div>
      <p className="ml-4">Cargando proyectos...</p>
    </div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen">
      <div className="card max-w-md">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
        <p>{error}</p>
        <button onClick={loadProjects} className="btn btn-primary mt-4">
          Reintentar
        </button>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Mis Proyectos QA
            </h1>
            <p className="text-gray-600 mt-2">
              Gestiona múltiples proyectos de testing
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Nuevo Proyecto
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No hay proyectos
            </h2>
            <p className="text-gray-600 mb-4">
              Crea tu primer proyecto para empezar
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Crear Proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className="card cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500">{project.id}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' :
                    project.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description || 'Sin descripción'}
                </p>

                {project.client && (
                  <p className="text-xs text-gray-500 mb-4">
                    Cliente: {project.client}
                  </p>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {project.total_user_stories}
                    </p>
                    <p className="text-xs text-gray-500">Stories</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {project.total_test_cases}
                    </p>
                    <p className="text-xs text-gray-500">Tests</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {project.test_coverage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Coverage</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TODO: CreateProjectModal */}
    </div>
  );
};
```

**Testing**:
```bash
# Agregar ruta
<Route path="/" element={<ProjectsListPage />} />

# Abrir http://localhost:5173
# Debe mostrar lista de proyectos o "No hay proyectos"
```

---

### FASE 3: Frontend - Routing y Navegación
**Duración**: ~1 hora
**Objetivo**: Rutas específicas por proyecto

#### 3.1 - Actualizar App.tsx
```typescript
// frontend-react/src/app/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from '@/app/providers/ProjectContext';
import { Layout } from '@/widgets/header/Layout';

// Pages
import { ProjectsListPage } from '@/pages/ProjectsListPage';
import { ProjectDashboard } from '@/pages/ProjectDashboard';
import { StoriesPage } from '@/pages/StoriesPage';
import { TestCasesPage } from '@/pages/TestCasesPage';

function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<ProjectsListPage />} />

          {/* Project-specific routes */}
          <Route path="/projects/:projectId" element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ProjectDashboard />} />
            <Route path="stories" element={<StoriesPage />} />
            <Route path="tests" element={<TestCasesPage />} />
            <Route path="bugs" element={<BugsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
          </Route>
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
  );
}
```

**Testing**:
```bash
# Navegar a:
http://localhost:5173/                        # ProjectsListPage
http://localhost:5173/projects/PROJ-001       # Redirect a dashboard
http://localhost:5173/projects/PROJ-001/dashboard
http://localhost:5173/projects/PROJ-001/stories
http://localhost:5173/projects/PROJ-001/tests
```

---

### FASE 4: Frontend - Actualizar API Calls
**Duración**: ~2 horas
**Objetivo**: TODOS los calls usan project_id

#### 4.1 - StoriesPage
```typescript
// frontend-react/src/pages/StoriesPage/index.tsx
import { useParams } from 'react-router-dom';
import { useProject } from '@/app/providers/ProjectContext';

export const StoriesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();

  const loadStories = async () => {
    try {
      setLoading(true);
      // USAR projectId del URL
      const data = await api.get(`/user-stories?project_id=${projectId}`);
      setStories(data.user_stories);
    } catch (error) {
      // ...
    }
  };

  // Upload debe incluir project_id
  const handleUploadSuccess = () => {
    loadStories(); // Recargar stories del proyecto
  };

  // UploadModal debe recibir projectId
  <UploadModal
    isOpen={uploadModalOpen}
    onClose={() => setUploadModalOpen(false)}
    onSuccess={handleUploadSuccess}
    projectId={projectId}  // ← PASS
  />
};
```

#### 4.2 - UploadModal
```typescript
// frontend-react/src/features/upload-excel/ui/UploadModal.tsx
interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectId: string;  // ← ADD
}

export const UploadModal = ({ isOpen, onClose, onSuccess, projectId }: UploadModalProps) => {
  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    // INCLUIR project_id en URL
    const response = await fetch(
      `/api/v1/upload?project_id=${projectId}`,  // ← ADD
      {
        method: 'POST',
        body: formData,
      }
    );
    // ...
  };
};
```

#### 4.3 - TestCasesPage
```typescript
// frontend-react/src/pages/TestCasesPage/index.tsx
import { useParams } from 'react-router-dom';

export const TestCasesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const loadTestCases = async () => {
    try {
      setLoading(true);
      // USAR projectId del URL
      const data = await testCaseApi.getAll(projectId);  // ← CHANGE
      setTestCases(data);
    } catch (error) {
      // ...
    }
  };
};

// Actualizar testCaseApi
// frontend-react/src/entities/test-case/api/testCaseApi.ts
export const testCaseApi = {
  getAll: async (projectId: string): Promise<TestCase[]> => {
    const { data } = await api.get<{ test_cases: TestCase[] }>(
      `/test-cases?project_id=${projectId}`  // ← ADD
    );
    return data.test_cases;
  },
  // ... resto de métodos
};
```

#### 4.4 - DashboardPage
```typescript
// frontend-react/src/pages/ProjectDashboard/index.tsx
import { useParams } from 'react-router-dom';
import { projectApi } from '@/entities/project';

export const ProjectDashboard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, [projectId]);  // Recargar si cambia proyecto

  const loadStats = async () => {
    try {
      // USAR projectId del URL
      const data = await projectApi.getStats(projectId);
      setStats(data);
    } catch (error) {
      // ...
    }
  };

  // ELIMINAR POLLING
  // ❌ const interval = setInterval(loadStats, 30000);

  // Botón manual
  <button onClick={loadStats}>
    🔄 Actualizar Métricas
  </button>
};
```

---

### CHECKPOINT FRONTEND
**Después de completar Fases 2-4:**
```bash
# Test navegación completa
1. Abrir http://localhost:5173
   ✓ Ve ProjectsListPage

2. Click en proyecto
   ✓ Navega a /projects/PROJ-001/dashboard
   ✓ Ve métricas del proyecto

3. Click en "Stories"
   ✓ Navega a /projects/PROJ-001/stories
   ✓ Ve SOLO stories del PROJ-001

4. Upload Excel
   ✓ Sube con project_id=PROJ-001
   ✓ Stories aparecen en la tabla

5. Generate test cases
   ✓ Test cases asociados al proyecto

6. Click en "Tests"
   ✓ Ve SOLO test cases del PROJ-001

7. Cambiar de proyecto
   ✓ Click en otro proyecto
   ✓ Todas las páginas muestran datos del nuevo proyecto
```

---

### FASE 5: Frontend - Componentes Adicionales
**Duración**: ~2 horas
**Objetivo**: Modales y features completas

#### 5.1 - CreateProjectModal
```typescript
// frontend-react/src/features/project-management/ui/CreateProjectModal.tsx
// Similar a TestCaseFormModal pero para proyectos
// Form con: name, description, client, team_members, default_test_types
```

#### 5.2 - EditProjectModal
```typescript
// frontend-react/src/features/project-management/ui/EditProjectModal.tsx
// Mismo form pero en modo edit
```

#### 5.3 - ProjectSettingsPage
```typescript
// frontend-react/src/pages/ProjectSettingsPage/index.tsx
// Configuración del proyecto: rename, archive, delete
```

---

## 📋 VALIDACIONES CRÍTICAS

### Validación 1: Integridad de Datos
```sql
-- Después de crear proyecto y user stories
SELECT
    p.id as project_id,
    p.name,
    COUNT(DISTINCT us.id) as user_stories,
    COUNT(DISTINCT tc.id) as test_cases
FROM projects p
LEFT JOIN user_stories us ON us.project_id = p.id
LEFT JOIN test_cases tc ON tc.project_id = p.id
GROUP BY p.id;

-- Verificar: NO debe haber orphan records
SELECT COUNT(*) FROM user_stories WHERE project_id IS NULL;  -- Debe ser 0
SELECT COUNT(*) FROM test_cases WHERE project_id IS NULL;     -- Debe ser 0
SELECT COUNT(*) FROM bug_reports WHERE project_id IS NULL;    -- Debe ser 0
```

### Validación 2: Cascade Delete
```bash
# Crear proyecto de prueba
curl -X POST http://localhost:8000/api/v1/projects \
  -d '{"name": "Test Delete"}'
# Response: PROJ-002

# Crear user story
curl -X POST "http://localhost:8000/api/v1/upload?project_id=PROJ-002" \
  -F "file=@test.xlsx"

# Verificar creación
SELECT COUNT(*) FROM user_stories WHERE project_id = 'PROJ-002';  # > 0

# Eliminar proyecto
curl -X DELETE http://localhost:8000/api/v1/projects/PROJ-002

# Verificar cascade
SELECT COUNT(*) FROM user_stories WHERE project_id = 'PROJ-002';  # Debe ser 0
SELECT COUNT(*) FROM test_cases WHERE project_id = 'PROJ-002';    # Debe ser 0
```

### Validación 3: Aislamiento de Proyectos
```bash
# Crear 2 proyectos
PROJ-001: "Proyecto A"
PROJ-002: "Proyecto B"

# Upload stories a cada uno
/upload?project_id=PROJ-001 → file_a.xlsx
/upload?project_id=PROJ-002 → file_b.xlsx

# Verificar aislamiento
/user-stories?project_id=PROJ-001  # Solo stories de file_a.xlsx
/user-stories?project_id=PROJ-002  # Solo stories de file_b.xlsx

# Generate test cases en PROJ-001
/generate-test-cases/US-001/preview

# Verificar que test cases van a PROJ-001
/test-cases?project_id=PROJ-001    # Debe tener los nuevos
/test-cases?project_id=PROJ-002    # NO debe tener los nuevos
```

---

## 🚨 PUNTOS CRÍTICOS DE FALLA

### 1. Upload sin project_id
**Problema**: Si olvidamos agregar project_id al upload
**Síntoma**: Error FK constraint o stories sin proyecto
**Solución**: Validar proyecto existe ANTES de parse

### 2. Generate sin validar project
**Problema**: Test cases con project_id incorrecto
**Síntoma**: Test cases no aparecen en el proyecto correcto
**Solución**: SIEMPRE heredar project_id de user_story

### 3. Frontend sin projectId en URL
**Problema**: API calls sin filtro
**Síntoma**: Ve datos de TODOS los proyectos
**Solución**: useParams() en TODAS las páginas

### 4. Context desincronizado
**Problema**: currentProject no actualizado
**Síntoma**: Usuario ve proyecto viejo
**Solución**: setCurrentProject al cambiar de proyecto

### 5. Polling de stats
**Problema**: Sobrecarga del servidor
**Síntoma**: Queries cada 30 segundos
**Solución**: Remover setInterval, usar refresh manual

---

## 📊 ORDEN DE IMPLEMENTACIÓN

```
DÍA 1:
✓ Migración BD (python migrate_to_multiproject.py)
✓ Fase 1.1-1.3: Endpoints críticos (upload, user-stories, test-cases)
✓ Testing backend básico

DÍA 2:
✓ Fase 1.4-1.8: Endpoints adicionales
✓ Checkpoint Backend completo
✓ Fase 2.1-2.2: Project Entity + Context

DÍA 3:
✓ Fase 2.3: ProjectsListPage
✓ Fase 3.1: Routing
✓ Fase 4.1-4.4: Actualizar API calls
✓ Checkpoint Frontend completo

DÍA 4:
✓ Fase 5: Componentes adicionales
✓ Testing E2E completo
✓ Validaciones de integridad
✓ Deploy y documentación
```

---

## ✅ CHECKLIST FINAL

### Backend
- [ ] POST /upload con project_id
- [ ] GET /user-stories con filtro project_id
- [ ] GET /test-cases con filtro project_id
- [ ] POST /generate-test-cases hereda project_id
- [ ] POST /generate-test-cases/preview incluye project_id
- [ ] POST /test-cases/batch hereda project_id
- [ ] POST /generate-test-plan usa project_id
- [ ] POST /create-bug-report hereda project_id
- [ ] Cascade delete funciona
- [ ] Validaciones de FK funcionan

### Frontend
- [ ] Project entity (types, api)
- [ ] ProjectContext provider
- [ ] ProjectsListPage
- [ ] CreateProjectModal
- [ ] EditProjectModal
- [ ] Routing con :projectId
- [ ] StoriesPage usa project_id
- [ ] TestCasesPage usa project_id
- [ ] UploadModal recibe project_id
- [ ] DashboardPage sin polling
- [ ] Navegación entre proyectos funciona
- [ ] localStorage guarda proyecto actual

### Testing E2E
- [ ] Crear proyecto → aparece en lista
- [ ] Seleccionar proyecto → navega correctamente
- [ ] Upload Excel → stories asociadas al proyecto
- [ ] Generate tests → tests asociados al proyecto
- [ ] Cambiar proyecto → datos se actualizan
- [ ] Eliminar proyecto → cascade delete funciona
- [ ] Aislamiento de datos entre proyectos

---

**TODAS LAS PIEZAS DEBEN ENCAJAR PERFECTAMENTE**
**SEGUIR ESTE PLAN AL PIE DE LA LETRA**

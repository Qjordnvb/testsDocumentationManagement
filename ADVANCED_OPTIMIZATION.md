# 🚀 ADVANCED OPTIMIZATION - Background Processing & Parallelization

**Fecha:** 2025-11-22
**Análisis:** Sistema de generación de tests asíncrono con cola

---

## ❌ PROBLEMA ACTUAL - Procesamiento Bloqueante y Secuencial

### 🔴 Backend: Batches SECUENCIALES

**Archivo:** `backend/integrations/gemini_client.py:173-195`

```python
for batch_num in range(num_batches):  # ← LOOP SECUENCIAL
    batch_scenarios = self._generate_batch(user_story, batch_count)
    all_scenarios.extend(batch_scenarios)

    if batch_num < num_batches - 1:
        time.sleep(1)  # ← ESPERA 1 segundo entre batches
```

**Problema:**
- Si genero 45 scenarios en 3 batches de 15
- Batch 1: 5 segundos
- **ESPERA** 1 segundo
- Batch 2: 5 segundos
- **ESPERA** 1 segundo
- Batch 3: 5 segundos
- **Total: 17 segundos**

**Con paralelización:**
- Batch 1, 2, 3 **en paralelo**
- **Total: ~6 segundos** (70% más rápido)

---

### 🔴 Frontend: Modal Bloqueante

**Archivo:** `frontend/src/features/generate-tests/ui/GenerateModal.tsx`

**Problema:**
```
Usuario hace clic "Generate Tests" para US-001
  ↓
Modal muestra spinner de loading
  ↓
Usuario BLOQUEADO, no puede hacer nada
  ↓
Espera 10-20 segundos viendo spinner
  ↓
Modal muestra tests generados
  ↓
Usuario revisa y guarda
  ↓
Modal se cierra
  ↓
Usuario hace clic "Generate Tests" para US-002
  ↓
REPETIR TODO EL PROCESO... 😡
```

**Si el usuario tiene 20 user stories:**
- Tiempo total: **20 × 15 segundos = 5 minutos de clicks repetitivos**
- UX horrible: Click → Wait → Review → Save → Click → Wait → ...

---

## ✅ SOLUCIÓN PROPUESTA - Background Processing con Cola

### 🎯 Objetivo: Experiencia de Usuario Fluida

```
Usuario hace clic "Generate Tests" para US-001
  ↓
Modal se cierra inmediatamente
  ↓
Badge en la tabla: "Generating..." (icono spinner)
  ↓
Usuario hace clic "Generate Tests" para US-002, US-003, US-004...
  ↓
Todos se encolan y generan en background
  ↓
Usuario puede seguir trabajando en otras cosas
  ↓
Toast notification: "✅ Tests for US-001 ready!"
  ↓
Badge cambia: "Ready to Review" (icono check verde)
  ↓
Usuario hace clic cuando quiera para revisar y guardar
```

**Beneficios:**
- ✅ UI nunca se bloquea
- ✅ Usuario puede generar para 10 stories en 30 segundos
- ✅ Generación en background y paralela
- ✅ Notificaciones cuando termine cada uno
- ✅ Usuario controla el flujo

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### **OPCIÓN A: AsyncIO + FastAPI BackgroundTasks** (Rápido, MVP)

#### Backend Changes

**1. Endpoint asíncrono con queue:**

```python
# backend/api/routes.py

from fastapi import BackgroundTasks
import asyncio
from typing import Dict
import uuid

# Global dict to track generation jobs
generation_jobs: Dict[str, dict] = {}

@router.post("/generate-test-cases/{story_id}/queue")
async def queue_test_generation(
    story_id: str,
    num_test_cases: int = Query(default=5, ge=1, le=10),
    scenarios_per_test: int = Query(default=3, ge=1, le=10),
    test_types: List[str] = Query(default=["FUNCTIONAL", "UI"]),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    """
    Queue test case generation in background
    Returns immediately with job_id
    """
    # Generate unique job ID
    job_id = f"gen-{story_id}-{uuid.uuid4().hex[:8]}"

    # Initialize job status
    generation_jobs[job_id] = {
        "job_id": job_id,
        "story_id": story_id,
        "status": "queued",
        "progress": 0,
        "suggested_tests": [],
        "error": None,
        "created_at": datetime.now().isoformat(),
    }

    # Add to background tasks
    background_tasks.add_task(
        generate_tests_background,
        job_id,
        story_id,
        num_test_cases,
        scenarios_per_test,
        test_types,
        db
    )

    return {
        "job_id": job_id,
        "message": "Test generation queued",
        "status_url": f"/generate-test-cases/status/{job_id}"
    }


@router.get("/generate-test-cases/status/{job_id}")
async def get_generation_status(job_id: str):
    """Get status of test generation job"""
    if job_id not in generation_jobs:
        raise HTTPException(404, "Job not found")

    return generation_jobs[job_id]


async def generate_tests_background(
    job_id: str,
    story_id: str,
    num_test_cases: int,
    scenarios_per_test: int,
    test_types: List[str],
    db: Session
):
    """Background task to generate tests"""
    try:
        # Update status
        generation_jobs[job_id]["status"] = "generating"
        generation_jobs[job_id]["progress"] = 10

        # Get user story
        story_db = db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
        if not story_db:
            raise Exception("User story not found")

        # ... (similar logic to current preview endpoint)

        # Update progress: AI generation
        generation_jobs[job_id]["progress"] = 30

        # PARALLELIZAR BATCHES AQUÍ (ver más abajo)
        gherkin_scenarios = await generate_scenarios_parallel(user_story, total_scenarios_needed)

        generation_jobs[job_id]["progress"] = 70

        # Build suggested test cases
        suggested_test_cases = []
        # ... (logic to build test cases)

        generation_jobs[job_id]["progress"] = 90

        # Store results
        generation_jobs[job_id]["status"] = "completed"
        generation_jobs[job_id]["progress"] = 100
        generation_jobs[job_id]["suggested_tests"] = [tc.dict() for tc in suggested_test_cases]

    except Exception as e:
        generation_jobs[job_id]["status"] = "failed"
        generation_jobs[job_id]["error"] = str(e)
```

---

**2. Paralelizar batches con AsyncIO:**

```python
# backend/integrations/gemini_client.py

import asyncio
from concurrent.futures import ThreadPoolExecutor

async def generate_gherkin_scenarios_parallel(
    self,
    user_story: UserStory,
    num_scenarios: int = 3,
    batch_size: int = 15
) -> List[GherkinScenario]:
    """
    Generate Gherkin scenarios in PARALLEL batches using asyncio

    Much faster than sequential: 45 scenarios in 3 batches
    - Sequential: ~17 seconds
    - Parallel: ~6 seconds (70% faster)
    """
    if num_scenarios <= batch_size:
        return self._generate_batch(user_story, num_scenarios)

    # Calculate batches
    num_batches = (num_scenarios + batch_size - 1) // batch_size

    # Create tasks for parallel execution
    tasks = []
    for batch_num in range(num_batches):
        batch_start = batch_num * batch_size
        batch_end = min(batch_start + batch_size, num_scenarios)
        batch_count = batch_end - batch_start

        # Create async task for this batch
        task = asyncio.create_task(
            self._generate_batch_async(user_story, batch_count, batch_num + 1, num_batches)
        )
        tasks.append(task)

    # Wait for ALL batches to complete IN PARALLEL
    batch_results = await asyncio.gather(*tasks, return_exceptions=True)

    # Flatten results
    all_scenarios = []
    for result in batch_results:
        if isinstance(result, Exception):
            print(f"❌ Batch error: {result}")
        else:
            all_scenarios.extend(result)

    return all_scenarios


async def _generate_batch_async(self, user_story: UserStory, num_scenarios: int, batch_num: int, total_batches: int) -> List[GherkinScenario]:
    """Async wrapper for _generate_batch"""
    print(f"   Batch {batch_num}/{total_batches}: Requesting {num_scenarios} scenarios...")

    # Run sync Gemini API call in thread pool (API is sync, not async)
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        scenarios = await loop.run_in_executor(
            pool,
            self._generate_batch,
            user_story,
            num_scenarios
        )

    print(f"   ✅ Batch {batch_num}/{total_batches}: Got {len(scenarios)} scenarios")
    return scenarios
```

---

#### Frontend Changes

**3. Queue UI with polling:**

```typescript
// frontend/src/features/generate-tests/ui/GenerateModal.tsx

const handleGenerateBackground = async () => {
  try {
    // Queue the job
    const response = await queueTestGeneration({
      storyId: story.id,
      numTestCases,
      scenariosPerTest,
      testTypes: selectedTestTypes,
      useAi,
    });

    const jobId = response.job_id;

    // Close modal immediately
    onClose();

    // Show toast notification
    toast.success(`Generando tests para "${story.title}" en segundo plano...`, {
      duration: 3000,
    });

    // Add to global queue state (Zustand store)
    addGenerationJob({
      jobId,
      storyId: story.id,
      storyTitle: story.title,
      status: 'queued',
      progress: 0,
    });

    // Start polling in background
    pollJobStatus(jobId, story.id, story.title);

  } catch (error) {
    toast.error('Error al encolar generación de tests');
  }
};


// Polling function
const pollJobStatus = async (jobId: string, storyId: string, storyTitle: string) => {
  const interval = setInterval(async () => {
    try {
      const status = await getGenerationStatus(jobId);

      // Update global queue state
      updateGenerationJob(jobId, {
        status: status.status,
        progress: status.progress,
      });

      if (status.status === 'completed') {
        clearInterval(interval);

        // Store suggested tests
        setSuggestedTestsForStory(storyId, status.suggested_tests);

        // Show success notification
        toast.success(`✅ Tests listos para "${storyTitle}"! Click para revisar.`, {
          duration: 10000,
          onClick: () => openReviewModal(storyId),
        });

        // Mark as ready
        updateGenerationJob(jobId, { status: 'ready' });

      } else if (status.status === 'failed') {
        clearInterval(interval);
        toast.error(`❌ Error generando tests para "${storyTitle}": ${status.error}`);
        removeGenerationJob(jobId);
      }

    } catch (error) {
      console.error('Error polling job status:', error);
    }
  }, 2000); // Poll every 2 seconds
};
```

---

**4. Global Queue State (Zustand):**

```typescript
// frontend/src/features/generate-tests/model/queueStore.ts

import { create } from 'zustand';

interface GenerationJob {
  jobId: string;
  storyId: string;
  storyTitle: string;
  status: 'queued' | 'generating' | 'completed' | 'ready' | 'failed';
  progress: number;
  suggestedTests?: SuggestedTestCase[];
}

interface QueueStore {
  jobs: Record<string, GenerationJob>;
  addGenerationJob: (job: GenerationJob) => void;
  updateGenerationJob: (jobId: string, updates: Partial<GenerationJob>) => void;
  removeGenerationJob: (jobId: string) => void;
  getJobByStoryId: (storyId: string) => GenerationJob | undefined;
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  jobs: {},

  addGenerationJob: (job) => set((state) => ({
    jobs: { ...state.jobs, [job.jobId]: job }
  })),

  updateGenerationJob: (jobId, updates) => set((state) => ({
    jobs: {
      ...state.jobs,
      [jobId]: { ...state.jobs[jobId], ...updates }
    }
  })),

  removeGenerationJob: (jobId) => set((state) => {
    const { [jobId]: removed, ...rest } = state.jobs;
    return { jobs: rest };
  }),

  getJobByStoryId: (storyId) => {
    const jobs = get().jobs;
    return Object.values(jobs).find(job => job.storyId === storyId);
  },
}));
```

---

**5. Badge UI in Stories Table:**

```typescript
// frontend/src/widgets/story-table/StoryTable.tsx

import { useQueueStore } from '@/features/generate-tests/model/queueStore';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

function StoryRow({ story }) {
  const job = useQueueStore((state) => state.getJobByStoryId(story.id));

  return (
    <tr>
      <td>{story.id}</td>
      <td>{story.title}</td>
      <td>
        {/* Generation Status Badge */}
        {job && (
          <div className="flex items-center gap-2">
            {job.status === 'generating' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-xs text-blue-600">
                  Generating {job.progress}%...
                </span>
              </>
            )}
            {job.status === 'ready' && (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <button
                  onClick={() => openReviewModal(story.id)}
                  className="text-xs text-green-600 underline"
                >
                  Ready to Review
                </button>
              </>
            )}
            {job.status === 'failed' && (
              <>
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-600">Failed</span>
              </>
            )}
          </div>
        )}
      </td>
      <td>
        {/* Actions */}
        <button onClick={() => handleGenerateTests(story)}>
          Generate Tests
        </button>
      </td>
    </tr>
  );
}
```

---

### **OPCIÓN B: Celery + Redis** (Production-Grade)

**Para proyectos grandes (>100 user stories simultáneas):**

```python
# backend/tasks.py

from celery import Celery

celery_app = Celery(
    'qa_tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

@celery_app.task(bind=True)
def generate_tests_task(self, story_id: str, num_test_cases: int, ...):
    """Celery task for test generation"""
    try:
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 10})

        # Generate tests (with parallel batches)
        # ...

        self.update_state(state='PROGRESS', meta={'progress': 70})

        return {
            'status': 'completed',
            'suggested_tests': [...]
        }
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e)
        }
```

---

## 📊 COMPARACIÓN DE PERFORMANCE

### Escenario: Usuario genera tests para 10 user stories

| Métrica | Actual (Secuencial) | AsyncIO (Opción A) | Celery (Opción B) |
|---------|---------------------|--------------------|--------------------|
| **Generación por story** | 15 segundos | 6 segundos (paralelo) | 6 segundos (paralelo) |
| **Tiempo total (10 stories)** | 150 segundos | ~60 segundos | ~60 segundos |
| **UI bloqueada** | ✅ Sí, 150s | ❌ No | ❌ No |
| **Usuario puede seguir trabajando** | ❌ No | ✅ Sí | ✅ Sí |
| **Notificaciones** | ❌ No | ✅ Sí | ✅ Sí |
| **Escalabilidad** | Baja | Media (100 stories) | Alta (1000+ stories) |
| **Complejidad implementación** | N/A | Baja (2-3 hrs) | Alta (1 día) |

---

## 🎯 RECOMENDACIÓN

### **Para MVP / Producción pequeña (<500 stories):**
→ **OPCIÓN A: AsyncIO + FastAPI BackgroundTasks**

**Pros:**
- ✅ No requiere infraestructura adicional (Redis, Celery)
- ✅ Implementación rápida (2-3 horas)
- ✅ Suficiente para la mayoría de casos de uso
- ✅ Batches paralelos (70% más rápido)
- ✅ Background processing (UI nunca se bloquea)

**Cons:**
- ⚠️ Jobs se pierden si el servidor se reinicia
- ⚠️ Limitado a ~100 jobs concurrentes

---

### **Para Producción grande (>500 stories, equipos grandes):**
→ **OPCIÓN B: Celery + Redis**

**Pros:**
- ✅ Jobs persistentes (no se pierden con restart)
- ✅ Escalable a miles de jobs concurrentes
- ✅ Retry automático en caso de fallo
- ✅ Monitoreo con Flower dashboard

**Cons:**
- ⚠️ Requiere Redis server
- ⚠️ Mayor complejidad de deployment
- ⚠️ Más tiempo de implementación

---

## 📋 PLAN DE IMPLEMENTACIÓN

### **Fase 1: Paralelización de Batches** (1 hora) - P0 🔴
1. ✅ Convertir `generate_gherkin_scenarios_batched` a async
2. ✅ Usar `asyncio.gather` para ejecutar batches en paralelo
3. ✅ Testing: 45 scenarios → 17s → ~6s

### **Fase 2: Background Processing con AsyncIO** (2 horas) - P0 🔴
1. ✅ Crear endpoint `/queue` que retorna inmediatamente
2. ✅ Implementar FastAPI BackgroundTasks
3. ✅ Endpoint `/status/{job_id}` para polling
4. ✅ Frontend: Cerrar modal inmediatamente
5. ✅ Frontend: Polling cada 2 segundos

### **Fase 3: Queue UI** (2 horas) - P1 🟡
1. ✅ Zustand store para jobs en progreso
2. ✅ Badge en tabla de stories (Generating / Ready)
3. ✅ Toast notifications cuando termine
4. ✅ Review modal on-demand (click badge)

### **Fase 4 (Opcional): Celery Migration** (1 día) - P2 🟢
1. Setup Redis server
2. Configurar Celery worker
3. Migrar background tasks a Celery
4. Setup Flower para monitoreo

---

## ✅ VALIDACIÓN

**Criterios de éxito:**
- [ ] Usuario puede generar tests para 10 stories en <1 minuto (solo clicks)
- [ ] UI nunca se bloquea durante generación
- [ ] Batches se ejecutan en paralelo (45 scenarios en ~6s)
- [ ] Toast notifications cuando termine cada generación
- [ ] Badge en tabla muestra status (Generating / Ready)
- [ ] Click en badge abre modal de review

---

**¿Procedemos con Fase 1 + 2 (Background Processing con AsyncIO)?**
**Tiempo total:** 3 horas
**Ganancia:** 70% más rápido + UI fluida + Mejor UX

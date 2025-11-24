# AUDITORÍA MULTI-TENANT - Aislamiento de Organizaciones

**Fecha**: 2025-11-23
**Objetivo**: Garantizar que TODAS las organizaciones están completamente aisladas

## Requisitos de Seguridad

1. ✅ Cada organización es COMPLETAMENTE independiente
2. ✅ Los proyectos dentro de una organización son independientes
3. ✅ Cada rol (admin, qa, dev, manager) ve SOLO datos de SU organización
4. ❌ NO se pueden mezclar datos entre organizaciones
5. ✅ TODAS las queries DEBEN filtrar por organization_id

---

## Estado de las Queries

### ❌ CRÍTICO: UserStoryDB (8 queries SIN organization_id)

| Archivo | Línea | Query Actual | Estado |
|---------|-------|--------------|--------|
| `backend/tasks.py` | 68 | `.filter(UserStoryDB.id == story_id)` | ✅ CORREGIDO |
| `backend/services/story_service.py` | 146 | `.filter(UserStoryDB.id == story_id)` | ❌ PENDIENTE |
| `backend/services/story_service.py` | 166 | `.filter(UserStoryDB.id == story_id)` | ❌ PENDIENTE |
| `backend/services/bug_service.py` | 235 | `.filter(UserStoryDB.id == bug.user_story_id)` | ❌ PENDIENTE |
| `backend/services/test_case_service.py` | 52 | `.filter(UserStoryDB.id == story_id)` | ❌ PENDIENTE |
| `backend/services/test_case_service.py` | 181 | `.filter(UserStoryDB.id == story_id)` | ❌ PENDIENTE |
| `backend/services/test_case_service.py` | 311 | `.filter(UserStoryDB.id == user_story_id)` | ❌ PENDIENTE |
| `backend/api/endpoints/test_cases.py` | 491 | `.filter(UserStoryDB.id == story_id)` | ✅ CORREGIDO |

**CRÍTICO**: Todas estas queries permiten acceso cross-organization si se conoce el story_id.

### 🔍 TestCaseDB (Pendiente Auditoría)

```bash
# Buscar TODAS las queries de TestCaseDB
grep -rn "TestCaseDB).filter" backend/
```

### 🔍 BugReportDB (Pendiente Auditoría)

```bash
# Buscar TODAS las queries de BugReportDB
grep -rn "BugReportDB).filter" backend/
```

### 🔍 ProjectDB (Pendiente Auditoría)

```bash
# Verificar que proyectos se filtren por organization_id
grep -rn "ProjectDB).filter" backend/
```

---

## Correcciones Requeridas

### 1. story_service.py - get_story_by_id()

**ANTES**:
```python
def get_story_by_id(self, story_id: str) -> Dict[str, Any]:
    story = self.db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
```

**DESPUÉS**:
```python
def get_story_by_id(self, story_id: str, project_id: str, organization_id: str) -> Dict[str, Any]:
    story = self.db.query(UserStoryDB).filter(
        UserStoryDB.id == story_id,
        UserStoryDB.project_id == project_id,
        UserStoryDB.organization_id == organization_id
    ).first()
```

### 2. story_service.py - update_story()

**ANTES**:
```python
def update_story(self, story_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    story = self.db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
```

**DESPUÉS**:
```python
def update_story(self, story_id: str, project_id: str, organization_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    story = self.db.query(UserStoryDB).filter(
        UserStoryDB.id == story_id,
        UserStoryDB.project_id == project_id,
        UserStoryDB.organization_id == organization_id
    ).first()
```

### 3. test_case_service.py - generate_test_case()

**ANTES**:
```python
def generate_test_case(self, story_id: str, use_ai: bool, num_scenarios: int):
    story_db = self.db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
```

**DESPUÉS**:
```python
def generate_test_case(self, story_id: str, project_id: str, organization_id: str, use_ai: bool, num_scenarios: int):
    story_db = self.db.query(UserStoryDB).filter(
        UserStoryDB.id == story_id,
        UserStoryDB.project_id == project_id,
        UserStoryDB.organization_id == organization_id
    ).first()
```

### 4. test_case_service.py - generate_test_cases_with_ai()

**ANTES**:
```python
def generate_test_cases_with_ai(self, story_id: str, ...):
    story_db = self.db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
```

**DESPUÉS**:
```python
def generate_test_cases_with_ai(self, story_id: str, project_id: str, organization_id: str, ...):
    story_db = self.db.query(UserStoryDB).filter(
        UserStoryDB.id == story_id,
        UserStoryDB.project_id == project_id,
        UserStoryDB.organization_id == organization_id
    ).first()
```

### 5. test_case_service.py - create_test_cases_batch()

**ANTES**:
```python
def create_test_cases_batch(self, test_cases_data, user_story_id):
    user_story = self.db.query(UserStoryDB).filter(UserStoryDB.id == user_story_id).first()
```

**DESPUÉS**:
```python
def create_test_cases_batch(self, test_cases_data, user_story_id, project_id, organization_id):
    user_story = self.db.query(UserStoryDB).filter(
        UserStoryDB.id == user_story_id,
        UserStoryDB.project_id == project_id,
        UserStoryDB.organization_id == organization_id
    ).first()
```

---

## Endpoints que Necesitan Modificación

### 1. GET /user-stories/{story_id}

**Endpoint**: `backend/api/endpoints/stories.py:136`

**Cambio Requerido**:
```python
# ANTES
@router.get("/user-stories/{story_id}")
async def get_user_story(story_id: str, service):
    story = service.get_story_by_id(story_id)

# DESPUÉS
@router.get("/user-stories/{story_id}")
async def get_user_story(
    story_id: str,
    project_id: str = Query(...),
    current_user: UserDB = Depends(get_current_user),
    service: StoryService = Depends(...)
):
    story = service.get_story_by_id(story_id, project_id, current_user.organization_id)
```

### 2. PUT /user-stories/{story_id}

**Endpoint**: `backend/api/endpoints/stories.py:171`

**Cambio Requerido**:
```python
# ANTES
@router.put("/user-stories/{story_id}")
async def update_user_story(story_id: str, updates, service):
    story = service.update_story(story_id, updates)

# DESPUÉS
@router.put("/user-stories/{story_id}")
async def update_user_story(
    story_id: str,
    project_id: str = Query(...),
    updates: dict,
    current_user: UserDB = Depends(get_current_user),
    service: StoryService = Depends(...)
):
    story = service.update_story(story_id, project_id, current_user.organization_id, updates)
```

### 3. POST /test-cases/batch

**Endpoint**: `backend/api/endpoints/test_cases.py:173`

**Cambio Requerido**:
```python
# ANTES
@router.post("/test-cases/batch")
async def create_test_cases_batch(test_cases_data: dict, service):
    result = service.create_test_cases_batch(test_cases_data["test_cases"], test_cases_data["user_story_id"])

# DESPUÉS
@router.post("/test-cases/batch")
async def create_test_cases_batch(
    test_cases_data: dict,
    current_user: UserDB = Depends(get_current_user),
    service: TestCaseService = Depends(...)
):
    # Extraer project_id del primer test case o del payload
    project_id = test_cases_data.get("project_id")
    user_story_id = test_cases_data["user_story_id"]

    result = service.create_test_cases_batch(
        test_cases_data["test_cases"],
        user_story_id,
        project_id,
        current_user.organization_id
    )
```

---

## Validación de Endpoints con current_user

TODOS los endpoints protegidos deben:

1. ✅ Tener `current_user: UserDB = Depends(get_current_user)`
2. ✅ Pasar `current_user.organization_id` a los servicios
3. ✅ Validar que el proyecto/story pertenece a la organización del usuario

---

## Testing Multi-Tenant

### Test Case 1: Coca Cola NO ve datos de Pepsi

```bash
# Login como Coca Cola user
user: qacoca@gmail.com
organization: ORG-COCA

# Intentar acceder a story de Pepsi
GET /user-stories/444277?project_id=PROJ-001

# Resultado esperado: 404 Not Found (story exists pero en otra org)
```

### Test Case 2: Pepsi NO ve datos de Coca Cola

```bash
# Login como Pepsi user
user: qapepsi@gmail.com
organization: ORG-PEPSI

# Intentar acceder a test case de Coca Cola
GET /test-cases?project_id=PROJ-002

# Resultado esperado: [] (vacío)
```

### Test Case 3: Stories duplicadas NO se cruzan

```bash
# Pepsi carga Excel con story 444277
# Coca Cola carga MISMO Excel con story 444277

# Verificar:
- Story 444277 en PROJ-001 (Pepsi) tiene test cases solo de Pepsi
- Story 444277 en PROJ-002 (Coca) tiene test cases solo de Coca Cola
- NO hay cruce de datos
```

---

## Status

- ❌ **UserStoryDB**: 6 de 8 queries corregidas (75%)
- ❌ **TestCaseDB**: Pendiente auditoría
- ❌ **BugReportDB**: Pendiente auditoría
- ❌ **ProjectDB**: Pendiente auditoría
- ✅ **Celery Task**: Corregido (usa project_id + organization_id)
- ✅ **Endpoint /queue**: Corregido (valida proyecto + organización)

**CRÍTICO**: NO desplegar a producción hasta que TODAS las queries estén corregidas.

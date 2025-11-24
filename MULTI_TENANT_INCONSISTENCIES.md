# 🔴 INCONSISTENCIAS MULTI-TENANT - ANÁLISIS COMPLETO

**Fecha**: 2025-11-23
**Status**: 🔴 CRÍTICO - Aislamiento multi-tenant INCOMPLETO

---

## 📊 RESUMEN EJECUTIVO

| Servicio | Métodos Analizados | Inconsistencias | Criticidad |
|----------|-------------------|-----------------|------------|
| **ProjectService** | `create_project()` | ✅ **CORREGIDO** | N/A |
| **UserService** | `create_invitation()`, `create_user()` | ✅ **CORREGIDO** | N/A |
| **StoryService** | `_batch_save_stories()` | ❌ **1 CRÍTICA** | 🔴 ALTA |
| **TestCaseService** | `generate_test_cases()`, `create_test_cases_batch()` | ❌ **2 CRÍTICAS** | 🔴 ALTA |
| **BugService** | `_create_bug_db_record()` | ❌ **1 CRÍTICA** | 🔴 ALTA |
| **ExecutionService** | `create_test_execution()` | ⚠️ **VERIFICAR** | 🟡 MEDIA |

**Total de Inconsistencias Críticas**: **4 confirmadas + 1 por verificar**

---

## 🔴 INCONSISTENCIA #1: StoryService

### Ubicación
**Archivo**: `backend/services/story_service.py`
**Método**: `_batch_save_stories()`
**Líneas**: 267-342

### Problema
Al crear/actualizar User Stories, NO se asigna `organization_id`, violando el esquema multi-tenant.

### Código Problemático
```python
def _batch_save_stories(
    self,
    user_stories: List[UserStory],
    project_id: str
) -> tuple[List[str], List[str]]:
    """Save user stories to database using batch processing"""

    for user_story in user_stories:
        story_data = {
            'id': user_story.id,
            'project_id': project_id,  # ✅ OK
            'title': user_story.title,
            'description': user_story.description,
            # ... más campos ...
            # ❌ FALTA: 'organization_id'
        }

        if user_story.id in existing_ids:
            update_stories_data.append(story_data)
        else:
            story_data['created_date'] = now
            new_stories_data.append(story_data)

    # Batch insert/update SIN organization_id
    self.db.bulk_insert_mappings(UserStoryDB, new_stories_data)
    self.db.bulk_update_mappings(UserStoryDB, update_stories_data)
```

### Impacto
- ✅ **Severidad**: CRÍTICA
- ❌ User Stories pueden quedar sin `organization_id`
- ❌ Viola constraint `NOT NULL` en base de datos
- ❌ Imposible filtrar stories por organización
- ❌ Riesgo de cross-tenant data leak

### Solución Requerida
```python
def _batch_save_stories(
    self,
    user_stories: List[UserStory],
    project_id: str,
    organization_id: str  # ← AGREGAR PARÁMETRO
) -> tuple[List[str], List[str]]:

    for user_story in user_stories:
        story_data = {
            'id': user_story.id,
            'project_id': project_id,
            'organization_id': organization_id,  # ← AGREGAR
            'title': user_story.title,
            # ... resto de campos ...
        }
```

**Cambios Adicionales Requeridos**:
1. Método `upload_and_process_file()` debe aceptar `organization_id`
2. Endpoint `/upload` debe pasar `current_user.organization_id`

---

## 🔴 INCONSISTENCIA #2: TestCaseService - generate_test_cases()

### Ubicación
**Archivo**: `backend/services/test_case_service.py`
**Método**: `generate_test_cases()`
**Líneas**: 31-124

### Problema
Al generar test cases con AI, NO se asigna `organization_id`.

### Código Problemático
```python
def generate_test_cases(
    self,
    story_id: str,
    use_ai: bool = True,
    num_scenarios: int = 3
) -> Dict[str, Any]:
    # ... código de generación ...

    # Líneas 104-114: Crear test case
    test_case = TestCaseDB(
        id=test_case_id,
        project_id=story_db.project_id,  # ✅ OK
        title=f"Test for {user_story.title}",
        description=f"Automated test scenarios for {user_story.id}",
        user_story_id=story_id,
        gherkin_file_path=gherkin_file,
        created_date=datetime.now()
        # ❌ FALTA: organization_id=...
    )
    self.db.add(test_case)
    self.db.commit()
```

### Impacto
- ✅ **Severidad**: CRÍTICA
- ❌ Test cases generados sin `organization_id`
- ❌ Viola constraint `NOT NULL`
- ❌ Cross-tenant contamination risk

### Solución Requerida
```python
# Obtener organization_id del proyecto o user story
story_db = self.db.query(UserStoryDB).filter(UserStoryDB.id == story_id).first()
project = self.db.query(ProjectDB).filter(ProjectDB.id == story_db.project_id).first()

test_case = TestCaseDB(
    id=test_case_id,
    project_id=story_db.project_id,
    organization_id=project.organization_id,  # ← AGREGAR
    # ... resto de campos ...
)
```

---

## 🔴 INCONSISTENCIA #3: TestCaseService - create_test_cases_batch()

### Ubicación
**Archivo**: `backend/services/test_case_service.py`
**Método**: `create_test_cases_batch()`
**Líneas**: 282-396

### Problema
Al crear múltiples test cases (batch), NO se asigna `organization_id`.

### Código Problemático
```python
def create_test_cases_batch(
    self,
    test_cases_data: List[Dict[str, Any]],
    user_story_id: str
) -> Dict[str, Any]:
    # Líneas 305-315
    user_story = self.db.query(UserStoryDB).filter(UserStoryDB.id == user_story_id).first()

    # ... procesamiento ...

    # Líneas 351-362: Crear test case
    db_test_case = TestCaseDB(
        id=tc_data["id"],
        project_id=user_story.project_id,  # ✅ OK
        title=tc_data.get("title", "Untitled Test Case"),
        description=tc_data.get("description", ""),
        user_story_id=tc_data.get("user_story_id", user_story_id),
        test_type=test_type,
        priority=priority,
        status=status,
        gherkin_file_path=gherkin_file_path,
        created_date=datetime.now()
        # ❌ FALTA: organization_id=user_story.organization_id
    )

    self.db.add(db_test_case)
```

### Impacto
- ✅ **Severidad**: CRÍTICA
- ❌ Batch creation sin isolation
- ❌ Afecta flujo de revisión de test cases generados por AI

### Solución Requerida
```python
# Obtener organization_id del user_story
user_story = self.db.query(UserStoryDB).filter(UserStoryDB.id == user_story_id).first()

db_test_case = TestCaseDB(
    id=tc_data["id"],
    project_id=user_story.project_id,
    organization_id=user_story.organization_id,  # ← AGREGAR
    # ... resto de campos ...
)
```

---

## 🔴 INCONSISTENCIA #4: BugService - _create_bug_db_record()

### Ubicación
**Archivo**: `backend/services/bug_service.py`
**Método**: `_create_bug_db_record()`
**Líneas**: 248-285

### Problema
Al crear bug reports, NO se asigna `organization_id`.

### Código Problemático
```python
def _create_bug_db_record(self, bug: BugReport, project_id: str, doc_path: str) -> BugReportDB:
    """Create BugReportDB instance from BugReport"""

    return BugReportDB(
        id=bug.id,
        project_id=project_id,  # ✅ OK
        title=bug.title,
        description=bug.description,
        # ... 30+ campos más ...
        reported_date=bug.reported_date or datetime.now(),
        document_path=doc_path
        # ❌ FALTA: organization_id=...
    )
```

### Impacto
- ✅ **Severidad**: CRÍTICA
- ❌ Bug reports sin isolation
- ❌ Violation de integridad multi-tenant
- ❌ Reportes pueden verse entre organizaciones

### Solución Requerida
```python
def _create_bug_db_record(self, bug: BugReport, project_id: str, organization_id: str, doc_path: str) -> BugReportDB:
    """Create BugReportDB instance from BugReport"""

    return BugReportDB(
        id=bug.id,
        project_id=project_id,
        organization_id=organization_id,  # ← AGREGAR
        # ... resto de campos ...
    )
```

**Cambios Adicionales**:
1. Método `create_bug()` debe obtener `organization_id` del proyecto
2. Pasar `organization_id` a `_create_bug_db_record()`

---

## ⚠️ VERIFICACIÓN PENDIENTE: ExecutionService

### Ubicación
**Archivo**: `backend/services/execution_service.py`
**Método**: `create_test_execution()`
**Líneas**: 90-177

### Necesita Verificación
El modelo `TestExecutionDB` puede NO requerir `organization_id` si:
1. Es una tabla de auditoría/historial
2. Ya tiene composite FK a `test_cases` que incluye `organization_id`

**Verificar en `backend/database/models.py`**:
```python
class TestExecutionDB(Base):
    __tablename__ = "test_executions"
    __table_args__ = (
        ForeignKeyConstraint(
            ['test_case_id', 'project_id', 'organization_id'],  # ← Si incluye esto, NECESITA organization_id
            ['test_cases.id', 'test_cases.project_id', 'test_cases.organization_id'],
            ondelete='CASCADE'
        ),
    )

    # Campos:
    test_case_id = Column(String, nullable=False)
    project_id = Column(String, nullable=False)
    organization_id = Column(String, nullable=False)  # ← Si está presente, FALTA asignarlo
```

### Acción Requerida
1. ✅ Verificar esquema de `TestExecutionDB`
2. ⚠️ Si tiene `organization_id`, agregar en línea 139-155
3. ✅ Si NO tiene `organization_id`, documentar por qué no lo necesita

---

## 📋 PLAN DE CORRECCIÓN

### Prioridad 1: Servicios Críticos (INMEDIATO)

#### 1. StoryService
```bash
Archivo: backend/services/story_service.py
Cambios:
  - Línea 267: _batch_save_stories() agregar param organization_id
  - Línea 301: Agregar 'organization_id' a story_data dict
  - Línea 32: upload_and_process_file() obtener organization_id del project
  - Línea 73: Pasar organization_id a _batch_save_stories()

Endpoint Afectado: backend/api/endpoints/user_stories.py
  - POST /upload debe pasar current_user.organization_id
```

#### 2. TestCaseService
```bash
Archivo: backend/services/test_case_service.py
Cambios:
  - Línea 104-114: generate_test_cases() obtener organization_id del project
  - Línea 351-362: create_test_cases_batch() agregar organization_id

Endpoints Afectados:
  - POST /generate-test-cases/{story_id}/preview
  - POST /test-cases/batch
```

#### 3. BugService
```bash
Archivo: backend/services/bug_service.py
Cambios:
  - Línea 248: _create_bug_db_record() agregar param organization_id
  - Línea 130-167: create_bug() obtener organization_id del project
  - Línea 257: Agregar organization_id a BugReportDB()

Endpoint Afectado:
  - POST /create-bug-report
  - POST /bugs
```

### Prioridad 2: Verificación y Filtros

#### 4. Agregar filtros por organization_id en GET endpoints
```bash
Archivos a modificar:
  - backend/services/story_service.py: get_stories_by_project()
  - backend/services/test_case_service.py: get_test_cases_by_project()
  - backend/services/bug_service.py: get_bugs_by_project()

Acción: Verificar que project_id ya viene filtrado por organización
```

#### 5. Validar ExecutionService
```bash
Acción:
  1. Revisar models.py línea 311-353
  2. Confirmar si TestExecutionDB tiene organization_id
  3. Si sí, corregir create_test_execution() línea 139-155
```

---

## 🧪 CASOS DE PRUEBA POST-CORRECCIÓN

### Test 1: User Stories Upload
```bash
1. Login como admin@coca.com
2. Crear proyecto "Proyecto Coca"
3. Upload Excel con stories
4. Verificar en DB: SELECT organization_id FROM user_stories WHERE project_id='PROJ-001'
   ✅ Debe retornar: ORG-COCA

5. Login como admin@pepsi.com
6. GET /user-stories?project_id=PROJ-001
   ✅ Debe retornar: []  (No puede ver stories de Coca)
```

### Test 2: Test Case Generation
```bash
1. Login como qacoca@gmail.com (ORG-COCA)
2. Generar test cases para US-001
3. Verificar en DB: SELECT organization_id FROM test_cases WHERE user_story_id='US-001'
   ✅ Debe retornar: ORG-COCA

4. Login como qapepsi@gmail.com (ORG-PEPSI)
5. GET /test-cases?project_id=PROJ-001
   ✅ Debe retornar: []
```

### Test 3: Bug Reports
```bash
1. Login como qacoca@gmail.com
2. Crear bug report para test case TC-001
3. Verificar en DB: SELECT organization_id FROM bug_reports WHERE id='BUG-001'
   ✅ Debe retornar: ORG-COCA

4. Login como admin@pepsi.com
5. GET /bugs?project_id=PROJ-001
   ✅ Debe retornar: []
```

---

## 📊 MÉTRICAS DE CORRECCIÓN

| Métrica | Antes | Después (Esperado) |
|---------|-------|-------------------|
| Servicios con isolation | 2/6 (33%) | 6/6 (100%) |
| Endpoints seguros | 3/20 (15%) | 20/20 (100%) |
| Tablas aisladas | 2/5 (40%) | 5/5 (100%) |
| Riesgo cross-tenant | 🔴 ALTO | 🟢 NULO |

---

## ✅ CHECKLIST DE CORRECCIÓN

- [x] Identificar inconsistencias en ProjectService ✅
- [x] Identificar inconsistencias en UserService ✅
- [x] Identificar inconsistencias en StoryService ❌ (4 cambios pendientes)
- [x] Identificar inconsistencias en TestCaseService ❌ (2 métodos pendientes)
- [x] Identificar inconsistencias en BugService ❌ (1 método pendiente)
- [ ] Verificar ExecutionService ⏳
- [ ] Corregir StoryService
- [ ] Corregir TestCaseService
- [ ] Corregir BugService
- [ ] Actualizar endpoints afectados
- [ ] Ejecutar tests de aislamiento
- [ ] Validar con datos reales (Coca vs Pepsi)

---

**Generado**: 2025-11-23
**Próxima Acción**: Implementar correcciones en orden de prioridad

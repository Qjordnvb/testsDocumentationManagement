# 🗄️ Explicación del Script de Migración

**Archivo**: `migrate_to_multiproject.py`
**Tipo**: ❌ NO es una migración tradicional - Es un "Drop & Recreate"
**Fecha**: 2025-11-18

---

## ⚠️ QUÉ HACE EXACTAMENTE

### Paso 1: Borra TODO (Línea 49)
```python
Base.metadata.drop_all(bind=engine)
```

**Esto elimina**:
- ❌ Tabla `projects` → Borrada
- ❌ Tabla `user_stories` → Borrada
- ❌ Tabla `test_cases` → Borrada
- ❌ Tabla `bug_reports` → Borrada
- ❌ Tabla `test_executions` → Borrada
- ❌ **TODOS LOS DATOS** → Perdidos permanentemente

### Paso 2: Crea TODO desde cero (Línea 58)
```python
Base.metadata.create_all(bind=engine)
```

**Esto crea las tablas según los modelos en** `backend/database/models.py`:

#### Tabla 1: `projects`
```sql
CREATE TABLE projects (
    id VARCHAR PRIMARY KEY,              -- "PROJ-001", "PROJ-002", etc.
    name VARCHAR NOT NULL,
    description TEXT,
    client VARCHAR,
    team_members TEXT,                   -- JSON: ["email1", "email2"]
    status VARCHAR,                      -- "active", "archived", "completed"
    default_test_types TEXT,             -- JSON: ["FUNCTIONAL", "UI", ...]
    start_date DATETIME,
    end_date DATETIME,
    created_date DATETIME,
    updated_date DATETIME,
    notion_database_id VARCHAR,
    azure_project_id VARCHAR
);
```

**Relationships**:
- `user_stories` → CASCADE DELETE (si borras proyecto, borra stories)
- `test_cases` → CASCADE DELETE
- `bug_reports` → CASCADE DELETE

#### Tabla 2: `user_stories`
```sql
CREATE TABLE user_stories (
    id VARCHAR PRIMARY KEY,              -- "US-001", "US-002", etc.
    project_id VARCHAR NOT NULL,         -- FK a projects.id ← CRÍTICO
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR,                    -- "Critical", "High", "Medium", "Low"
    status VARCHAR,                      -- "Backlog", "To Do", "In Progress", ...
    epic VARCHAR,
    sprint VARCHAR,
    story_points INTEGER,
    assigned_to VARCHAR,
    created_date DATETIME,
    updated_date DATETIME,

    -- Acceptance Criteria (JSON)
    acceptance_criteria TEXT,            -- JSON array
    total_criteria INTEGER DEFAULT 0,
    completed_criteria INTEGER DEFAULT 0,
    completion_percentage FLOAT DEFAULT 0.0,

    -- Integrations
    notion_page_id VARCHAR,
    azure_work_item_id VARCHAR,

    FOREIGN KEY (project_id) REFERENCES projects(id)
);
CREATE INDEX ix_user_stories_project_id ON user_stories(project_id);
```

**Relationships**:
- `project` → ManyToOne a ProjectDB
- `test_cases` → OneToMany a TestCaseDB
- `bug_reports` → OneToMany a BugReportDB

#### Tabla 3: `test_cases`
```sql
CREATE TABLE test_cases (
    id VARCHAR PRIMARY KEY,              -- "TC-001", "TC-002", etc.
    project_id VARCHAR NOT NULL,         -- FK a projects.id ← CRÍTICO
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    user_story_id VARCHAR NOT NULL,      -- FK a user_stories.id
    test_type VARCHAR,                   -- "FUNCTIONAL", "UI", "API", ...
    priority VARCHAR,                    -- "CRITICAL", "HIGH", "MEDIUM", "LOW"
    status VARCHAR,                      -- "NOT_RUN", "PASSED", "FAILED", ...
    estimated_time_minutes INTEGER,
    actual_time_minutes INTEGER,
    automated BOOLEAN DEFAULT FALSE,
    created_date DATETIME,
    last_executed DATETIME,
    executed_by VARCHAR,
    gherkin_file_path VARCHAR,           -- Path al .feature file

    -- Integrations
    notion_page_id VARCHAR,
    azure_test_case_id VARCHAR,

    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_story_id) REFERENCES user_stories(id)
);
CREATE INDEX ix_test_cases_project_id ON test_cases(project_id);
```

**Relationships**:
- `project` → ManyToOne a ProjectDB
- `user_story` → ManyToOne a UserStoryDB
- `executions` → OneToMany a TestExecutionDB

#### Tabla 4: `bug_reports`
```sql
CREATE TABLE bug_reports (
    id VARCHAR PRIMARY KEY,              -- "BUG-001", "BUG-002", etc.
    project_id VARCHAR NOT NULL,         -- FK a projects.id ← CRÍTICO
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR,                    -- "CRITICAL", "HIGH", "MEDIUM", "LOW"
    priority VARCHAR,                    -- "URGENT", "HIGH", "MEDIUM", "LOW"
    bug_type VARCHAR,                    -- "FUNCTIONAL", "UI", "PERFORMANCE", ...
    status VARCHAR,                      -- "NEW", "ASSIGNED", "FIXED", ...

    -- Context
    environment VARCHAR,
    browser VARCHAR,
    os VARCHAR,
    version VARCHAR,

    -- Relationships
    user_story_id VARCHAR,               -- FK a user_stories.id (nullable)
    test_case_id VARCHAR,                -- No FK (solo referencia)

    -- People
    reported_by VARCHAR,
    assigned_to VARCHAR,
    verified_by VARCHAR,

    -- Dates
    reported_date DATETIME,
    assigned_date DATETIME,
    fixed_date DATETIME,
    verified_date DATETIME,
    closed_date DATETIME,

    -- Document
    document_path VARCHAR,

    -- Integrations
    notion_page_id VARCHAR,
    azure_bug_id VARCHAR,

    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_story_id) REFERENCES user_stories(id)
);
CREATE INDEX ix_bug_reports_project_id ON bug_reports(project_id);
```

**Relationships**:
- `project` → ManyToOne a ProjectDB
- `user_story` → ManyToOne a UserStoryDB

#### Tabla 5: `test_executions`
```sql
CREATE TABLE test_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_case_id VARCHAR NOT NULL,       -- FK a test_cases.id
    executed_by VARCHAR NOT NULL,
    execution_date DATETIME,
    status VARCHAR NOT NULL,             -- "PASSED", "FAILED", etc.
    execution_time_minutes INTEGER,
    passed_steps INTEGER DEFAULT 0,
    failed_steps INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    notes TEXT,
    failure_reason TEXT,
    bug_ids VARCHAR,                     -- Comma-separated: "BUG-001,BUG-002"

    FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
);
```

**Nota**: NO tiene `project_id` directamente (lo hereda de `test_case`)

---

## ✅ SÍ AJUSTA LAS TABLAS A LO QUE NECESITAMOS

El script **SÍ crea exactamente el schema correcto** con:

1. ✅ **Multi-Proyecto**: Tabla `projects` con cascade delete
2. ✅ **project_id en todas las entidades**: user_stories, test_cases, bug_reports
3. ✅ **Foreign Keys configuradas**: Relaciones entre tablas
4. ✅ **Índices en project_id**: Para queries eficientes
5. ✅ **Acceptance Criteria**: Campo JSON en user_stories
6. ✅ **Tracking de completitud**: total_criteria, completed_criteria, completion_percentage
7. ✅ **Cascade Delete**: Borrar proyecto → borra todo asociado
8. ✅ **Integraciones preparadas**: Campos para Notion y Azure DevOps

---

## ❌ PERO NO ES UNA "MIGRACIÓN" TRADICIONAL

### Qué es una migración tradicional (Alembic, Django Migrations)

```python
# Ejemplo Alembic:
def upgrade():
    op.add_column('user_stories', sa.Column('project_id', sa.String(), nullable=True))
    op.create_index('ix_user_stories_project_id', 'user_stories', ['project_id'])
    # Migra datos existentes
    op.execute("UPDATE user_stories SET project_id = 'PROJ-001' WHERE project_id IS NULL")
    op.alter_column('user_stories', 'project_id', nullable=False)

def downgrade():
    op.drop_column('user_stories', 'project_id')
```

**Características**:
- ✅ Preserva datos existentes
- ✅ Cambios incrementales
- ✅ Reversible (downgrade)
- ✅ Versionado
- ✅ Safe para producción

### Qué hace migrate_to_multiproject.py

```python
def migrate_database():
    Base.metadata.drop_all(bind=engine)    # ❌ BORRA TODO
    Base.metadata.create_all(bind=engine)  # ✅ Crea desde cero
```

**Características**:
- ❌ Borra todos los datos
- ❌ No incremental
- ❌ No reversible
- ❌ No versionado
- ❌ **PELIGROSO en producción**

---

## 🎯 CUÁNDO USAR ESTE SCRIPT

### ✅ USAR EN:

1. **Setup inicial** (primera vez)
   ```bash
   # No hay BD → Crear todo desde cero
   python migrate_to_multiproject.py
   ```

2. **Desarrollo local** (reset limpio)
   ```bash
   # Quiero empezar de cero con schema nuevo
   python migrate_to_multiproject.py
   cd backend && python ../seed_data.py
   ```

3. **Testing / CI/CD** (cada test run)
   ```bash
   # Antes de cada test suite
   python migrate_to_multiproject.py
   python seed_data.py
   pytest
   ```

4. **Demo / Presentación** (datos limpios)
   ```bash
   # Resetear BD antes de demo
   python migrate_to_multiproject.py
   cd backend && python ../seed_data.py
   ```

### ❌ NO USAR EN:

1. **Producción con datos existentes**
   - ❌ Borrará TODOS los datos de clientes
   - ❌ Pérdida irreversible de información

2. **Cuando hay datos importantes**
   - ❌ User stories de proyectos reales
   - ❌ Test cases creados manualmente
   - ❌ Bug reports históricos

3. **Cambios incrementales de schema**
   - ❌ Solo quieres agregar una columna
   - ❌ Deberías usar Alembic

---

## 🔄 ALTERNATIVAS PARA PRODUCCIÓN

### Opción 1: Alembic (Recomendado)

**Setup**:
```bash
pip install alembic
alembic init alembic
```

**Crear migración**:
```bash
# Detecta cambios automáticamente
alembic revision --autogenerate -m "Add project_id to user_stories"

# Aplicar migración
alembic upgrade head

# Rollback si falla
alembic downgrade -1
```

**Ventajas**:
- ✅ Preserva datos
- ✅ Versionado
- ✅ Reversible
- ✅ Safe para producción

### Opción 2: Migración Manual

**Script personalizado**:
```python
def migrate_add_project_id():
    # 1. Agregar columna (nullable)
    engine.execute("ALTER TABLE user_stories ADD COLUMN project_id VARCHAR")

    # 2. Crear proyecto default
    engine.execute("INSERT INTO projects (id, name) VALUES ('PROJ-001', 'Default Project')")

    # 3. Migrar datos
    engine.execute("UPDATE user_stories SET project_id = 'PROJ-001' WHERE project_id IS NULL")

    # 4. Hacer columna NOT NULL
    engine.execute("ALTER TABLE user_stories ALTER COLUMN project_id SET NOT NULL")

    # 5. Agregar FK
    engine.execute("ALTER TABLE user_stories ADD FOREIGN KEY (project_id) REFERENCES projects(id)")
```

---

## 📝 RESUMEN

| Aspecto | migrate_to_multiproject.py |
|---------|----------------------------|
| **Tipo** | Drop & Recreate |
| **Preserva datos** | ❌ NO - Borra todo |
| **Schema correcto** | ✅ SÍ - Crea tablas correctas |
| **Seguro para prod** | ❌ NO - Pérdida de datos |
| **Uso recomendado** | Setup inicial, dev, testing |
| **Reversible** | ❌ NO |
| **Versionado** | ❌ NO |

---

## 🎯 RECOMENDACIÓN FINAL

### Para tu caso actual (desarrollo):
✅ **SÍ, usa el script**

```bash
python migrate_to_multiproject.py  # Confirmar 'yes'
cd backend && python ../seed_data.py
```

**Razón**: Estás en desarrollo, no hay datos de producción que preservar.

### Para el futuro (producción):
❌ **NO uses este script**

**En su lugar**:
1. Implementa Alembic para migraciones incrementales
2. Crea backups antes de cualquier migración
3. Prueba migraciones en staging primero
4. Ten un plan de rollback

---

## 🚀 SIGUIENTE PASO

Después de ejecutar el script, tu BD tendrá:
- ✅ 5 tablas creadas con schema correcto
- ✅ FKs y constraints configurados
- ✅ Índices en project_id para performance
- ✅ Cascade deletes funcionando
- ❌ 0 datos (BD vacía)

**Entonces ejecuta**:
```bash
cd backend && python ../seed_data.py
```

Para crear:
- 1 proyecto (PROJ-001: E-commerce Platform QA)
- 5 user stories con 17 acceptance criteria
- Datos listos para testing

---

**Última Actualización**: 2025-11-18
**Mantenido Por**: QA Automation Team

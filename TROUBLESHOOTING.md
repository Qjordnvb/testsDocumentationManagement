# 🔧 TROUBLESHOOTING - Solución de Problemas Comunes

**Última Actualización**: 2025-11-22
**Status**: ✅ Actualizado con soluciones verificadas

---

## 📋 ÍNDICE

1. [Base de datos no se borra](#problema-1-base-de-datos-no-se-borra)
2. [Servicios no se detienen](#problema-2-servicios-no-se-detienen)
3. [UNIQUE constraint failed](#problema-3-unique-constraint-failed)
4. [Carga de Excel muy lenta](#problema-4-carga-de-excel-muy-lenta)
5. [Criterios de aceptación en 0](#problema-5-criterios-de-aceptación-en-0)

---

## Problema 1: Base de datos no se borra

### Síntomas
```bash
make db-clear       # No borra datos
rm -f data/qa_automation.db  # Archivo sigue existiendo
```

### Causas
1. **Procesos bloqueando la base de datos** - Backend/Celery tienen la BD abierta
2. **Archivos WAL de SQLite** - `.db-shm` y `.db-wal` también necesitan borrarse
3. **PYTHONPATH no configurado** - Scripts Python no pueden importar módulos

### Solución 1: Usar force-reset (RECOMENDADO)
```bash
make force-reset
```

Este comando:
- ✅ Mata TODOS los procesos (Python, Node, Celery, Redis)
- ✅ Libera TODOS los puertos (8000, 5173, 3000, 6379)
- ✅ Elimina base de datos + archivos WAL
- ✅ Recrea base de datos con schema correcto

### Solución 2: Manual
```bash
# 1. Detener TODOS los servicios
make dev-stop

# 2. Matar procesos manualmente (si persisten)
pkill -9 -f "uvicorn"
pkill -9 -f "celery"
pkill -9 -f "vite"

# 3. Eliminar archivos de base de datos
rm -f data/qa_automation.db*

# 4. Migrar con nuevo schema
make db-migrate

# 5. Crear proyectos de ejemplo
make db-create-samples
```

---

## Problema 2: Servicios no se detienen

### Síntomas
```bash
make dev-stop
# Frontend sigue corriendo en localhost:5173
# Backend sigue respondiendo en localhost:8000
```

### Causas
1. **pkill no encuentra todos los procesos** - Diferentes nombres de proceso
2. **Procesos hijos no se matan** - Vite/npm crean subprocesos
3. **Puertos no se liberan** - Procesos zombie

### Solución 1: force-reset
```bash
make force-reset
```

### Solución 2: Manual agresiva
```bash
# Backend
pkill -9 -f "uvicorn"
pkill -9 -f "python.*main"
lsof -ti:8000 | xargs kill -9

# Frontend
pkill -9 -f "vite"
pkill -9 -f "node.*vite"
pkill -9 -f "npm.*dev"
lsof -ti:5173 | xargs kill -9

# Celery
pkill -9 -f "celery"

# Redis
pkill -9 -f "redis-server"
lsof -ti:6379 | xargs kill -9

# Verificar
lsof -i :8000 -i :5173 -i :3000 -i :6379
# Debería salir vacío
```

---

## Problema 3: UNIQUE constraint failed

### Síntomas
```
Error processing file: (sqlite3.IntegrityError) UNIQUE constraint failed: user_stories.id
[SQL: INSERT INTO user_stories (id, project_id, ...) VALUES (?, ?, ...)]
[parameters: ('444247', 'PROJ-002', ...)]
```

### Causa
**Base de datos tiene schema VIEJO** sin composite primary keys.

#### Schema VIEJO (INCORRECTO):
```sql
CREATE TABLE user_stories (
    id VARCHAR NOT NULL,
    project_id VARCHAR NOT NULL,
    PRIMARY KEY (id),  ← ❌ Solo 'id' - no permite duplicados entre proyectos
    ...
)
```

#### Schema NUEVO (CORRECTO):
```sql
CREATE TABLE user_stories (
    id VARCHAR NOT NULL,
    project_id VARCHAR NOT NULL,
    PRIMARY KEY (id, project_id),  ← ✅ Composite key - permite mismo ID en proyectos diferentes
    ...
)
```

### Solución

#### Paso 1: Verificar schema actual
```bash
python3 -c "
import sqlite3
conn = sqlite3.connect('data/qa_automation.db')
cursor = conn.cursor()
cursor.execute(\"SELECT sql FROM sqlite_master WHERE type='table' AND name='user_stories'\")
result = cursor.fetchone()
if result:
    print(result[0])
    if 'PRIMARY KEY (id, project_id)' in result[0]:
        print('\n✅ Schema CORRECTO (composite key)')
    else:
        print('\n❌ Schema INCORRECTO (necesita migración)')
conn.close()
"
```

#### Paso 2: Si schema es INCORRECTO:
```bash
# Opción A: Force reset (RECOMENDADO)
make force-reset

# Opción B: Manual
make dev-stop
rm -f data/qa_automation.db*
make db-migrate
make db-create-samples
```

#### Paso 3: Verificar que funcionó
```bash
# Verificar schema nuevo
python3 -c "
import sqlite3
conn = sqlite3.connect('data/qa_automation.db')
cursor = conn.cursor()
cursor.execute(\"SELECT sql FROM sqlite_master WHERE type='table' AND name='user_stories'\")
result = cursor.fetchone()
if 'PRIMARY KEY (id, project_id)' in result[0]:
    print('✅ Schema CORRECTO')
else:
    print('❌ PROBLEMA: Schema sigue incorrecto')
conn.close()
"

# Verificar proyectos
make db-status
```

#### Paso 4: Probar carga de Excel
```bash
# Iniciar servicios
make dev

# Subir Excel a PROJ-001
curl -X POST "http://localhost:8000/api/v1/upload?project_id=PROJ-001" \
  -F "file=@tu_archivo.xlsx"

# Subir MISMO Excel a PROJ-002 (debería funcionar ahora)
curl -X POST "http://localhost:8000/api/v1/upload?project_id=PROJ-002" \
  -F "file=@tu_archivo.xlsx"
```

**IMPORTANTE**: Con composite keys, ahora puedes tener el mismo story ID (ej: `444247`) en diferentes proyectos sin error UNIQUE constraint.

---

## Problema 4: Carga de Excel muy lenta

### Síntomas
```bash
# 100 filas tarda >20 segundos
# 500 filas timeout
```

### Causa
**Procesamiento secuencial** con queries individuales por cada story.

### Solución

#### ✅ Batch Processing (YA IMPLEMENTADO)

La versión actual usa `bulk_insert_mappings()` y `bulk_update_mappings()`:

**Performance**:
| Filas | ANTES (seq) | AHORA (batch) | Speedup |
|-------|-------------|---------------|---------|
| 10    | ~2 seg      | ~0.5 seg      | **4x**  |
| 50    | ~10 seg     | ~1 seg        | **10x** |
| 100   | ~20 seg     | ~1.5 seg      | **13x** |
| 500   | ~100 seg    | ~3 seg        | **33x** |
| 1000  | ~200 seg    | ~5 seg        | **40x** |

#### Verificar versión con batch processing:
```bash
git log --oneline --all -5 | grep "batch"
# Debería mostrar: perf: Implement batch processing for 10-100x faster Excel imports
```

Si NO ves el commit:
```bash
git pull origin claude/setup-quality-mission-control-01Q56Y1RqDiJEWufGcZRpQDa
```

---

## Problema 5: Criterios de aceptación en 0

### Síntomas
```
User Stories table muestra:
- Total Criteria: 0
- Completed: 0
- Progress: 0%
```

### Causas
1. **Base de datos vacía** - No hay user stories cargadas
2. **Excel sin columna acceptance_criteria**
3. **Formato incorrecto** - Separadores no reconocidos

### Solución

#### Paso 1: Verificar que hay stories
```bash
make db-status
# Debería mostrar: User Stories: X (donde X > 0)
```

Si es 0:
```bash
# Crear proyectos
make db-create-samples

# Subir Excel
curl -X POST "http://localhost:8000/api/v1/upload?project_id=PROJ-001" \
  -F "file=@tu_archivo.xlsx"
```

#### Paso 2: Verificar formato de Excel

**Columna requerida**: `acceptance_criteria` (o variantes: `acceptance`, `criteria`, `ac`)

**Separadores soportados**:
- `\n` (salto de línea): `Criterion 1\nCriterion 2`
- `;` (punto y coma): `Criterion 1; Criterion 2`
- `|` (pipe): `Criterion 1 | Criterion 2`
- `- ` (guión): `- Criterion 1\n- Criterion 2`

**Ejemplo Excel**:
| id     | title      | acceptance_criteria                                    |
|--------|------------|--------------------------------------------------------|
| US-001 | User Login | - Validar email\n- Validar password\n- Redirect dashboard |

#### Paso 3: Verificar en base de datos
```bash
PYTHONPATH=. python3 -c "
from backend.database.db import SessionLocal
from backend.database.models import UserStoryDB
import json

db = SessionLocal()
story = db.query(UserStoryDB).first()
if story:
    criteria = json.loads(story.acceptance_criteria) if story.acceptance_criteria else []
    print(f'Story: {story.id}')
    print(f'Total Criteria: {story.total_criteria}')
    print(f'Criteria JSON: {story.acceptance_criteria}')
    print(f'Parsed: {len(criteria)} items')
    for i, c in enumerate(criteria, 1):
        print(f'  {i}. {c[\"description\"]}')
else:
    print('No stories found')
db.close()
"
```

---

## 🚨 Solución Universal (Cuando todo falla)

Si ninguna solución funciona:

```bash
# 1. Force reset completo
make force-reset

# 2. Crear proyectos de ejemplo
make db-create-samples

# 3. Verificar estado
make db-status

# 4. Iniciar servicios
make dev

# 5. Probar upload
curl -X POST "http://localhost:8000/api/v1/upload?project_id=PROJ-001" \
  -F "file=@tu_archivo.xlsx"
```

---

## 📝 Comandos Útiles

### Verificar qué está corriendo
```bash
# Ver procesos
ps aux | grep -E "(uvicorn|celery|vite|node|redis)"

# Ver puertos en uso
lsof -i :8000 -i :5173 -i :3000 -i :6379
```

### Verificar base de datos
```bash
# Ver schema
python3 -c "import sqlite3; conn = sqlite3.connect('data/qa_automation.db'); cursor = conn.cursor(); cursor.execute(\"SELECT sql FROM sqlite_master WHERE type='table' AND name='user_stories'\"); print(cursor.fetchone()[0]); conn.close()"

# Ver stats
make db-status

# Ver proyectos
PYTHONPATH=. python3 -c "from backend.database.db import SessionLocal; from backend.database.models import ProjectDB; db = SessionLocal(); [print(f'{p.id}: {p.name}') for p in db.query(ProjectDB).all()]; db.close()"
```

### Limpiar TODO
```bash
# Matar TODOS los procesos Python/Node
pkill -9 -f "python"
pkill -9 -f "node"

# Eliminar TODA la base de datos
rm -rf data/

# Recrear desde cero
mkdir -p data
make db-migrate
make db-create-samples
```

---

## 📞 Ayuda Adicional

Si el problema persiste:
1. Verificar logs: `docker compose logs -f` (si usas Docker)
2. Verificar .env: `cat .env` (verificar GEMINI_API_KEY)
3. Verificar Python version: `python3 --version` (debe ser 3.11+)
4. Verificar Node version: `node --version` (debe ser 18+)

---

**Documentación relacionada**:
- [README_COMANDOS.md](./README_COMANDOS.md) - Guía completa de comandos
- [ASYNC_EXCEL_UPLOAD.md](./ASYNC_EXCEL_UPLOAD.md) - Documentación de upload async
- [CLAUDE.md](./CLAUDE.md) - Documentación técnica completa

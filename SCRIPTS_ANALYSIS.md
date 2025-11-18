# 📜 Análisis de Scripts en Raíz del Proyecto

**Fecha**: 2025-11-18
**Objetivo**: Identificar qué scripts son necesarios y cuáles pueden eliminarse

---

## 📊 RESUMEN EJECUTIVO

| Estado | Cantidad | Archivos |
|--------|----------|----------|
| ✅ **Necesarios** | 2 | migrate_to_multiproject.py, seed_data.py |
| 🟡 **Útiles** | 2 | check_env.sh, test_api_key.py |
| ❌ **Obsoletos** | 3 | quick_start.sh, quick_start.bat, fix_user_stories_project_id.py |

---

## ✅ SCRIPTS NECESARIOS (Mantener)

### 1. `migrate_to_multiproject.py`
**Estado**: ✅ Necesario
**Uso**: Una vez al inicio o para reset completo de BD
**Propósito**: Migración de base de datos a arquitectura multi-proyecto

**Qué hace**:
- Borra TODAS las tablas existentes
- Recrea tablas con soporte para `project_id`
- Configura FKs y cascade deletes

**Cuándo usar**:
- Setup inicial del proyecto
- Reset completo de la BD para empezar de cero
- Después de cambios mayores en el schema

**Comando**:
```bash
python migrate_to_multiproject.py
# Confirmar con 'yes'
```

**⚠️ ADVERTENCIA**: Borra TODO - user stories, test cases, bugs, executions

---

### 2. `seed_data.py` ⭐ NUEVO
**Estado**: ✅ Necesario
**Uso**: Para demos, testing y desarrollo
**Propósito**: Crea datos de ejemplo en la BD

**Qué hace**:
- Crea proyecto: "E-commerce Platform QA" (PROJ-001)
- Crea 5 user stories con acceptance criteria:
  - US-001: User Login (2/4 criterios - 50%)
  - US-002: Product Search (0/3 criterios - 0%)
  - US-003: Add to Cart (0/2 criterios - 0%)
  - US-004: Checkout Process (4/5 criterios - 80%)
  - US-005: User Registration (3/3 criterios - 100%)
- Total: 17 criterios de aceptación con estados variados

**Cuándo usar**:
- Después de `migrate_to_multiproject.py` para ver el sistema funcionando
- Demos y presentaciones
- Testing de nuevas features del frontend
- Onboarding de nuevos desarrolladores

**Comando**:
```bash
cd backend && python ../seed_data.py
```

**Resultado**:
- BD lista para usar inmediatamente
- Datos realistas para ver todas las features
- Diferentes estados de completitud para testing

---

## 🟡 SCRIPTS ÚTILES (Mantener para troubleshooting)

### 3. `check_env.sh`
**Estado**: 🟡 Útil (no crítico)
**Uso**: Debugging de configuración
**Propósito**: Verifica .env y API key

**Qué hace**:
- Busca archivo .env en el directorio actual
- Verifica que GEMINI_API_KEY existe
- Valida formato (debe empezar con "AIza")
- Muestra API key enmascarada para seguridad

**Cuándo usar**:
- Error: "GEMINI_API_KEY not configured"
- API key no funciona (verificar formato)
- Troubleshooting de setup inicial

**Comando**:
```bash
bash check_env.sh
```

**Output esperado**:
```
✅ .env file found
🔑 GEMINI_API_KEY found in .env
   Masked value: AIzaSyBdef...x7Yz
   Length: 39 characters
   Format: ✅ Starts with 'AIza'
```

---

### 4. `test_api_key.py`
**Estado**: 🟡 Útil (no crítico)
**Uso**: Debugging avanzado de configuración
**Propósito**: Verifica qué API key carga el backend

**Qué hace**:
- Importa `settings` desde backend/config.py
- Muestra API key cargada (enmascarada)
- Compara con environment variable
- Útil para debugging de Pydantic BaseSettings

**Cuándo usar**:
- Backend dice "API key not configured" pero .env existe
- Verificar que backend/config.py lee correctamente
- Debugging de variables de entorno

**Comando**:
```bash
python test_api_key.py
```

**Output esperado**:
```
✅ .env file found at: /path/to/.env
🔑 API Key loaded: AIzaSyBdef...x7Yz
   Length: 39 characters
🌍 Environment variable: AIzaSyBdef...x7Yz
```

---

## ❌ SCRIPTS OBSOLETOS (Eliminar)

### 5. `quick_start.sh` ❌
**Estado**: ❌ Obsoleto
**Razón**: Referencias a estructura vieja del proyecto

**Problemas**:
- Línea 64: `python -m src.cli init` ← `src/cli.py` NO EXISTE
- Línea 67: `python -m src.cli parse` ← Arquitectura cambió
- Línea 80: `python -m src.cli generate-tests` ← CLI deprecado
- Línea 83: `python -m src.cli server` ← Ahora es `python backend/main.py`

**Arquitectura vieja** (ya no existe):
```
src/
├── cli.py          # ❌ NO EXISTE
├── parser.py
└── generator.py
```

**Arquitectura actual**:
```
backend/
├── main.py         # ✅ FastAPI server
├── api/
│   └── routes.py   # ✅ REST API endpoints
└── ...
```

**Reemplazo sugerido**: Crear nuevo `setup.sh` actualizado (ver abajo)

---

### 6. `quick_start.bat` ❌
**Estado**: ❌ Obsoleto
**Razón**: Mismo problema que quick_start.sh pero para Windows

**Problemas**:
- Línea 67: `python -m src.cli init` ← NO EXISTE
- Todas las referencias a CLI viejo

**Reemplazo sugerido**: Crear nuevo `setup.bat` actualizado

---

### 7. `fix_user_stories_project_id.py` ❌
**Estado**: ❌ Obsoleto
**Razón**: Problema ya resuelto permanentemente

**Por qué ya no es necesario**:
- Fue útil durante la migración inicial a multi-proyecto
- Backend ahora **requiere** `project_id` en todos los endpoints:
  - `POST /upload?project_id=PROJ-001` (obligatorio)
  - `GET /user-stories?project_id=PROJ-001` (obligatorio)
  - `POST /test-cases/batch` hereda project_id de user_story
- FK constraints en BD impiden crear stories sin project_id
- Ya no pueden existir "stories huérfanas"

**Cuándo fue útil** (pasado):
- Durante migración de BD vieja a nueva
- Cuando había stories creadas sin project_id
- Transición de arquitectura single → multi-proyecto

**Por qué eliminarlo**:
- El problema que resolvía ya no puede ocurrir
- Confunde a nuevos desarrolladores
- Código muerto

---

## 🎯 RECOMENDACIONES

### Acción Inmediata: Eliminar Scripts Obsoletos

```bash
# Eliminar archivos obsoletos
rm quick_start.sh
rm quick_start.bat
rm fix_user_stories_project_id.py

# Verificar
ls -1 *.py *.sh *.bat
# Deberían quedar solo:
# - check_env.sh
# - migrate_to_multiproject.py
# - seed_data.py
# - test_api_key.py
```

### Opcional: Crear Scripts de Setup Actualizados

**`setup.sh` (nuevo)**:
```bash
#!/bin/bash
echo "🚀 QA Documentation Automation - Setup"

# Backend
echo "📦 Installing backend dependencies..."
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Environment
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Edit .env and add your GEMINI_API_KEY"
fi

# Database
echo "🗄️  Migrating database..."
python migrate_to_multiproject.py

echo "📊 Creating sample data..."
cd backend && python ../seed_data.py && cd ..

echo "✅ Setup complete!"
echo "Next steps:"
echo "  Terminal 1: cd backend && python main.py"
echo "  Terminal 2: cd frontend && npm run dev"
echo "  Browser: http://localhost:5173"
```

**`setup.bat` (nuevo para Windows)**:
Similar al .sh pero con sintaxis batch.

---

## 📁 ESTRUCTURA FINAL RECOMENDADA

```
testsDocumentationManagement/
├── backend/
├── frontend/
├── .env
├── .env.example
├── requirements.txt
│
├── migrate_to_multiproject.py  # ✅ Migración BD
├── seed_data.py                # ✅ Datos de ejemplo
├── check_env.sh                # 🟡 Debug .env
├── test_api_key.py             # 🟡 Debug API key
│
└── (opcional)
    ├── setup.sh                # 🆕 Setup completo
    └── setup.bat               # 🆕 Setup Windows
```

**Archivos eliminados**:
- ❌ quick_start.sh (obsoleto)
- ❌ quick_start.bat (obsoleto)
- ❌ fix_user_stories_project_id.py (ya no necesario)

---

## 🔄 FLUJO DE TRABAJO TÍPICO

### Setup Inicial (Primera vez)
```bash
# 1. Instalar dependencias
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd frontend && npm install && cd ..

# 2. Configurar .env
cp .env.example .env
nano .env  # Agregar GEMINI_API_KEY

# 3. Migrar BD
python migrate_to_multiproject.py  # Confirmar con 'yes'

# 4. Crear datos de ejemplo
cd backend && python ../seed_data.py

# 5. Iniciar servidores
# Terminal 1: cd backend && python main.py
# Terminal 2: cd frontend && npm run dev
```

### Reset de Base de Datos
```bash
# 1. Borrar y recrear tablas
python migrate_to_multiproject.py

# 2. Crear datos de ejemplo
cd backend && python ../seed_data.py
```

### Troubleshooting API Key
```bash
# 1. Verificar .env
bash check_env.sh

# 2. Verificar carga del backend
python test_api_key.py

# 3. Si falla, recrear .env
cp .env.example .env
nano .env
```

---

## 📝 NOTAS

- **check_env.sh** y **test_api_key.py**: Mantener para troubleshooting pero documentar que son opcionales
- **migrate_to_multiproject.py**: CRÍTICO - no eliminar nunca
- **seed_data.py**: MUY ÚTIL - facilita demos y onboarding
- **quick_start.\***: Eliminar - causan confusión y están rotos
- **fix_user_stories_project_id.py**: Eliminar - problema ya no existe

---

**Última Revisión**: 2025-11-18
**Decisión**: Eliminar 3 scripts obsoletos, mantener 2 necesarios + 2 útiles

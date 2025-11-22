# 🎯 ESTRUCTURA SIMPLIFICADA - Quality Mission Control

**Fecha**: 2025-11-22
**Status**: ✅ ACTIVO

---

## ✅ ARCHIVOS QUE USAMOS AHORA

### Configuración Principal
- `docker-compose.yml` - UN SOLO archivo para desarrollo Y producción
- `Makefile` - Comandos simples que funcionan
- `.env` - Variables de entorno

### Dockerfiles
- `Dockerfile.backend` - Backend FastAPI
- `Dockerfile.celery` - Celery worker
- `frontend/Dockerfile` - Frontend React

---

## ❌ ARCHIVOS OBSOLETOS (Puedes eliminar)

### Scripts bash obsoletos (ya no se usan)
- `scripts/dev-start.sh` - ❌ OBSOLETO (usamos Docker ahora)
- `force_reset.sh` - ❌ OBSOLETO (usa `make reset-db`)
- `clear_database.py` - ❌ OBSOLETO (usa `make reset-db`)
- `migrate_to_multiproject.py` - ❌ OBSOLETO (migración ya hecha)

### Docker compose viejos
- `docker-compose.full.yml` - ❌ OBSOLETO (ahora solo usamos `docker-compose.yml`)
- `docker-compose.prod.yml` - ❌ OBSOLETO (si existe)

---

## 📋 COMANDOS NUEVOS (Simple y funcionan)

### Desarrollo diario
```bash
make up        # Iniciar TODO
make down      # Detener TODO
make restart   # Reiniciar servicios
make logs      # Ver logs en tiempo real
make status    # Ver qué está corriendo
```

### Base de datos
```bash
make reset-db  # BORRAR BD y empezar limpio
make db-status # Ver estadísticas de la BD
make clean     # Limpiar TODO (containers, BD, logs)
```

### Build
```bash
make build     # Rebuild containers
make rebuild   # Stop, rebuild, start
```

---

## 🚀 WORKFLOW TÍPICO

### Primer uso
```bash
# 1. Iniciar servicios
make up

# 2. Esperar a que todo arranque (30 segundos)
make logs

# 3. Abrir navegador
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Cuando necesitas BD limpia
```bash
# Opción 1: Solo resetear BD (rápido)
make reset-db

# Opción 2: Limpiar TODO (más lento, hace rebuild)
make clean
make up
```

### Ver logs de un servicio específico
```bash
make logs-backend   # Solo backend
make logs-frontend  # Solo frontend
make logs-celery    # Solo celery
```

### Detener al final del día
```bash
make down
```

---

## 🏭 PRODUCCIÓN

El MISMO `docker-compose.yml` funciona en producción.

Solo cambia:
1. Variables de entorno en `.env` (usar PostgreSQL en lugar de SQLite)
2. Remover `--reload` del comando uvicorn
3. Cambiar `target: development` a `target: production` en frontend

```bash
# En producción
docker compose up -d
docker compose logs -f
```

---

## ❓ FAQ

### ¿Por qué ya NO usamos `dev-start.sh`?
**Problema**: Creaba procesos `nohup` imposibles de matar.
**Solución**: TODO corre en Docker. `docker compose down` mata TODO limpiamente.

### ¿Por qué `make reset-db` SÍ funciona ahora?
**Antes**: La BD estaba bloqueada por procesos que seguían corriendo.
**Ahora**: Primero detiene containers (`docker compose down`), LUEGO borra la BD.

### ¿Cómo desarrollo con hot reload?
**Todo sigue funcionando:**
- Backend: Uvicorn con `--reload`
- Frontend: Vite con HMR
- Los volumes montan tu código local en los containers

### ¿Puedo seguir usando los comandos viejos?
**NO. Han sido reemplazados:**
- ❌ `make dev` → ✅ `make up`
- ❌ `make dev-stop` → ✅ `make down`
- ❌ `make force-reset` → ✅ `make reset-db`
- ❌ `make dev-docker` → ✅ `make up`

---

## 📁 ESTRUCTURA DE DIRECTORIOS

```
testsDocumentationManagement/
├── docker-compose.yml       ← UN solo archivo
├── Makefile                 ← Comandos simples
├── .env                     ← Variables
│
├── backend/                 ← Código Python
├── frontend/                ← Código React
│
├── data/                    ← BD SQLite (local)
├── output/                  ← Archivos generados
├── uploads/                 ← Uploads Excel
├── logs/                    ← Logs Docker
│
├── Dockerfile.backend       ← Builds
├── Dockerfile.celery
└── frontend/Dockerfile
```

---

## 🎉 BENEFICIOS DE LA SIMPLIFICACIÓN

1. ✅ **Comandos que FUNCIONAN**: `make down` realmente detiene TODO
2. ✅ **Reset de BD funciona**: Detiene servicios ANTES de borrar
3. ✅ **Un solo archivo**: docker-compose.yml para dev y prod
4. ✅ **Fácil de entender**: 5 comandos básicos
5. ✅ **Sin procesos huérfanos**: Docker maneja todo
6. ✅ **Escalable**: Mismo setup para producción

---

**Siguiente paso**: ¿Listo para probar? Ejecuta `make up`

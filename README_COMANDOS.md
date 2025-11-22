# 🚀 Comandos Simplificados - UN SOLO COMANDO para TODO

**Ahora puedes iniciar TODO con un solo comando usando el `Makefile`**

---

## ⚡ Quick Start (Primera vez)

```bash
# 1. Configuración inicial (solo la primera vez)
make setup

# 2. Editar .env y agregar tu GEMINI_API_KEY
nano .env  # o tu editor favorito

# 3. Iniciar TODOS los servicios
make dev
```

**¡ESO ES TODO!** 🎉

En **10 segundos** tienes:
- ✅ Redis corriendo
- ✅ Celery Worker procesando
- ✅ Backend en http://localhost:8000
- ✅ Frontend en http://localhost:5173

---

## 📋 Comandos Principales

### Desarrollo Local (Recomendado)

```bash
# Iniciar TODO en un solo comando
make dev

# Detener todo
make dev-stop

# Ver estado de servicios
make status
```

### Desarrollo con Docker (Todo containerizado)

```bash
# Iniciar TODO en Docker
make dev-docker

# Detener
make dev-docker-stop

# Rebuild si cambiaste Dockerfiles
make dev-docker-rebuild

# Ver logs
make logs
```

### Otros Comandos Útiles

```bash
# Ver ayuda (lista todos los comandos)
make help

# Verificar que todo esté listo
make check

# Limpiar archivos temporales
make clean

# Resetear base de datos
make db-reset

# Ver logs específicos
make logs-backend
make logs-celery
make logs-frontend
```

---

## 🆚 Comparación de Opciones

| Opción | Comando | Ventajas | Desventajas |
|--------|---------|----------|-------------|
| **make dev** | `make dev` | ✅ Más rápido<br>✅ Hot reload inmediato<br>✅ Debugging fácil | ❌ Requiere 4 procesos<br>❌ Más dependencias locales |
| **make dev-docker** | `make dev-docker` | ✅ Todo containerizado<br>✅ Ambiente aislado<br>✅ Un solo comando | ❌ Hot reload más lento<br>❌ Más uso de recursos |

**Recomendación**: Usa `make dev` para desarrollo diario, `make dev-docker` para probar en ambiente similar a producción.

---

## 📊 Verificar que TODO esté corriendo

```bash
make status
```

**Output esperado**:
```
╔════════════════════════════════════════════════════════════════╗
║                    Estado de Servicios                         ║
╚════════════════════════════════════════════════════════════════╝

🐳 Docker Containers:
NAMES           STATUS          PORTS
qa_redis        Up 5 minutes    0.0.0.0:6379->6379/tcp

🔄 Celery Workers:
✅ Celery worker running

🐍 Backend:
✅ Backend running

⚛️  Frontend:
✅ Frontend running
```

---

## 🛑 Detener Servicios

### Opción 1: Detener todo (local)
```bash
make dev-stop
```

Esto detiene:
- Redis (Docker)
- Celery Worker
- Backend
- Frontend

### Opción 2: Detener solo Docker
```bash
make dev-docker-stop
```

### Opción 3: Manual (si algo no responde)
```bash
# Redis
docker-compose down

# Celery
pkill -f celery

# Backend
pkill -f uvicorn

# Frontend
pkill -f vite
```

---

## 📋 Ver Logs

### Opción 1: Logs en tiempo real (local)
```bash
# Todos los logs juntos
tail -f logs/*.log

# Log específico
tail -f logs/celery.log
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Opción 2: Logs de Docker
```bash
# Todos
make logs

# Específico
make logs-backend
make logs-celery
make logs-frontend
```

---

## 🔧 Comandos Avanzados

### Base de Datos

```bash
# Correr migraciones
make db-migrate

# Resetear BD (⚠️ BORRA DATOS)
make db-reset
```

### Redis

```bash
# Solo iniciar Redis
make redis-start

# Abrir Redis CLI
make redis-cli

# Ejemplo de uso en CLI:
# > KEYS *
# > GET celery-task-meta-<task_id>
```

### Celery

```bash
# Ver tareas activas
make celery-status

# Iniciar solo Celery Worker (sin todo lo demás)
make celery-start
```

### Testing

```bash
# Correr todos los tests
make test

# Solo backend
make test-backend

# Solo frontend
make test-frontend
```

---

## 🐛 Troubleshooting

### "make: command not found"

**Problema**: Make no está instalado

**Solución**:
```bash
# Ubuntu/Debian
sudo apt-get install make

# macOS
xcode-select --install

# Windows (WSL)
sudo apt-get install make
```

### Servicios no inician

```bash
# 1. Verificar configuración
make check

# 2. Ver logs para encontrar el error
tail -f logs/*.log

# 3. Limpiar y reiniciar
make clean
make dev
```

### Puerto 8000 o 5173 ya en uso

```bash
# Ver qué está usando el puerto
lsof -i :8000
lsof -i :5173

# Matar el proceso
kill <PID>

# O cambiar puerto en el código
```

### Redis no se conecta

```bash
# Verificar que Docker esté corriendo
docker ps

# Reiniciar Redis
docker-compose restart redis

# Ver logs de Redis
docker logs qa_redis
```

---

## 📂 Estructura de Archivos de Configuración

```
/
├── Makefile                    ← Comandos simplificados
├── docker-compose.yml          ← Redis + Celery (parcial)
├── docker-compose.full.yml     ← Todo (Redis + Celery + Backend + Frontend)
├── Dockerfile.backend          ← Container del backend
├── Dockerfile.celery           ← Container de Celery worker
├── frontend/
│   └── Dockerfile              ← Container del frontend
├── scripts/
│   └── dev-start.sh            ← Script que inicia servicios locales
├── logs/                       ← Logs de servicios (creado automáticamente)
│   ├── celery.log
│   ├── backend.log
│   └── frontend.log
└── .env                        ← Configuración (copiar de .env.example)
```

---

## ❓ ¿Por qué hay Dockerfiles separados?

### Respuesta Técnica

**Backend y Frontend usan stacks tecnológicos diferentes**:

```dockerfile
# Dockerfile.backend (Python)
FROM python:3.11-slim
RUN pip install ...
CMD ["uvicorn", "main:app"]

# frontend/Dockerfile (Node.js)
FROM node:18-alpine
RUN npm install ...
CMD ["npm", "run", "dev"]
```

**No pueden compartir el mismo Dockerfile** porque:
- Python vs Node.js (diferentes runtimes)
- pip vs npm (diferentes package managers)
- uvicorn vs vite (diferentes servers)

### Ubicación de Dockerfiles

**✅ Correcto** (como está ahora):
```
/Dockerfile.backend     ← Raíz (context: .)
/Dockerfile.celery      ← Raíz (context: ., comparte código con backend)
/frontend/Dockerfile    ← Dentro de frontend/ (context: ./frontend)
```

**¿Por qué?**
- `Dockerfile.backend` y `Dockerfile.celery` comparten el código de `/backend`
- `frontend/Dockerfile` solo necesita `/frontend`

---

## 🎯 Flujo de Trabajo Recomendado

### Día a día (Desarrollo)

```bash
# Mañana
make dev              # Inicia todo

# ... trabajar ...

# Tarde
make dev-stop         # Detiene todo
```

### Testing antes de commit

```bash
make test             # Corre tests
make check            # Verifica configuración
git add .
git commit -m "..."
```

### Probar en Docker (staging)

```bash
make dev-docker       # Todo en containers
# ... probar ...
make dev-docker-stop
```

---

## 🚀 Comparación: Antes vs. Ahora

### ❌ ANTES (Manual, 4 terminales)

**Terminal 1**:
```bash
docker-compose up redis -d
```

**Terminal 2**:
```bash
export PYTHONPATH=$(pwd)
celery -A backend.celery_app worker --loglevel=info --concurrency=4
```

**Terminal 3**:
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 4**:
```bash
cd frontend
npm run dev
```

**Tiempo**: 2-3 minutos ⏱️

---

### ✅ AHORA (Un solo comando)

```bash
make dev
```

**Tiempo**: 10 segundos ⚡

**Output**:
```
╔════════════════════════════════════════════════════════════════╗
║         Quality Mission Control - Development Start           ║
╚════════════════════════════════════════════════════════════════╝

[1/4] Iniciando Redis (Docker)...
      ✅ Redis iniciado

[2/4] Iniciando Celery Worker...
      ✅ Celery Worker iniciado (PID: 12345)
      📋 Logs: tail -f logs/celery.log

[3/4] Iniciando Backend (FastAPI)...
      ✅ Backend iniciado (PID: 12346)
      🌐 http://localhost:8000
      📋 Logs: tail -f logs/backend.log

[4/4] Iniciando Frontend (React + Vite)...
      ✅ Frontend iniciado (PID: 12347)
      🌐 http://localhost:5173
      📋 Logs: tail -f logs/frontend.log

╔════════════════════════════════════════════════════════════════╗
║                   ✅ Todos los servicios iniciados              ║
╚════════════════════════════════════════════════════════════════╝

🌐 URLs:
   Frontend:  http://localhost:5173
   Backend:   http://localhost:8000
   API Docs:  http://localhost:8000/docs

🛑 Para detener:
   make dev-stop

Happy coding! 🚀
```

---

## 📚 Documentación Adicional

- **QUICKSTART.md** - Guía de 5 minutos para probar
- **DEPLOYMENT_GUIDE.md** - Opciones de producción (Docker Compose, K8s, Cloud)
- **CELERY_REDIS_SETUP.md** - Detalles técnicos de Celery + Redis

---

## 🎉 Resumen

| Tarea | Comando Antiguo | Comando Nuevo |
|-------|----------------|---------------|
| **Setup inicial** | Múltiples pasos manuales | `make setup` |
| **Iniciar desarrollo** | 4 terminales separadas | `make dev` |
| **Detener todo** | Cerrar 4 terminales | `make dev-stop` |
| **Ver estado** | `docker ps`, `ps aux \| grep...` | `make status` |
| **Ver logs** | `tail -f ...`, `docker logs ...` | `make logs` |
| **Tests** | `cd backend && pytest && cd ...` | `make test` |
| **Limpiar** | `rm -rf __pycache__ ...` | `make clean` |

**¡Ahora tienes UN SOLO COMANDO para TODO! 🚀**

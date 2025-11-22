# 🚀 QUICKSTART - Probar Celery + Redis en 5 minutos

**Objetivo**: Probar la nueva funcionalidad de generación en background AHORA

---

## 📦 ¿Qué necesitas instalar?

### Prerequisitos Mínimos

```bash
# 1. Docker (solo para Redis)
docker --version  # Cualquier versión reciente

# 2. Python 3.11+ con pip
python --version

# 3. Node.js 18+
node --version
```

---

## ⚡ Setup Más Rápido (Local - Recomendado para testing)

### Paso 1: Configurar .env

```bash
# En la raíz del proyecto
cp .env.example .env

# Editar .env y agregar tu API key de Gemini
# Línea 13:
GEMINI_API_KEY=tu_api_key_real_aqui
```

**¿No tienes API key?** → https://makersuite.google.com/app/apikey

---

### Paso 2: Instalar dependencias

```bash
# Backend (incluye celery y redis)
pip install -r requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

---

### Paso 3: Iniciar servicios (4 terminales)

**Terminal 1: Redis (Docker)**
```bash
docker-compose up redis -d

# Verificar que esté corriendo
docker ps | grep redis
# Expected: qa_redis ... Up ... 6379/tcp
```

**Terminal 2: Celery Worker**
```bash
# IMPORTANTE: Set PYTHONPATH
export PYTHONPATH=$(pwd)

# Start worker
celery -A backend.celery_app worker --loglevel=info --concurrency=4
```

**Deberías ver**:
```
 -------------- celery@hostname v5.3.4
 ...
[tasks]
  . backend.tasks.generate_test_cases_task

[... celery ready.]
```

**Terminal 3: Backend (FastAPI)**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Deberías ver**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Terminal 4: Frontend (React)**
```bash
cd frontend
npm run dev
```

**Deberías ver**:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

---

### Paso 4: Probar la Aplicación

1. **Abrir navegador**: http://localhost:5173

2. **Ir a Stories**:
   - Si la BD está vacía, primero crea un proyecto
   - Luego upload un Excel con user stories
   - O usa las stories de ejemplo

3. **Generar Test Cases**:
   - Click en "Generar Tests" para cualquier user story
   - Configurar (5 test cases, 3 scenarios)
   - Click "**Encolar Generación**"

4. **✅ Verificar el comportamiento nuevo**:
   ```
   ✅ Modal se cierra INMEDIATAMENTE (antes se quedaba bloqueado)
   ✅ Toast notification: "Test Generation Queued!"
   ✅ Badge aparece en la tabla: "En cola"
   ✅ Badge cambia a: "Generando 30%" (con spinner)
   ✅ Badge cambia a: "Generando 60%"
   ✅ Badge cambia a: "Listo para revisar" (verde)
   ✅ Toast: "Test Cases Generated! Ready for..."
   ```

5. **Revisar Test Cases**:
   - Click en el badge "Listo para revisar"
   - Se abre modal con los test cases generados
   - Puedes editar/eliminar antes de guardar
   - Click "Save All"

---

## 🧪 Test de Funcionalidad

### Test 1: Generación Simple

```bash
# En la UI:
1. Ir a /stories
2. Click "Generar Tests" en US-001
3. Configurar: 3 test cases, 2 scenarios
4. Click "Encolar Generación"
5. RESULTADO ESPERADO:
   - Modal cierra en <1 segundo
   - Badge "En cola" aparece
   - En ~10-15 segundos → Badge "Listo para revisar"
```

### Test 2: Generación en Paralelo (múltiples stories)

```bash
# En la UI:
1. Click "Generar Tests" en US-001 → Encolar
2. Click "Generar Tests" en US-002 → Encolar
3. Click "Generar Tests" en US-003 → Encolar
4. RESULTADO ESPERADO:
   - Las 3 stories muestran badge "En cola"
   - Todas se procesan EN PARALELO
   - Progreso independiente en cada badge
```

### Test 3: Error Handling

```bash
# En la UI:
1. Click "Generar Tests" en una story sin project_id
2. RESULTADO ESPERADO:
   - Toast error: "Este User Story no está asociado a un proyecto"
   - No se crea badge
```

---

## 🔍 Verificar Logs

### Backend Logs
```bash
# Terminal del Backend debería mostrar:
📋 Queued test generation task: abc123... for story US-001
```

### Celery Worker Logs
```bash
# Terminal del Celery Worker debería mostrar:
📦 Generating 15 scenarios in 1 PARALLEL batches...
   🚀 Batch 1/1: Starting 15 scenarios...
   ✅ Batch 1/1: Got 15 scenarios
✅ Generated 15/15 scenarios in parallel
Task backend.tasks.generate_test_cases_task[abc123] succeeded
```

### Frontend DevTools
```bash
# Abrir DevTools → Network tab
# Deberías ver requests cada 2 segundos:
GET /api/v1/generate-test-cases/status/abc123
```

---

## 🐛 Troubleshooting

### Redis no está corriendo
```bash
# Error: "ConnectionRefusedError: [Errno 111] Connection refused"

# Solución:
docker-compose up redis -d
docker ps | grep redis  # Verificar que esté running
```

### Celery Worker no procesa tareas
```bash
# Verificar que esté corriendo
ps aux | grep celery

# Si no está corriendo:
export PYTHONPATH=$(pwd)
celery -A backend.celery_app worker --loglevel=debug
```

### Badge no actualiza
```bash
# Verificar en DevTools → Console
# No debe haber errores

# Verificar en DevTools → Network
# Debe haber requests cada 2s a /status/{task_id}

# Si no hay requests:
# 1. Refrescar la página
# 2. Verificar que useTestGenerationPolling() esté en App.tsx
```

### "Task is waiting to start..." forever
```bash
# Significa que Celery Worker no está corriendo

# Solución:
# 1. Verificar Terminal 2 (Celery Worker)
# 2. Reiniciar worker si es necesario
```

---

## 🆚 Alternativa: Docker Compose Completo

Si prefieres TODO en Docker (más limpio pero más lento para desarrollo):

```bash
# 1. Configurar .env (igual que arriba)
cp .env.example .env
# Editar GEMINI_API_KEY

# 2. Iniciar TODO
docker-compose -f docker-compose.full.yml up -d

# 3. Ver logs
docker-compose -f docker-compose.full.yml logs -f

# 4. Abrir http://localhost:5173
```

**Pros**:
- ✅ Todo containerizado
- ✅ Un solo comando

**Cons**:
- ❌ Hot reload más lento
- ❌ Más uso de recursos
- ❌ Debugging más difícil

---

## ✅ Checklist de Verificación

Después de seguir los pasos, verifica:

- [ ] Redis está corriendo (docker ps | grep redis)
- [ ] Celery Worker está corriendo y muestra "celery ready"
- [ ] Backend está corriendo en http://localhost:8000
- [ ] Frontend está corriendo en http://localhost:5173
- [ ] Puedes encolar generación de tests
- [ ] Badge muestra progreso
- [ ] Toast notifications funcionan
- [ ] Puedes revisar y guardar test cases

---

## 🎯 Próximos Pasos

### Después de probar localmente:

1. **Leer DEPLOYMENT_GUIDE.md** para opciones de producción
2. **Leer CELERY_REDIS_SETUP.md** para detalles técnicos
3. **Decidir arquitectura** según tu escala (ver tabla de comparación)

### Recomendaciones:

- **MVP/Testing**: Usar setup local (este documento)
- **Primeros clientes**: Migrar a Cloud Run o ECS Fargate
- **Crecimiento**: Migrar a Kubernetes

---

## 📞 ¿Necesitas ayuda?

1. Verifica los logs de Celery Worker
2. Verifica los logs del Backend
3. Verifica DevTools → Console y Network
4. Lee CELERY_REDIS_SETUP.md → Troubleshooting

---

**🎉 ¡Listo! Ahora tienes generación de test cases en background con Celery + Redis funcionando!**

**Tiempo estimado**: 10-15 minutos para setup + 5 minutos para probar

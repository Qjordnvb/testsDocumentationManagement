# 🧹 LIMPIAR CACHE DEL NAVEGADOR - Guía Completa

## ⚠️ Problema

Tu base de datos está vacía pero el frontend muestra datos antiguos porque:

1. **Service Worker** tiene la app cacheada
2. **localStorage** tiene estado viejo de React/Zustand
3. **sessionStorage** tiene datos de sesión anteriores
4. **HTTP cache** tiene responses antiguas del backend

---

## ✅ SOLUCIÓN COMPLETA

### Paso 1: Limpiar Cache y Storage (CUALQUIER NAVEGADOR)

#### Chrome/Edge/Brave:

1. Abre DevTools: **F12** o **Ctrl+Shift+I** (Windows) / **Cmd+Option+I** (Mac)

2. **Application Tab**:
   - Sidebar izquierdo → "Storage"
   - Click en **"Clear site data"**
   - Marca TODAS las opciones:
     - ✅ Local storage
     - ✅ Session storage
     - ✅ IndexedDB
     - ✅ Cookies
     - ✅ Cache storage
   - Click **"Clear site data"**

3. **Service Workers**:
   - Application → Service Workers (sidebar)
   - Si ves workers registrados: Click **"Unregister"**

4. **Hard Reload**:
   - **Ctrl+Shift+R** (Windows) / **Cmd+Shift+R** (Mac)
   - O: DevTools abierto → Click derecho en reload → **"Empty Cache and Hard Reload"**

#### Firefox:

1. Abre DevTools: **F12** o **Ctrl+Shift+I** (Windows) / **Cmd+Option+I** (Mac)

2. **Storage Tab**:
   - Click en cada item del sidebar y eliminar:
     - Local Storage → Click derecho → Delete All
     - Session Storage → Click derecho → Delete All
     - Indexed DB → Click derecho → Delete All
     - Cache Storage → Click derecho → Delete All

3. **Service Workers**:
   - Abre: `about:serviceworkers`
   - Unregister todos los workers de localhost:3000

4. **Hard Reload**:
   - **Ctrl+Shift+R** (Windows) / **Cmd+Shift+R** (Mac)

#### Safari:

1. DevTools: **Cmd+Option+I**

2. Storage Tab → Limpiar:
   - Local Storage → Delete
   - Session Storage → Delete
   - Cache → Delete

3. Hard Reload: **Cmd+Option+R**

---

### Paso 2: Modo Incógnito (VERIFICACIÓN RÁPIDA)

Para verificar que es problema de cache:

1. Abre ventana incógnita/privada:
   - Chrome: **Ctrl+Shift+N** (Windows) / **Cmd+Shift+N** (Mac)
   - Firefox: **Ctrl+Shift+P** (Windows) / **Cmd+Shift+P** (Mac)

2. Ve a: `http://localhost:3000`

3. **¿Qué esperar?**
   - Si servicios están DETENIDOS → Error "Cannot connect"
   - Si servicios están CORRIENDO con BD vacía → "No projects found"

---

### Paso 3: Limpiar desde la Terminal (AUTOMÁTICO)

```bash
# Para Chrome/Chromium (Linux/Mac)
# ADVERTENCIA: Esto cierra Chrome y limpia TODO el cache
pkill -9 chrome

# Eliminar cache de localhost:3000
# Linux:
rm -rf ~/.config/google-chrome/Default/Service\ Worker/
rm -rf ~/.config/google-chrome/Default/Cache/

# Mac:
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Service\ Worker/
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Cache/
```

---

## 🚀 Flujo Correcto (Desde Cero)

```bash
# 1. Detener TODO y limpiar base de datos
make force-reset

# 2. Verificar que base de datos está vacía
make db-status
# Debería mostrar: Projects: 0, User Stories: 0

# 3. Crear proyectos de ejemplo
make db-create-samples

# 4. Verificar que proyectos se crearon
make db-status
# Debería mostrar: Projects: 3

# 5. Iniciar servicios
make dev
```

**ANTES de abrir navegador**:
- Espera 10-15 segundos a que servicios inicien completamente
- Verifica: `lsof -i :3000` → Debería mostrar proceso node/vite

**En el navegador**:
1. Abre DevTools (F12)
2. Network tab → Marca "Disable cache"
3. Abre: `http://localhost:3000`
4. **DEBERÍAS VER**: "3 proyectos" (PROJ-001, PROJ-002, PROJ-003)

---

## 🔍 Cómo Verificar que NO es Cache

### Test 1: Verificar API directamente

```bash
# Verificar que backend responde
curl http://localhost:8000/api/v1/projects

# Deberías ver: {"projects": [...]} con 3 proyectos
```

### Test 2: Ver localStorage del navegador

1. DevTools → Console tab
2. Escribe:
```javascript
// Ver localStorage
console.log(localStorage);

// Limpiar localStorage
localStorage.clear();

// Ver si hay Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
  regs.forEach(reg => reg.unregister());
});

// Recargar página
location.reload();
```

### Test 3: Network Tab

1. DevTools → Network tab
2. Marca "Disable cache"
3. Recarga página (Ctrl+R)
4. **Busca requests a**: `/api/v1/projects`
5. **Verifica**:
   - Status: 200 (no 304 Not Modified)
   - Response: Debe mostrar datos actuales de BD

---

## ❓ FAQ

**Q: ¿Por qué pasa esto?**
A: React apps modernas usan Service Workers y localStorage para performance. Cuando limpias la BD pero no el navegador, siguen mostrando datos viejos.

**Q: ¿Cómo evitarlo en desarrollo?**
A: Siempre trabaja con DevTools abierto y "Disable cache" marcado.

**Q: ¿Cómo sé si es cache o un bug?**
A: Abre modo incógnito. Si ahí funciona bien = es cache. Si sigue mal = es bug.

**Q: ¿Cuándo NO es cache?**
A: Si mode incógnito muestra lo mismo Y los servicios están corriendo → Es un bug real en el código.

---

## 🎯 Checklist Final

Antes de reportar un bug, verifica:

- [ ] `make db-status` muestra los datos esperados
- [ ] `curl http://localhost:8000/api/v1/projects` muestra datos correctos
- [ ] `lsof -i :3000` muestra que frontend está corriendo
- [ ] `lsof -i :8000` muestra que backend está corriendo
- [ ] DevTools → Network → "Disable cache" está marcado
- [ ] Hard reload (Ctrl+Shift+R) ejecutado
- [ ] localStorage.clear() ejecutado en consola
- [ ] Service Workers unregistered
- [ ] Modo incógnito probado

Si TODO lo anterior está bien y sigue fallando → Es un bug real.

---

**TL;DR**:
```bash
# En terminal
make force-reset
make db-create-samples
make dev

# En navegador (DevTools abierto)
localStorage.clear()
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))
location.reload()
```

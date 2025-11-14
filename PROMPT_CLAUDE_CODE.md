# 🚀 Prompt para Claude Code (Navegador Web)

## 📋 Contexto Rápido

Este es el prompt optimizado para continuar el desarrollo del proyecto **QA Flow** usando Claude Code en el navegador.

---

## 💬 PROMPT COMPLETO (Copiar y Pegar)

```markdown
Hola! Lee el archivo `PROYECTO_REDEFINICION.md` para entender el contexto completo del proyecto.

**Proyecto:** QA Flow - Sistema de gestión QA con interfaz web propia

**Estado actual:**
✅ Backend funcional (Python 3.11 + FastAPI + SQLite + Gemini AI)
✅ Parser Excel robusto (detecta columnas automáticamente)
✅ Generadores (PDF, Word, Markdown, Gherkin)
✅ Base de datos SQLite con SQLAlchemy
✅ API REST completa (15+ endpoints)
✅ CLI funcional
❌ Frontend web (por crear)

**Mi objetivo:**
Crear la interfaz web (frontend/) que:
- Gestione proyectos QA completos
- Use el backend existente (API REST)
- Siga los mockups detallados del documento
- Permita workflow completo: subir Excel → generar tests con IA → exportar reportes

---

## 📚 Documentos Clave:

Lee estos archivos en este orden:
1. `PROYECTO_REDEFINICION.md` ⭐ (contiene todo: casos de uso, mockups, demo, plan)
2. `.claude.md` (contexto técnico del proyecto)
3. `HANDOFF_DOCUMENT.md` (guía de qué funciona y qué crear)

---

## ✅ LO QUE SÍ HACE EL SISTEMA:

- ✅ Gestión de User Stories (CRUD)
- ✅ Generación de test cases con Gemini AI
- ✅ Dashboard con métricas en tiempo real
- ✅ Exportación a PDF/Word/Markdown
- ✅ Gestión de bugs vinculados a tests
- ✅ Parser flexible de Excel/CSV
- ✅ Base de datos local (sin cloud)

---

## ❌ LO QUE NO HACE (Límites del Alcance):

- ❌ NO ejecuta tests automáticamente (Selenium/Playwright)
- ❌ NO es un test runner
- ❌ NO gestiona CI/CD pipelines
- ❌ NO reemplaza Jira para gestión de sprints
- ❌ NO provisiona infraestructura

**ENFOQUE:** Documentación y organización del proceso QA

---

## 🎯 Instrucción Específica:

Crea el frontend siguiendo el **Plan de Implementación - Fase 2** en `PROYECTO_REDEFINICION.md`:

1. **Estructura base:**
   - `frontend/index.html` (página principal)
   - `frontend/css/style.css` (estilos)
   - `frontend/js/app.js` (lógica)
   - `frontend/js/api.js` (llamadas a backend)

2. **Componentes principales:**
   - Sidebar de navegación (Projects, Stories, Tests, Bugs, Reports)
   - Dashboard con métricas (cards con números)
   - Sección para subir Excel (drag & drop)
   - Vista de User Stories (tabla interactiva)

3. **Conectar con API existente:**
   - Base URL: `http://localhost:8000/api`
   - Endpoints documentados en `HANDOFF_DOCUMENT.md`

4. **Diseño:**
   - Moderno y limpio
   - Usar los mockups ASCII de `PROYECTO_REDEFINICION.md` como referencia
   - Responsivo (desktop first, luego mobile)
   - Colores: Azul primario, grises neutrales, verde para success, rojo para errors

---

## 🚦 Por dónde empezar:

Empieza con la **estructura base** y el **dashboard principal**.

Específicamente:
1. Crea `frontend/index.html` con estructura básica (sidebar + área principal)
2. Crea `frontend/css/style.css` con estilos base
3. Crea `frontend/js/app.js` que se conecte a `/api/stats` para mostrar métricas
4. Muestra el dashboard con datos reales del backend

Usa **HTML + CSS + Vanilla JavaScript** (sin frameworks).

---

¿Por dónde comenzamos?
```

---

## 🎯 Alternativas Más Cortas

### **Versión Corta (Si Claude ya conoce el proyecto):**

```markdown
Lee `PROYECTO_REDEFINICION.md` y ayúdame a crear el frontend del proyecto QA Flow.

El backend (FastAPI + SQLite + Gemini AI) ya funciona.

Necesito crear `frontend/` siguiendo:
- Mockups en § "Mockups Detallados de Interfaz"
- Plan en § "Fase 2: Frontend Base"

Empieza con estructura HTML base + Dashboard conectado a la API.

¿Por dónde empezamos?
```

### **Versión Súper Corta (Si Claude tiene TODO el contexto):**

```markdown
Implementa Fase 2 de `PROYECTO_REDEFINICION.md`: crear frontend/ del QA Flow.

Backend funcional en `http://localhost:8000/api`

Empieza con dashboard + sidebar.
```

---

## 📌 Notas Importantes:

1. **Siempre menciona `PROYECTO_REDEFINICION.md` primero** para que Claude cargue TODO el contexto

2. **Claude leerá automáticamente:**
   - Casos de uso (positivos y negativos)
   - Mockups detallados (5 pantallas)
   - Demo completa (Día 1, 2, 3)
   - Plan de implementación

3. **Si Claude se desvía del plan:**
   - Recuérdale: "Sigue los mockups de PROYECTO_REDEFINICION.md § Mockups Detallados"
   - Referencia secciones específicas

4. **Validación continua:**
   - Pide ver el resultado en cada paso
   - Prueba con el backend real
   - Valida contra los mockups

---

## ✅ Checklist de Éxito:

Sabrás que está funcionando cuando:

- [ ] Puedes abrir `http://localhost:8000` y ver el dashboard
- [ ] El dashboard muestra datos reales de la API (`/api/stats`)
- [ ] Puedes navegar entre secciones (Projects, Stories, Tests, Bugs)
- [ ] Puedes subir un Excel y ver las User Stories parseadas
- [ ] Puedes generar test cases con el botón "Generar con IA"
- [ ] Dashboard se actualiza en tiempo real

---

## 🚀 ¡Listo para copiar y usar!

Copia el **PROMPT COMPLETO** de arriba y pégalo en Claude Code (navegador web).

Claude tendrá TODO lo necesario para empezar a construir el frontend. 🎯

# Restricciones DEV Pendientes

**Estado**: Backend 100% completo, Frontend parcialmente completo

## ✅ Backend Completado

1. **GET /projects?assigned_to=email** - Filtra proyectos por bugs asignados al dev
2. **PATCH /bugs/{id}/dev-update** - Endpoint restrictivo para devs (solo status, fix_description, screenshots)
   - Estados permitidos: IN_PROGRESS, FIXED, TESTING
   - Auto-actualiza fixed_date cuando status=FIXED

## ✅ Frontend Completado

1. **bugApi.devUpdate()** - Método para PATCH /bugs/{id}/dev-update
2. **projectApi.getAll(assignedTo)** - Filtrado opcional por usuario
3. **Sidebar.tsx** - Filtra proyectos para dev usando `projectApi.getAll(user.email)`

## ⏳ Frontend Pendiente (Requiere Implementación)

### 1. BugDetailsPage (`frontend/src/pages/BugDetailsPage/index.tsx`)

**Cambios necesarios:**

```typescript
import { useAuth } from '@/app/providers';

// Dentro del componente:
const { hasRole } = useAuth();
const isDev = hasRole('dev');

// Modificar handleStatusChange para usar bugApi.devUpdate() si es dev:
const handleStatusChange = async (newStatus: BugStatus) => {
  if (!bug || !bugId) return;
  try {
    setUpdatingStatus(true);
    const updated = isDev
      ? await bugApi.devUpdate(bugId, { status: newStatus })
      : await bugApi.updateStatus(bugId, newStatus);
    setBug(updated);
    toast.success(`Estado actualizado a ${newStatus}`);
  } catch (err: any) {
    console.error('Error updating bug status:', err);
    toast.error('Error al actualizar estado del bug');
  } finally {
    setUpdatingStatus(false);
  }
};

// Campos readonly para dev (añadir disabled={isDev} a los inputs):
// - title
// - description
// - steps_to_reproduce
// - expected_behavior
// - actual_behavior
// - severity
// - priority
// - bug_type
// - environment, browser, os, version
// - user_story_id, test_case_id
// - reported_by, assigned_to

// Campos editables para dev:
// - status dropdown (solo: In Progress, Fixed, Testing)
// - fix_description textarea
// - screenshots/attachments upload

// Botones a ocultar para dev:
// - Botón "Editar" completo (Edit button)
// - Botón "Eliminar" (si existe)
```

### 2. TestCasesPage (`frontend/src/pages/TestCasesPage/index.tsx`)

**Cambios necesarios:**

```typescript
import { useAuth } from '@/app/providers';

const { hasRole } = useAuth();
const isDev = hasRole('dev');

// Ocultar botón "Run Test" / "Ejecutar Test":
{!isDev && (
  <Button onClick={handleRunTest}>
    <PlayCircle size={16} />
    Ejecutar Test
  </Button>
)}

// Mantener visible: tabla de test cases, detalles, Gherkin viewer
```

### 3. StoriesPage (`frontend/src/pages/StoriesPage/StoriesPage.tsx`)

**Cambios necesarios:**

```typescript
import { useAuth } from '@/app/providers';

const { hasRole } = useAuth();
const isDev = hasRole('dev');

// Ocultar sección de Acceptance Criteria:
{!isDev && (
  <div className="acceptance-criteria-section">
    <h3>Criterios de Aceptación ({story.total_criteria})</h3>
    {/* ... criterios ... */}
  </div>
)}

// Mantener visible: lista de stories, títulos, descripciones, estados
```

### 4. ProjectsListPage (`frontend/src/pages/ProjectsListPage/index.tsx`)

**Cambios necesarios:**

```typescript
import { useAuth } from '@/app/providers';

const { user, hasRole } = useAuth();
const isDev = hasRole('dev');

// Cargar proyectos filtrados para dev:
useEffect(() => {
  const loadProjects = async () => {
    try {
      setLoading(true);
      const filterByUser = isDev ? user?.email : undefined;
      const data = await projectApi.getAll(filterByUser);
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };
  loadProjects();
}, [isDev, user]);

// Mostrar mensaje si dev no tiene bugs asignados:
{projects.length === 0 && isDev && (
  <div className="text-center py-12">
    <p className="text-gray-600">
      No tienes bugs asignados en ningún proyecto
    </p>
  </div>
)}
```

## 📋 Checklist de Testing

Después de implementar los cambios:

- [ ] Login como dev
- [ ] Verificar que solo aparecen proyectos con bugs asignados
- [ ] Abrir bug details y verificar campos readonly
- [ ] Verificar que solo se puede editar: status, fix_description, screenshots
- [ ] Verificar que estados permitidos son: In Progress, Fixed, Testing
- [ ] Ir a Test Cases y verificar que NO aparece botón "Ejecutar"
- [ ] Ir a User Stories y verificar que NO aparecen criterios de aceptación
- [ ] Logout y login como QA para verificar que TODO funciona normal

## 🔐 Roles Summary

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Solo gestión de usuarios (/admin/users, /admin/dashboard) |
| **MANAGER** | Solo métricas (/manager/dashboard) - read-only |
| **DEV** | Proyectos con bugs asignados, editar solo bug status/fix/evidencia |
| **QA** | Acceso completo a proyectos (default, sin restricciones) |

## 📝 Notas

- Todos los cambios de backend YA ESTÁN IMPLEMENTADOS y funcionan
- Los endpoints están probados y documentados
- Solo falta aplicar las restricciones en la UI del frontend
- La lógica de filtrado ya funciona en Sidebar
- Estimated time to complete: 30-45 minutos

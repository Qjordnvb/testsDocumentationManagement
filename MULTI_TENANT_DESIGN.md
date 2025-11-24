# Multi-Tenant Architecture Design

**Fecha**: 2025-11-23
**Objetivo**: Implementar aislamiento completo entre organizaciones
**Patrón**: Shared Database + Tenant ID (Row-Level Security)

---

## 🎯 Problema a Resolver

### Escenario Actual
- Sistema diseñado para un solo tenant
- Admin ve todos los datos sin importar la organización
- Sin aislamiento entre empresas

### Escenario Deseado
- Múltiples empresas (tenants) usando el mismo sistema
- Cada organización ve SOLO sus datos
- Admin de Empresa A no puede ver datos de Empresa B

---

## 🏗️ Arquitectura Propuesta

### Patrón: Shared Database + Tenant ID

**Ventajas**:
- ✅ Más simple que schemas separados
- ✅ Costos de infraestructura optimizados
- ✅ Backups y mantenimiento centralizados
- ✅ Escalable horizontalmente

**Desventajas** (mitigadas):
- ⚠️ Riesgo de data leak (mitigado con múltiples capas)
- ⚠️ Queries más complejas (mitigado con base service)

---

## 📊 Modelo de Datos

### 1. Nueva Tabla: `organizations`

```sql
CREATE TABLE organizations (
    id VARCHAR PRIMARY KEY,              -- "ORG-001", "ORG-002"
    name VARCHAR NOT NULL,               -- "Acme Corp", "TechStart Inc"
    subdomain VARCHAR UNIQUE,            -- "acme", "techstart"
    domain VARCHAR,                      -- "acme.com" (email validation)

    -- Settings
    settings JSON,                       -- Logo, colors, etc.
    max_users INTEGER DEFAULT 50,
    max_projects INTEGER DEFAULT 100,

    -- Billing
    plan VARCHAR DEFAULT 'free',         -- free, pro, enterprise
    subscription_status VARCHAR,

    -- Security
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_date DATETIME DEFAULT NOW(),
    updated_date DATETIME DEFAULT NOW()
);
```

### 2. Modificaciones a Tablas Existentes

#### `users` table
```sql
ALTER TABLE users ADD COLUMN organization_id VARCHAR NOT NULL;
ALTER TABLE users ADD FOREIGN KEY (organization_id) REFERENCES organizations(id);
CREATE INDEX idx_users_org ON users(organization_id);

-- Composite unique constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ADD CONSTRAINT users_email_org_unique
    UNIQUE (email, organization_id);
```

#### `projects` table
```sql
ALTER TABLE projects ADD COLUMN organization_id VARCHAR NOT NULL;
ALTER TABLE projects ADD FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Cambiar PK a composite
ALTER TABLE projects DROP CONSTRAINT projects_pkey;
ALTER TABLE projects ADD PRIMARY KEY (id, organization_id);
```

#### `user_stories` table
```sql
ALTER TABLE user_stories ADD COLUMN organization_id VARCHAR NOT NULL;

-- Composite Foreign Key a projects
ALTER TABLE user_stories
    ADD FOREIGN KEY (project_id, organization_id)
    REFERENCES projects(id, organization_id);

-- Composite Primary Key
ALTER TABLE user_stories DROP CONSTRAINT user_stories_pkey;
ALTER TABLE user_stories
    ADD PRIMARY KEY (id, project_id, organization_id);
```

#### `test_cases` table
```sql
ALTER TABLE test_cases ADD COLUMN organization_id VARCHAR NOT NULL;

-- Composite Foreign Keys
ALTER TABLE test_cases
    ADD FOREIGN KEY (project_id, organization_id)
    REFERENCES projects(id, organization_id);

ALTER TABLE test_cases
    ADD FOREIGN KEY (user_story_id, project_id, organization_id)
    REFERENCES user_stories(id, project_id, organization_id);

-- Composite Primary Key
ALTER TABLE test_cases DROP CONSTRAINT test_cases_pkey;
ALTER TABLE test_cases
    ADD PRIMARY KEY (id, project_id, organization_id);
```

#### `bug_reports`, `test_executions`, etc.
- Seguir mismo patrón: agregar `organization_id`
- Composite Foreign Keys
- Composite Primary Keys

---

## 🔐 Capas de Seguridad (Defense in Depth)

### Capa 1: JWT con Organization ID
```python
# backend/auth/jwt.py
def create_access_token(user: UserDB) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "organization_id": user.organization_id,  # ← NUEVO
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")
```

### Capa 2: Tenant Context (Thread-Local)
```python
# backend/middleware/tenant_context.py
from contextvars import ContextVar

# Thread-safe context variable
_current_organization_id: ContextVar[str] = ContextVar("organization_id", default=None)

def get_current_organization_id() -> str:
    org_id = _current_organization_id.get()
    if not org_id:
        raise SecurityException("No organization context set")
    return org_id

def set_current_organization_id(org_id: str):
    _current_organization_id.set(org_id)
```

### Capa 3: Middleware de Validación
```python
# backend/middleware/tenant_middleware.py
from fastapi import Request, HTTPException
from backend.middleware.tenant_context import set_current_organization_id

async def tenant_middleware(request: Request, call_next):
    # Skip para rutas públicas
    if request.url.path in ["/login", "/health", "/docs"]:
        return await call_next(request)

    # Extraer organization_id del JWT
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)

    if not payload or "organization_id" not in payload:
        raise HTTPException(status_code=403, detail="No organization context")

    # Set context para toda la request
    set_current_organization_id(payload["organization_id"])

    response = await call_next(request)
    return response
```

### Capa 4: Base Service con Auto-Filtrado
```python
# backend/services/base_tenant_service.py
from abc import ABC
from sqlalchemy.orm import Session, Query
from backend.middleware.tenant_context import get_current_organization_id

class BaseTenantService(ABC):
    """
    Base service que automáticamente filtra por organization_id

    Principios:
    - Fail-safe: Si no hay org_id → Error
    - DRY: Filtrado centralizado
    - SRP: Solo maneja tenant isolation
    """

    def __init__(self, db: Session):
        self.db = db

    def _get_organization_id(self) -> str:
        """Get current organization ID with fail-safe"""
        return get_current_organization_id()  # Raises if not set

    def _filter_by_tenant(self, query: Query, model) -> Query:
        """
        Automatically add organization_id filter

        Usage:
            query = self.db.query(ProjectDB)
            query = self._filter_by_tenant(query, ProjectDB)
        """
        if not hasattr(model, 'organization_id'):
            raise ValueError(f"Model {model.__name__} doesn't have organization_id")

        return query.filter(model.organization_id == self._get_organization_id())

    def _ensure_tenant_match(self, entity, entity_name: str = "Entity"):
        """Validate entity belongs to current tenant"""
        if entity.organization_id != self._get_organization_id():
            raise PermissionError(
                f"{entity_name} does not belong to your organization"
            )
```

### Capa 5: Service Layer Refactorizado
```python
# backend/services/project_service.py (EJEMPLO)
class ProjectService(BaseTenantService):
    """
    Project service con tenant isolation automático
    Hereda de BaseTenantService
    """

    def get_all_projects(self) -> List[ProjectDB]:
        """Get all projects for current organization"""
        query = self.db.query(ProjectDB)
        query = self._filter_by_tenant(query, ProjectDB)  # Auto-filter
        return query.all()

    def get_project_by_id(self, project_id: str) -> ProjectDB:
        """Get project by ID (with tenant validation)"""
        project = self.db.query(ProjectDB).filter(
            ProjectDB.id == project_id,
            ProjectDB.organization_id == self._get_organization_id()  # Explicit
        ).first()

        if not project:
            raise ValueError("Project not found")

        return project

    def create_project(self, name: str, description: str) -> ProjectDB:
        """Create project for current organization"""
        project = ProjectDB(
            id=generate_id(),
            name=name,
            description=description,
            organization_id=self._get_organization_id()  # Auto-inject
        )
        self.db.add(project)
        self.db.commit()
        return project
```

---

## 🧪 Testing Strategy

### Test de Aislamiento
```python
def test_tenant_isolation():
    """Verify Org A cannot see Org B's data"""

    # Setup: Create 2 organizations
    org_a = create_organization("Acme Corp")
    org_b = create_organization("TechStart")

    # Create projects for each org
    with set_tenant_context(org_a.id):
        project_a = project_service.create_project("Project A")

    with set_tenant_context(org_b.id):
        project_b = project_service.create_project("Project B")

    # Test: Org A should NOT see Org B's project
    with set_tenant_context(org_a.id):
        projects = project_service.get_all_projects()
        assert len(projects) == 1
        assert projects[0].id == project_a.id

        # Try to access Org B's project directly → Should fail
        with pytest.raises(ValueError):
            project_service.get_project_by_id(project_b.id)
```

---

## 📋 Migration Plan

### Fase 1: Schema Migration
1. ✅ Create `organizations` table
2. ✅ Add `organization_id` to all tables
3. ✅ Create default organization for existing data
4. ✅ Update Foreign Keys to composite
5. ✅ Create indexes

### Fase 2: Backend Code
1. ✅ Implement `BaseTenantService`
2. ✅ Implement `TenantMiddleware`
3. ✅ Refactor services to extend `BaseTenantService`
4. ✅ Update JWT to include `organization_id`
5. ✅ Add tenant validation tests

### Fase 3: Frontend
1. ✅ Organization selector (if user has multiple orgs)
2. ✅ Store organization_id in auth context
3. ✅ Admin can only manage users in their org

### Fase 4: Admin Features
1. ✅ Super Admin role (can see all orgs)
2. ✅ Organization management UI
3. ✅ Billing integration

---

## 🔄 Rollback Plan

Si algo sale mal:
1. Mantener columnas `organization_id` como nullable inicialmente
2. Dual-write: escribir con y sin tenant_id durante transición
3. Feature flag para activar/desactivar tenant isolation
4. Backup completo antes de migración

---

## 📈 Performance Considerations

1. **Indexes**: Agregar índices compuestos
   ```sql
   CREATE INDEX idx_projects_org_id ON projects(organization_id, id);
   CREATE INDEX idx_users_org_id ON user_stories(organization_id, project_id);
   ```

2. **Query Optimization**: Evitar N+1 con eager loading
   ```python
   query.options(joinedload(ProjectDB.organization))
   ```

3. **Caching**: Cache por tenant
   ```python
   @cache(key_prefix=lambda: f"projects:{get_current_organization_id()}")
   def get_all_projects():
       ...
   ```

---

## ✅ Checklist Final

- [ ] Modelo Organization creado
- [ ] Tablas migradas con organization_id
- [ ] Foreign Keys compuestos arreglados
- [ ] BaseTenantService implementado
- [ ] TenantMiddleware implementado
- [ ] Servicios refactorizados
- [ ] JWT actualizado
- [ ] Tests de aislamiento pasando
- [ ] Frontend actualizado
- [ ] Documentación actualizada

---

**Siguiente Paso**: Implementar Fase 1 (Schema Migration)

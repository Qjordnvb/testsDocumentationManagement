# 🎯 Manager Dashboard - Métricas Finales Recomendadas

**Decisión**: Perspectiva Software Engineering Full Stack + SaaS Premium
**Fecha**: 2025-11-25

---

## 📊 LAYOUT FINAL DEL DASHBOARD

```
┌─────────────────────────────────────────────────────────────────────┐
│  Manager Dashboard - Vista Global de Proyectos                     │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  FILA 1: MÉTRICAS CRÍTICAS (4 Cards)                                │
├─────────────┬─────────────┬─────────────┬──────────────────────────┤
│ 🚨          │ 🤖          │ 🐛          │ 📈                       │
│ PROJECTS    │ AI-GENERATED│ CRITICAL    │ COVERAGE                 │
│ AT RISK     │ TESTS       │ BUGS OPEN   │ TREND                    │
│             │             │             │                          │
│     3       │     45      │      7      │  78% ↗️ +5%              │
│  Proyectos  │ This Week   │  Bloqueantes│ vs 7 days ago            │
│             │ 20h saved   │ Avg: 3.2d   │                          │
│             │             │             │                          │
│ Click →     │ Click →     │ Click →     │ Click →                  │
│ Filter Risk │ AI Tests    │ Bug List    │ Trend Chart              │
└─────────────┴─────────────┴─────────────┴──────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  FILA 2: QUICK ACTIONS (4 Botones)                                  │
├─────────────┬─────────────┬─────────────┬──────────────────────────┤
│ 📥          │ 🔍          │ ⚡          │ 📅                       │
│ DOWNLOAD    │ COMPARE     │ RUN AI      │ SCHEDULE                 │
│ REPORT      │ PROJECTS    │ GENERATION  │ EXECUTION                │
│             │             │             │                          │
│ PDF/DOCX    │ Side-by-side│ Bulk tests  │ Plan runs                │
│ All Projects│ Metrics     │ for uncovered│Automated                │
└─────────────┴─────────────┴─────────────┴──────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  FILA 3: FILTERS                                                     │
├──────────────────────────────────────────────────────────────────────┤
│  🔎 Search  [            ]   ☑️ Active Only   ☑️ At Risk   🧹 Clear  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  PROJECTS TABLE                                                      │
├────────┬──────┬──────┬─────────┬──────┬──────┬────────┬─────────────┤
│ Name   │Stories│Tests│Coverage │ Bugs │ Pass │ Health │ Actions     │
│        │       │     │         │      │ Rate │        │             │
├────────┼──────┼──────┼─────────┼──────┼──────┼────────┼─────────────┤
│ Proj A │  12  │  48  │  85% ↗️ │   2  │ 92%  │ 85 🟢  │ View | Rpt  │
│ Proj B │   8  │  20  │  65% ↘️ │   5  │ 78%  │ 45 🔴  │ View | Rpt  │
│ Proj C │  15  │  60  │  90% →  │   0  │ 95%  │ 92 🟢  │ View | Rpt  │
└────────┴──────┴──────┴─────────┴──────┴──────┴────────┴─────────────┘
```

---

## 📋 DETALLE DE MÉTRICAS

### 🚨 CARD 1: Projects at Risk

**Qué Muestra**:
```
     🚨
  PROJECTS
   AT RISK

      3
  Proyectos
```

**Definición de "At Risk"**:
Un proyecto está en riesgo si cumple **cualquiera** de estas condiciones:
1. Coverage < 70% **Y** tiene bugs críticos abiertos (≥1)
2. Cero test executions en últimos 7 días (abandonado)
3. Health Score < 50 (umbral crítico)

**Cálculo (Backend)**:
```python
def calculate_at_risk_projects(organization_id: str) -> int:
    projects = get_all_projects(organization_id)

    at_risk = []
    for project in projects:
        stats = get_project_stats(project.id)

        # Condición 1: Baja cobertura + bugs críticos
        if stats['test_coverage'] < 70 and stats['critical_bugs'] > 0:
            at_risk.append(project)
            continue

        # Condición 2: Sin actividad reciente
        last_execution = get_last_execution_date(project.id)
        if not last_execution or (date.today() - last_execution).days > 7:
            at_risk.append(project)
            continue

        # Condición 3: Health Score crítico
        if stats['health_score'] < 50:
            at_risk.append(project)

    return len(at_risk)
```

**Navegación al Click**:
```
URL: /manager/projects?filter=at_risk
Efecto: Tabla de proyectos se filtra automáticamente mostrando solo los 3 en riesgo
```

**Color Coding**:
- 🔴 Rojo si count > 0
- 🟢 Verde si count = 0

**Por Qué Es Valiosa**:
- **Predictiva**: Anticipa problemas antes del deadline
- **Accionable**: Manager sabe exactamente dónde enfocar recursos HOY
- **Estratégica**: Un CTO/VP Engineering paga por ver esto en su reunión matutina

---

### 🤖 CARD 2: AI-Generated Tests (This Week)

**Qué Muestra**:
```
     🤖
AI-GENERATED
    TESTS

     45
 This Week
  20h saved
```

**Cálculo (Backend)**:
```python
def calculate_ai_tests_this_week(organization_id: str) -> dict:
    today = date.today()
    week_ago = today - timedelta(days=7)

    ai_tests = db.query(TestCaseDB).filter(
        TestCaseDB.organization_id == organization_id,
        TestCaseDB.created_by_ai == True,
        TestCaseDB.created_at >= week_ago
    ).count()

    # Estimación: 1 test case manual toma ~27 minutos
    hours_saved = ai_tests * 0.45

    return {
        'ai_tests_count': ai_tests,
        'hours_saved': round(hours_saved, 1)
    }
```

**Datos Necesarios** (Migración):
```python
# Añadir campo a TestCaseDB:
class TestCaseDB(Base):
    # ... existing fields ...
    created_by_ai = Column(Boolean, default=False)
    ai_model_version = Column(String, nullable=True)  # "gemini-2.5-flash"
```

**Migración**:
```sql
ALTER TABLE test_cases
ADD COLUMN created_by_ai BOOLEAN DEFAULT FALSE;

ALTER TABLE test_cases
ADD COLUMN ai_model_version VARCHAR(50);
```

**Actualizar Endpoint** `/generate-test-cases`:
```python
# En generate_test_cases() al guardar:
test_case = TestCaseDB(
    # ... existing fields ...
    created_by_ai=True,
    ai_model_version="gemini-2.5-flash"
)
```

**Navegación al Click**:
```
URL: /test-cases?created_by_ai=true&date_from={7_days_ago}
Efecto: Muestra lista de 45 tests generados por AI esta semana
```

**Por Qué Es Valiosa**:
- **ROI Tangible**: "20h saved" = $1,000 saved (a $50/h)
- **Justifica Precio**: Un SaaS de $799/mes se paga solo con esto
- **Diferenciador**: TestRail/Jira NO tienen esto
- **Talking Point Ventas**: "Nuestros clientes ahorran 80h/mes con AI"

---

### 🐛 CARD 3: Critical Bugs Open

**Qué Muestra**:
```
     🐛
  CRITICAL
 BUGS OPEN

      7
 Bloqueantes
 Avg: 3.2 days
```

**Cálculo (Backend)**:
```python
def calculate_critical_bugs_stats(organization_id: str) -> dict:
    # Bugs críticos abiertos
    critical_open = db.query(BugDB).filter(
        BugDB.organization_id == organization_id,
        BugDB.severity.in_(["CRITICAL", "HIGH"]),
        BugDB.status.in_(["OPEN", "IN_PROGRESS"])
    ).count()

    # Promedio de resolución (últimos 30 días)
    thirty_days_ago = date.today() - timedelta(days=30)

    resolved_bugs = db.query(BugDB).filter(
        BugDB.organization_id == organization_id,
        BugDB.severity.in_(["CRITICAL", "HIGH"]),
        BugDB.status == "CLOSED",
        BugDB.resolved_at >= thirty_days_ago,
        BugDB.resolved_at.isnot(None)
    ).all()

    if resolved_bugs:
        resolution_times = [
            (bug.resolved_at - bug.created_at).days
            for bug in resolved_bugs
        ]
        avg_resolution = sum(resolution_times) / len(resolution_times)
    else:
        avg_resolution = 0

    return {
        'critical_open': critical_open,
        'avg_resolution_days': round(avg_resolution, 1)
    }
```

**Datos Necesarios** (Migración):
```python
# Añadir campo a BugDB:
class BugDB(Base):
    # ... existing fields ...
    resolved_at = Column(DateTime, nullable=True)
```

**Migración**:
```sql
ALTER TABLE bugs
ADD COLUMN resolved_at TIMESTAMP;

-- Rellenar histórico (bugs ya cerrados):
UPDATE bugs
SET resolved_at = updated_at
WHERE status = 'CLOSED' AND resolved_at IS NULL;
```

**Navegación al Click**:
```
URL: /bugs?severity=critical,high&status=open,in_progress
Efecto: Lista de 7 bugs críticos que bloquean release
```

**Color Coding**:
- 🔴 Rojo si count > 5
- 🟡 Amarillo si count 1-5
- 🟢 Verde si count = 0

**Por Qué Es Valiosa**:
- **Número Concreto**: "7 bugs" es más accionable que "Riesgo: Medio"
- **Contexto de Eficiencia**: "Avg 3.2 days" indica si el equipo es rápido resolviendo
- **Predicción de Release**: Si hay 7 bugs y tardan 3 días promedio → ~21 días para cerrar todos
- **Urgencia Visual**: Número rojo grande exige atención inmediata

---

### 📈 CARD 4: Coverage Trend

**Qué Muestra**:
```
     📈
  COVERAGE
   TREND

 78% ↗️ +5%
vs 7 days ago
```

**Cálculo (Backend)**:
```python
def calculate_coverage_trend(organization_id: str) -> dict:
    # Coverage actual (todos los proyectos)
    projects = get_all_projects(organization_id)

    total_stories = sum(p.total_user_stories for p in projects)
    stories_with_tests = sum(p.stories_with_tests for p in projects)

    coverage_today = (stories_with_tests / total_stories * 100) if total_stories > 0 else 0

    # Coverage de hace 7 días (desde histórico)
    seven_days_ago = date.today() - timedelta(days=7)

    historical = db.query(CoverageHistoryDB).filter(
        CoverageHistoryDB.organization_id == organization_id,
        CoverageHistoryDB.snapshot_date == seven_days_ago
    ).first()

    coverage_7_days_ago = historical.coverage_pct if historical else coverage_today

    trend = coverage_today - coverage_7_days_ago

    return {
        'coverage_pct': round(coverage_today, 1),
        'trend_pct': round(trend, 1),
        'trend_direction': 'up' if trend > 0 else 'down' if trend < 0 else 'stable'
    }
```

**Nueva Tabla Requerida**:
```python
class CoverageHistoryDB(Base):
    __tablename__ = "coverage_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(String, nullable=False)
    snapshot_date = Column(Date, nullable=False)
    coverage_pct = Column(Float, nullable=False)
    total_stories = Column(Integer, nullable=False)
    stories_with_tests = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('organization_id', 'snapshot_date', name='uq_org_date'),
    )
```

**Job Diario** (Cron/Scheduler):
```python
# backend/jobs/daily_snapshot.py
from apscheduler.schedulers.background import BackgroundScheduler

def take_daily_snapshot():
    """Corre todos los días a las 23:59"""
    organizations = db.query(UserDB.organization_id).distinct().all()

    for org_id in organizations:
        projects = get_all_projects(org_id)

        total_stories = sum(p.total_user_stories for p in projects)
        stories_with_tests = sum(p.stories_with_tests for p in projects)
        coverage = (stories_with_tests / total_stories * 100) if total_stories > 0 else 0

        snapshot = CoverageHistoryDB(
            organization_id=org_id,
            snapshot_date=date.today(),
            coverage_pct=coverage,
            total_stories=total_stories,
            stories_with_tests=stories_with_tests
        )

        db.add(snapshot)

    db.commit()

# Configurar scheduler en main.py:
scheduler = BackgroundScheduler()
scheduler.add_job(take_daily_snapshot, 'cron', hour=23, minute=59)
scheduler.start()
```

**Navegación al Click**:
```
Acción: Abrir modal con gráfica line chart
Datos: Últimos 30 días de coverage (eje X: fechas, eje Y: %)
```

**Color Coding**:
- ↗️ Verde si trend > 0
- ↘️ Rojo si trend < 0
- → Gris si trend = 0

**Por Qué Es Valiosa**:
- **Predictiva**: Tendencia indica si llegaremos a 90% coverage para el release
- **Alerta Temprana**: "↘️ -3%" significa degradación → investigar por qué
- **Motivacional**: "↗️ +5%" muestra progreso del equipo → boost de moral
- **Estratégica**: Manager puede proyectar: "A este ritmo, 90% coverage en 2 semanas"

---

## 🚀 FILA 2: QUICK ACTIONS

En lugar de más métricas (information overload), la fila 2 ofrece **acciones frecuentes**.

### 📥 ACTION 1: Download Consolidated Report

**Botón**:
```
┌──────────────────┐
│  📥 DOWNLOAD     │
│     REPORT       │
│                  │
│  PDF/DOCX        │
│  All Projects    │
└──────────────────┘
```

**Acción al Click**:
```javascript
onClick={() => {
  const format = 'pdf';  // o permitir selector
  downloadConsolidatedReport(format);
}}
```

**Backend Endpoint** (ya existe):
```
GET /api/v1/reports/consolidated?format=pdf
→ Returns FileResponse with PDF
```

**Contenido del Report**:
- Resumen ejecutivo (4 métricas principales)
- Tabla de proyectos con health scores
- Gráficas de tendencias
- Top 5 bugs críticos

---

### 🔍 ACTION 2: Compare Projects

**Botón**:
```
┌──────────────────┐
│  🔍 COMPARE      │
│     PROJECTS     │
│                  │
│  Side-by-side    │
│    Metrics       │
└──────────────────┘
```

**Acción al Click**:
```javascript
onClick={() => {
  setShowCompareModal(true);
}}
```

**Modal Content**:
```
┌─────────────────────────────────────────────┐
│  Compare Projects                      [X]  │
├─────────────────────────────────────────────┤
│  Select 2-4 projects to compare:            │
│  ☑️ Project A   ☑️ Project B   ☐ Project C  │
├─────────────────────────────────────────────┤
│  Metric       │ Proj A │ Proj B │ Proj C   │
│ ─────────────┼────────┼────────┼────────── │
│  Coverage     │  85%   │  65%   │  90%     │
│  Bugs         │   2    │   5    │   0      │
│  Pass Rate    │  92%   │  78%   │  95%     │
│  Health       │  85    │  45    │  92      │
├─────────────────────────────────────────────┤
│           [Export Comparison]               │
└─────────────────────────────────────────────┘
```

---

### ⚡ ACTION 3: Run AI Generation

**Botón**:
```
┌──────────────────┐
│  ⚡ RUN AI       │
│    GENERATION    │
│                  │
│  Bulk tests      │
│ for uncovered    │
└──────────────────┘
```

**Acción al Click**:
```javascript
onClick={() => {
  // Encuentra stories sin tests
  const uncoveredStories = getStoriesWithoutTests();

  // Modal con selector
  setShowAIGenerationModal(true);
  setStoriesForAI(uncoveredStories);
}}
```

**Modal Content**:
```
┌─────────────────────────────────────────────┐
│  AI Bulk Generation                    [X]  │
├─────────────────────────────────────────────┤
│  Found 12 User Stories without test cases   │
│                                             │
│  Select stories to generate tests:          │
│  ☑️ US-001: User Login (HIGH)               │
│  ☑️ US-005: Password Reset (MEDIUM)         │
│  ☐ US-012: Profile Edit (LOW)              │
│                                             │
│  Tests per story: [3]                       │
│  Scenarios per test: [2]                    │
│                                             │
│  Estimated: 12 stories × 3 tests = 36 tests │
│  Time saved: ~16 hours                      │
├─────────────────────────────────────────────┤
│      [Cancel]    [Generate All ⚡]           │
└─────────────────────────────────────────────┘
```

**Valor**:
- **Proactivo**: Manager no necesita ir proyecto por proyecto
- **Eficiencia**: Genera tests en batch (1 click)
- **Visible**: Muestra ROI inmediato ("16h saved")

---

### 📅 ACTION 4: Schedule Execution

**Botón**:
```
┌──────────────────┐
│  📅 SCHEDULE     │
│    EXECUTION     │
│                  │
│   Plan runs      │
│   Automated      │
└──────────────────┘
```

**Acción al Click**:
```javascript
onClick(() => {
  setShowScheduleModal(true);
}}
```

**Modal Content** (Future Feature):
```
┌─────────────────────────────────────────────┐
│  Schedule Test Execution               [X]  │
├─────────────────────────────────────────────┤
│  Project: [Select Project ▼]                │
│  Test Suite: [All Tests ▼]                  │
│                                             │
│  Frequency:                                 │
│  ○ Daily   ○ Weekly   ● On-Demand          │
│                                             │
│  Time: [09:00 AM]                           │
│  Environment: [Staging ▼]                   │
│                                             │
│  Notification:                              │
│  ☑️ Email results to team                   │
│  ☑️ Slack alert if failures                 │
├─────────────────────────────────────────────┤
│          [Cancel]    [Schedule 📅]           │
└─────────────────────────────────────────────┘
```

**Nota**: Esta feature requiere un sistema de queue/scheduler (Celery, RabbitMQ).
**Roadmap**: Q2 2026 (después de tener ejecución automática de tests)

---

## 🎨 DISEÑO VISUAL (TailwindCSS)

### Card Component:
```tsx
// components/MetricCard.tsx
interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
  color: 'red' | 'green' | 'blue' | 'purple';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  trend,
  color,
  onClick
}) => {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    stable: '→'
  };

  return (
    <div
      className={`
        card cursor-pointer hover:shadow-lg transition-all
        ${onClick ? 'hover:scale-105' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className="text-sm font-medium">
            {trendIcons[trend.direction]} {trend.value}
          </span>
        )}
      </div>

      <h3 className="text-sm font-medium text-gray-600 uppercase">
        {title}
      </h3>

      <p className="text-4xl font-bold text-gray-900 mt-2">
        {value}
      </p>

      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
```

### Uso:
```tsx
<MetricCard
  icon={<AlertTriangle size={24} />}
  title="Projects at Risk"
  value={3}
  subtitle="Proyectos"
  color="red"
  onClick={() => navigate('/projects?filter=at_risk')}
/>

<MetricCard
  icon={<Zap size={24} />}
  title="AI-Generated Tests"
  value={45}
  subtitle="This Week • 20h saved"
  color="purple"
  onClick={() => navigate('/test-cases?ai=true')}
/>

<MetricCard
  icon={<Bug size={24} />}
  title="Critical Bugs Open"
  value={7}
  subtitle="Bloqueantes • Avg: 3.2 days"
  color="red"
  onClick={() => navigate('/bugs?severity=critical,high')}
/>

<MetricCard
  icon={<TrendingUp size={24} />}
  title="Coverage Trend"
  value="78%"
  trend={{ direction: 'up', value: '+5%' }}
  subtitle="vs 7 days ago"
  color="green"
  onClick={() => setShowTrendModal(true)}
/>
```

---

## 📦 RESUMEN DE CAMBIOS REQUERIDOS

### 🗄️ Migraciones de Base de Datos:

```sql
-- 1. Añadir flag de AI a test cases
ALTER TABLE test_cases
ADD COLUMN created_by_ai BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_model_version VARCHAR(50);

-- 2. Añadir fecha de resolución a bugs
ALTER TABLE bugs
ADD COLUMN resolved_at TIMESTAMP;

-- Rellenar histórico:
UPDATE bugs
SET resolved_at = updated_at
WHERE status = 'CLOSED' AND resolved_at IS NULL;

-- 3. Crear tabla de histórico de coverage
CREATE TABLE coverage_history (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(100) NOT NULL,
    snapshot_date DATE NOT NULL,
    coverage_pct FLOAT NOT NULL,
    total_stories INTEGER NOT NULL,
    stories_with_tests INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_org_date UNIQUE (organization_id, snapshot_date)
);

CREATE INDEX idx_coverage_org_date ON coverage_history(organization_id, snapshot_date);
```

### 🔧 Backend Changes:

**Archivos a Crear**:
- `backend/jobs/daily_snapshot.py` - Job diario para snapshots
- `backend/database/models.py` - Añadir CoverageHistoryDB
- `backend/services/metrics_service.py` - Servicio de métricas del manager

**Archivos a Modificar**:
- `backend/api/endpoints/test_cases.py` - Marcar tests generados por AI
- `backend/database/models.py` - Añadir campos `created_by_ai`, `resolved_at`
- `backend/main.py` - Iniciar scheduler para job diario

### 🎨 Frontend Changes:

**Archivos a Crear**:
- `frontend/src/shared/ui/MetricCard.tsx` - Componente de card
- `frontend/src/features/compare-projects/` - Feature de comparación
- `frontend/src/features/ai-bulk-generation/` - Feature de generación masiva

**Archivos a Modificar**:
- `frontend/src/pages/ManagerDashboardPage/` - Reemplazar cards actuales
- `frontend/src/pages/ManagerDashboardPage/model/useManagerDashboard.ts` - Añadir nuevas métricas

---

## 📊 PRIORIZACIÓN (MVP → Full)

### 🚀 Sprint 1 (MVP - Semana 1-2): Métricas Estáticas
**Goal**: Mostrar métricas sin histórico

✅ **Implementar**:
- Projects at Risk (con datos actuales)
- Critical Bugs Open (sin avg resolution time)
- AI-Generated Tests (añadir flag `created_by_ai`)
- Coverage actual (sin trend)

❌ **Excluir**:
- Tendencias temporales
- Avg resolution time
- Quick Actions

**Valor**: Manager ve métricas básicas pero útiles

---

### 🔄 Sprint 2 (Tendencias - Semana 3-4): Añadir Histórico
**Goal**: Añadir dimensión temporal

✅ **Implementar**:
- Tabla `coverage_history`
- Job diario para snapshots
- Coverage Trend con flechas
- Avg Bug Resolution Time (requiere `resolved_at`)

**Valor**: Manager ve si está mejorando o empeorando

---

### 🎯 Sprint 3 (Acciones - Semana 5-6): Quick Actions
**Goal**: Hacer dashboard accionable

✅ **Implementar**:
- Download Consolidated Report
- Compare Projects (modal)
- AI Bulk Generation (modal)

❌ **Excluir**:
- Schedule Execution (requiere queue system)

**Valor**: Manager puede actuar sobre la información

---

## 💰 IMPACTO COMERCIAL

### ROI para el Cliente:

**Antes** (sin métricas):
- Manager hace 2h/día de reuniones para entender estado de proyectos
- 2h × 5 días × 4 semanas = **40h/mes**
- 40h × $100/hora = **$4,000/mes** desperdiciados

**Después** (con dashboard):
- Manager ve dashboard en 5 minutos cada mañana
- 5min × 20 días = **1.67h/mes**
- Ahorro: 40 - 1.67 = **38.33h/mes**
- Ahorro: $3,833/mes

**ROI**:
- Costo SaaS: $799/mes
- Ahorro: $3,833/mes
- **ROI: 4.8x**

### Pitch de Ventas:

> "Nuestro Manager Dashboard predice qué proyectos fallarán **3 semanas antes** del deadline, te ahorra **40 horas al mes** en reuniones de status, y justifica su costo en la primera semana con AI test generation. ¿Cuánto vale para ti dormir tranquilo sabiendo que ningún proyecto explotará sin previo aviso?"

**Precio Target**: $799-$1,299/mes por organización

---

**Autor**: Claude AI (Software Engineering + SaaS Strategy)
**Revisión**: v2.0 Final

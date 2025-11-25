# Architecture Analysis - Azure Deployment Strategy

**Fecha**: 2025-11-25
**Sistema**: QA Documentation Management
**Stack**: FastAPI + React + Celery + Redis + SQLite

---

## 1. ESCALABILIDAD - Evaluación Actual

**Score: 3/10** (Funcional para desarrollo, crítico para producción)

### Cuellos de Botella Críticos

1. **SQLite Database** 🔴 BLOQUEANTE
   - Bloqueos de escritura en multi-usuario
   - Sin replicación ni backup automático
   - Límite: ~100 usuarios concurrentes (optimista)

2. **Single Backend Instance** 🔴 CRÍTICO
   - Sin horizontal scaling
   - SPOF (Single Point of Failure)
   - Límite: ~50 requests/segundo (sin cache)

3. **Celery Workers Hardcoded** 🟠 ALTO
   - Concurrency=4 fijo (no autoscaling)
   - AI generation tasks pueden bloquear queue

4. **File Storage Local** 🟠 ALTO
   - PDFs/DOCX en filesystem local
   - No compartido entre instancias

### Cambios para 1000+ Usuarios

- **DB**: Migrar a Azure SQL Database (DTU 100+) o PostgreSQL Flexible Server
- **Backend**: App Service con autoscaling (2-10 instancias) o AKS cluster
- **Celery**: Azure Container Instances con KEDA autoscaler (min 2, max 20 workers)
- **Storage**: Azure Blob Storage para PDFs/DOCX + CDN para frontend assets
- **Cache**: Azure Cache for Redis (Standard tier) para session/query cache

---

## 2. ARQUITECTURA AZURE - Deployment Recomendado

### Opción A: App Service + Managed Services (RECOMENDADO para MVP)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Azure Front Door (WAF)                      │
│                          + CDN Endpoint                          │
└────────────┬───────────────────────────────────┬─────────────────┘
             │                                   │
    ┌────────▼──────────┐              ┌────────▼──────────┐
    │  Static Web App   │              │  App Service      │
    │  (React Frontend) │              │  (FastAPI)        │
    │  - Premium Tier   │              │  - P1v3 (2 inst)  │
    │  - Auto CDN       │              │  - Autoscaling    │
    └───────────────────┘              └────────┬──────────┘
                                                │
                        ┌───────────────────────┼──────────────────────┐
                        │                       │                      │
              ┌─────────▼────────┐   ┌──────────▼────────┐  ┌────────▼────────┐
              │ Azure SQL DB     │   │ Cache for Redis   │  │ Blob Storage    │
              │ - Standard S2    │   │ - Standard C1     │  │ - Hot tier      │
              │ - 50 DTU         │   │ - 1GB cache       │  │ - PDFs/DOCX     │
              └──────────────────┘   └───────────────────┘  └─────────────────┘
                                                │
                                     ┌──────────▼────────────┐
                                     │ Container Instances   │
                                     │ (Celery Workers)      │
                                     │ - KEDA autoscaler     │
                                     │ - 2-10 instances      │
                                     └───────────────────────┘
```

### Servicios Necesarios

| Servicio | SKU | Propósito |
|----------|-----|-----------|
| **App Service Plan** | P1v3 (2 cores, 8GB) | Backend FastAPI (2 instancias) |
| **Static Web Apps** | Standard | Frontend React + CDN integrado |
| **Azure SQL Database** | Standard S2 (50 DTU) | Database principal |
| **Azure Cache for Redis** | Standard C1 (1GB) | Session + query cache |
| **Blob Storage** | Hot tier + LRS | PDFs, DOCX, uploads |
| **Container Instances** | 2 vCPU, 4GB cada uno | Celery workers (min 2) |
| **Azure Front Door** | Standard | WAF + routing + CDN global |
| **Application Insights** | Pay-as-you-go | Logs + metrics + tracing |
| **Key Vault** | Standard | Secrets (JWT, Gemini API key) |

### Pipeline CI/CD (Azure DevOps)

**Repositorio**: Azure Repos Git
**Pipelines**: 2 YAML files

1. **Backend Pipeline** (`azure-pipelines-backend.yml`)
   - Trigger: branch `main` + `backend/**`
   - Stages: Build → Test → Deploy Dev → Deploy Staging → Deploy Prod
   - Tasks: pytest, docker build, push ACR, deploy App Service

2. **Frontend Pipeline** (`azure-pipelines-frontend.yml`)
   - Trigger: branch `main` + `frontend/**`
   - Stages: Build → Deploy Dev → Deploy Staging → Deploy Prod
   - Tasks: npm test, npm build, deploy Static Web App

### Environments

| Environment | Slot | Database | URL |
|-------------|------|----------|-----|
| **Development** | dev-slot | SQL Dev (Basic) | dev-qa.azurewebsites.net |
| **Staging** | staging-slot | SQL Staging (S1) | staging-qa.azurewebsites.net |
| **Production** | production | SQL Prod (S2) | qa-docs.company.com |

---

## 3. ESTIMACIÓN COSTOS AZURE (USD/mes)

### Tier Básico (10-50 usuarios)

| Servicio | SKU | Costo/mes |
|----------|-----|-----------|
| App Service Plan P1v3 | 1 instancia | $146 |
| Static Web Apps | Standard | $9 |
| Azure SQL Database | Basic (5 DTU) | $5 |
| Cache for Redis | Basic C0 (250MB) | $16 |
| Blob Storage | 50GB Hot | $1 |
| Container Instances | 1 worker (1 vCPU) | $30 |
| Application Insights | 5GB/mes | $12 |
| **TOTAL BÁSICO** | | **~$220/mes** |

### Tier Medio (100-500 usuarios)

| Servicio | SKU | Costo/mes |
|----------|-----|-----------|
| App Service Plan P1v3 | 2 instancias (autoscale) | $292 |
| Static Web Apps | Standard | $9 |
| Azure SQL Database | Standard S2 (50 DTU) | $75 |
| Cache for Redis | Standard C1 (1GB) | $75 |
| Blob Storage | 200GB Hot | $4 |
| Container Instances | 2-4 workers (KEDA) | $120 |
| Azure Front Door | Standard tier | $35 |
| Application Insights | 20GB/mes | $48 |
| **TOTAL MEDIO** | | **~$660/mes** |

### Tier Enterprise (1000+ usuarios)

| Servicio | SKU | Costo/mes |
|----------|-----|-----------|
| App Service Plan P2v3 | 3-5 instancias (autoscale) | $730 |
| Static Web Apps | Standard + custom domain | $9 |
| Azure SQL Database | Standard S4 (200 DTU) | $300 |
| Cache for Redis | Standard C2 (2.5GB) | $150 |
| Blob Storage | 1TB Hot | $18 |
| Container Instances | 5-10 workers (KEDA) | $450 |
| Azure Front Door | Premium (WAF rules) | $330 |
| Application Insights | 50GB/mes | $120 |
| **TOTAL ENTERPRISE** | | **~$2,100/mes** |

**Notas**: Precios región East US. No incluye egress traffic (estimado +15%). Descuentos disponibles con Azure Reserved Instances (save 30-40%).

---

## 4. RECOMENDACIONES TOP 3

### 🔴 1. Migración SQLite → Azure SQL Database (CRÍTICO)
**Urgencia**: Antes de cualquier deployment
**Effort**: 2-3 días (script migration + testing)
**Impacto**: Desbloquea escalabilidad horizontal

### 🟠 2. Implementar Blob Storage para archivos (ALTO)
**Urgencia**: Antes de producción
**Effort**: 1 día (cambiar file handlers en reports.py + bugs.py)
**Impacto**: Permite múltiples instancias de backend sin shared filesystem

### 🟡 3. Refactorizar Backend Service Layer (MEDIO-LARGO PLAZO)
**Urgencia**: Post-deployment (deuda técnica, no bloqueante)
**Effort**: 2 semanas (3,289 líneas pendientes - ver TECHNICAL_DEBT_ANALYSIS.md)
**Impacto**: Mejora testabilidad + mantenibilidad, NO afecta deployment inicial

**Decision Crítica**: ¿App Service o AKS?
- **App Service**: Recomendado para <1000 usuarios (menor complejidad operativa)
- **AKS**: Solo si se requiere multi-región, compliance estricto, o >2000 usuarios

**Quick Win**: Implementar Azure Cache for Redis para `/projects` y `/stats` endpoints (+50% response time).

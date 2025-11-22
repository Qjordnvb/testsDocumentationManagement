# 🚀 Guía Completa de Deployment y Escalamiento

**Última actualización**: 2025-11-22
**Autor**: Quality Mission Control Team

---

## 📋 Tabla de Contenidos

1. [Instalación Rápida (Desarrollo)](#-instalación-rápida-desarrollo)
2. [Docker Compose Completo (Staging)](#-docker-compose-completo-staging)
3. [Opciones de Producción](#-opciones-de-producción)
4. [Kubernetes (Alta Escala)](#-kubernetes-alta-escala)
5. [Cloud Providers](#-cloud-providers)
6. [Comparación de Arquitecturas](#-comparación-de-arquitecturas)
7. [Recomendaciones por Escala](#-recomendaciones-por-escala)

---

## 🏃 Instalación Rápida (Desarrollo)

### Prerequisitos

```bash
# 1. Docker + Docker Compose
docker --version  # >= 20.10
docker-compose --version  # >= 1.29

# 2. Python 3.11+
python --version

# 3. Node.js 18+
node --version
npm --version
```

### Opción A: Local (SIN Docker)

**Paso 1: Instalar dependencias**
```bash
# Backend
cd backend
pip install -r ../requirements.txt

# Frontend
cd ../frontend
npm install
```

**Paso 2: Configurar .env**
```bash
# En la raíz del proyecto
cp .env.example .env

# Editar .env
GEMINI_API_KEY=your_actual_api_key_here
REDIS_URL=redis://localhost:6379/0
DATABASE_URL=sqlite:///./data/qa_automation.db
```

**Paso 3: Iniciar servicios**
```bash
# Terminal 1: Redis (Docker)
docker-compose up redis -d

# Terminal 2: Celery Worker
export PYTHONPATH=$(pwd)
celery -A backend.celery_app worker --loglevel=info --concurrency=4

# Terminal 3: Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 4: Frontend
cd frontend
npm run dev
```

✅ **Aplicación corriendo**:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

### Opción B: Docker Compose (Servicios parciales)

**Solo Redis + Celery**:
```bash
docker-compose up redis celery_worker -d
```

**Luego correr Backend + Frontend localmente** (pasos 3 arriba)

---

## 🐳 Docker Compose Completo (Staging)

### Full Stack con Docker

**Archivo**: `docker-compose.full.yml`

```bash
# 1. Configurar .env
cp .env.example .env
# Editar GEMINI_API_KEY

# 2. Iniciar todos los servicios
docker-compose -f docker-compose.full.yml up -d

# 3. Ver logs
docker-compose -f docker-compose.full.yml logs -f

# 4. Verificar servicios
docker-compose -f docker-compose.full.yml ps
```

**Servicios incluidos**:
```
✅ redis:          localhost:6379
✅ celery_worker:  Background processing
✅ backend:        localhost:8000 (FastAPI)
✅ frontend:       localhost:5173 (React)
```

**Comandos útiles**:
```bash
# Rebuild después de cambios
docker-compose -f docker-compose.full.yml up -d --build

# Ver logs de un servicio específico
docker-compose -f docker-compose.full.yml logs -f backend

# Restart servicio
docker-compose -f docker-compose.full.yml restart celery_worker

# Stop todo
docker-compose -f docker-compose.full.yml down

# Stop y limpiar volúmenes
docker-compose -f docker-compose.full.yml down -v
```

---

## 🏭 Opciones de Producción

### 1. Docker Compose (Small Scale)

**✅ Mejor para**:
- Equipos pequeños (1-10 usuarios concurrentes)
- Staging environment
- MVPs y prototipos
- Single server deployment

**Arquitectura**:
```
┌─────────────────────────────────────────┐
│         Single Server (VPS/VM)          │
├─────────────────────────────────────────┤
│  NGINX (Reverse Proxy)                  │
│    ↓                                    │
│  Docker Compose:                        │
│    - Frontend (React)                   │
│    - Backend (FastAPI)                  │
│    - Celery Worker                      │
│    - Redis                              │
└─────────────────────────────────────────┘
```

**Setup Producción**:
```bash
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always

  celery_worker:
    build: .
    command: celery -A backend.celery_app worker --loglevel=warning --concurrency=8
    environment:
      - REDIS_URL=redis://redis:6379/0
    restart: always

  backend:
    build: .
    command: gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker
    environment:
      - REDIS_URL=redis://redis:6379/0
    restart: always

  frontend:
    build:
      context: ./frontend
      target: production
    restart: always

volumes:
  redis_data:
```

**Costos**: $5-50/mes (Digital Ocean, Linode)

---

### 2. Kubernetes (Medium/Large Scale)

**✅ Mejor para**:
- Equipos medianos/grandes (10-1000+ usuarios)
- Alta disponibilidad requerida
- Auto-scaling necesario
- Multi-region deployment

**Arquitectura**:
```
┌─────────────────────────────────────────────────────────┐
│                  Kubernetes Cluster                     │
├─────────────────────────────────────────────────────────┤
│  Ingress Controller (NGINX/Traefik)                    │
│    ↓                                                    │
│  ┌───────────┬───────────┬──────────────┬────────────┐ │
│  │ Frontend  │ Backend   │ Celery       │ Redis      │ │
│  │ Deployment│ Deployment│ Deployment   │ StatefulSet│ │
│  │ (3 pods)  │ (5 pods)  │ (10 pods)    │ (3 pods)   │ │
│  │           │           │              │            │ │
│  │ HPA*      │ HPA*      │ HPA*         │            │ │
│  └───────────┴───────────┴──────────────┴────────────┘ │
│                                                         │
│  * HPA = Horizontal Pod Autoscaler                     │
│         Auto-scale based on CPU/Memory/Custom metrics  │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- ✅ Auto-scaling (HPA)
- ✅ Self-healing (restart pods on failure)
- ✅ Rolling updates (zero-downtime deployments)
- ✅ Load balancing
- ✅ Service discovery
- ✅ Secrets management
- ✅ Multi-cloud support

**Setup básico** (requiere kubectl configurado):
```bash
# 1. Crear namespace
kubectl create namespace qa-mission-control

# 2. Deploy Redis
kubectl apply -f k8s/redis-statefulset.yaml

# 3. Deploy Backend
kubectl apply -f k8s/backend-deployment.yaml

# 4. Deploy Celery
kubectl apply -f k8s/celery-deployment.yaml

# 5. Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml

# 6. Deploy Ingress
kubectl apply -f k8s/ingress.yaml
```

**Ejemplo: backend-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: qa-mission-control
spec:
  replicas: 5
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry.com/qa-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: REDIS_URL
          value: "redis://redis:6379/0"
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: gemini-secret
              key: api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: qa-mission-control
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Costos**: $100-5000+/mes (dependiendo de cluster size)

---

### 3. Cloud Providers (Managed Services)

#### A. AWS (Amazon Web Services)

**Opción 1: ECS + Fargate (Container-based)**
```
Architecture:
  - Frontend: CloudFront + S3 (static hosting)
  - Backend: ECS Fargate (auto-scaling containers)
  - Celery: ECS Fargate (background workers)
  - Redis: ElastiCache for Redis (managed)
  - DB: RDS (if migrating from SQLite)
```

**Setup**:
```bash
# 1. Build and push images
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t qa-backend .
docker tag qa-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/qa-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/qa-backend:latest

# 2. Create ECS cluster (via AWS Console or Terraform)
# 3. Create task definitions
# 4. Create services with auto-scaling
```

**Costos estimados**:
- Fargate: ~$50-300/mes (depende de tasks y CPU/memory)
- ElastiCache: ~$15-100/mes
- S3 + CloudFront: ~$5-20/mes
- **Total**: $70-420/mes

#### B. Google Cloud Platform

**Opción: Cloud Run (Serverless Containers)**
```
Architecture:
  - Frontend: Cloud Storage + Cloud CDN
  - Backend: Cloud Run (auto-scaling)
  - Celery: Cloud Run Jobs (background)
  - Redis: Memorystore for Redis
```

**Setup**:
```bash
# 1. Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/qa-backend

# 2. Deploy to Cloud Run
gcloud run deploy qa-backend \
  --image gcr.io/PROJECT_ID/qa-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10
```

**Costos estimados**: $50-300/mes

#### C. Azure

**Opción: Azure Container Apps**
```
Architecture:
  - Frontend: Azure Static Web Apps
  - Backend: Container Apps (auto-scaling)
  - Celery: Container Apps (background)
  - Redis: Azure Cache for Redis
```

**Costos estimados**: $60-350/mes

---

### 4. Docker Swarm (Alternative to Kubernetes)

**✅ Mejor para**:
- Teams que quieren clustering sin la complejidad de K8s
- Medium scale (10-100 usuarios)
- Multi-server setup simple

**Setup**:
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.swarm.yml qa-app

# Scale services
docker service scale qa-app_celery_worker=5
```

**Costos**: Similar a Docker Compose pero multi-server

---

## 📊 Comparación de Arquitecturas

| Criterio | Docker Compose | Docker Swarm | Kubernetes | Cloud Managed |
|----------|---------------|--------------|------------|---------------|
| **Complejidad** | ⭐ Simple | ⭐⭐ Media | ⭐⭐⭐⭐⭐ Alta | ⭐⭐ Media |
| **Escalabilidad** | Limitada (single server) | Media (multi-server) | Muy alta | Muy alta |
| **Auto-scaling** | ❌ No | ✅ Sí (básico) | ✅ Sí (avanzado) | ✅ Sí (managed) |
| **Alta disponibilidad** | ❌ No | ✅ Sí | ✅ Sí | ✅ Sí |
| **Multi-region** | ❌ No | Limitado | ✅ Sí | ✅ Sí |
| **Costo (small)** | $5-50/mes | $50-200/mes | $100-500/mes | $70-300/mes |
| **Costo (large)** | N/A | $200-1000/mes | $500-5000/mes | $300-2000/mes |
| **Mantenimiento** | Bajo | Medio | Alto | Bajo (managed) |
| **Vendor lock-in** | ❌ No | ❌ No | ❌ No | ✅ Sí |
| **Curva aprendizaje** | 1 día | 1 semana | 2-3 meses | 1-2 semanas |

---

## 🎯 Recomendaciones por Escala

### Startup / MVP (1-10 usuarios)
**Recomendación**: Docker Compose en single VPS

```bash
# Opción más económica
Provider: Digital Ocean Droplet ($5-10/mes)
Setup: docker-compose.prod.yml
Tiempo setup: 2-4 horas
```

**Pros**:
- ✅ Muy económico
- ✅ Setup rápido
- ✅ Fácil de mantener

**Cons**:
- ❌ No auto-scaling
- ❌ Single point of failure

---

### Small Business (10-100 usuarios)
**Recomendación**: Cloud Managed Services (Cloud Run / ECS Fargate)

```bash
Provider: Google Cloud Run / AWS ECS
Costo: $70-300/mes
Tiempo setup: 1-2 días
```

**Pros**:
- ✅ Auto-scaling
- ✅ Managed (menos mantenimiento)
- ✅ Alta disponibilidad
- ✅ Pay-per-use

**Cons**:
- ❌ Vendor lock-in
- ❌ Costo medio

---

### Medium Business (100-1000 usuarios)
**Recomendación**: Kubernetes (GKE / EKS / AKS)

```bash
Provider: Google GKE / AWS EKS / Azure AKS
Costo: $300-1500/mes
Tiempo setup: 1-2 semanas
```

**Pros**:
- ✅ Auto-scaling avanzado
- ✅ Multi-region
- ✅ Self-healing
- ✅ Zero-downtime deployments
- ✅ No vendor lock-in (portable)

**Cons**:
- ❌ Complejidad alta
- ❌ Requiere DevOps expertise

---

### Enterprise (1000+ usuarios)
**Recomendación**: Kubernetes Multi-cluster + CDN + Edge Computing

```bash
Architecture:
  - Multi-region K8s clusters
  - Global load balancing
  - CDN (CloudFlare / CloudFront)
  - Edge workers (Cloudflare Workers)

Costo: $2000-10000+/mes
```

**Features**:
- ✅ Global distribution
- ✅ DDoS protection
- ✅ Edge caching
- ✅ 99.99% uptime SLA

---

## 🚀 Mi Recomendación para tu caso

Basado en tu aplicación (Quality Mission Control):

### Fase 1: MVP / Testing (Ahora)
**Opción**: Docker Compose local + Redis
**Razón**: Rápido para desarrollar y probar
**Costo**: $0 (local) o $5/mes (VPS small)

```bash
# Usa esto:
docker-compose -f docker-compose.full.yml up -d
```

---

### Fase 2: Primeros Clientes (1-50 usuarios)
**Opción**: Cloud Run (GCP) o ECS Fargate (AWS)
**Razón**:
- ✅ Auto-scaling sin configuración compleja
- ✅ Pay-per-use (solo pagas lo que usas)
- ✅ Zero ops (managed)
- ✅ HTTPS automático

**Costo**: $50-200/mes

---

### Fase 3: Crecimiento (50-500 usuarios)
**Opción**: Kubernetes (GKE recomendado)
**Razón**:
- ✅ Control total
- ✅ Multi-region ready
- ✅ No vendor lock-in
- ✅ Escalable a millones de usuarios

**Costo**: $300-1000/mes

---

## 📝 Quick Start para Probar AHORA

### Opción Más Rápida (5 minutos):

```bash
# 1. Clonar repo
cd /path/to/testsDocumentationManagement

# 2. Crear .env
cat > .env << EOF
GEMINI_API_KEY=your_key_here
REDIS_URL=redis://redis:6379/0
DATABASE_URL=sqlite:///./data/qa_automation.db
EOF

# 3. Iniciar solo Redis + Celery
docker-compose up redis celery_worker -d

# 4. Backend local
cd backend
pip install -r ../requirements.txt
export PYTHONPATH=$(pwd)/..
uvicorn main:app --reload &

# 5. Frontend local
cd ../frontend
npm install
npm run dev

# ✅ LISTO! Abrir http://localhost:5173
```

---

## 🆘 FAQ

### ¿Debo usar Docker en desarrollo?
**Depende**:
- **Sí**: Si todo el equipo usa diferentes OS (Windows/Mac/Linux)
- **No**: Si eres solo tú y prefieres velocidad de desarrollo

### ¿Kubernetes es necesario desde el inicio?
**NO**. Kubernetes es overkill para startups. Comienza con Docker Compose o Cloud Run.

### ¿Cuándo migrar a Kubernetes?
Cuando:
- Tengas > 100 usuarios concurrentes
- Necesites multi-region
- Tengas un DevOps en el equipo

### ¿Mejor cloud provider?
- **AWS**: Más features, más complejo
- **GCP**: Mejor DX (developer experience), más barato
- **Azure**: Mejor si ya usas Microsoft stack

**Mi favorito para tu caso**: **Google Cloud Run** (simple, económico, auto-scaling)

---

## 📚 Recursos Adicionales

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Google Cloud Run Quickstart](https://cloud.google.com/run/docs/quickstarts)
- [AWS ECS Guide](https://aws.amazon.com/ecs/)

---

**¿Listo para deployar? Empieza con `docker-compose.full.yml` y escala cuando lo necesites! 🚀**

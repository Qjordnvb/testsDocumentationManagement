# SCALABILITY PLAN - QA Documentation System

**Fecha**: 2025-11-23
**Estado**: MVP (20-30 empresas) → Producción (500+ empresas)

---

## 🚨 BOTTLENECKS CRÍTICOS

| Componente | Límite Actual | Problema |
|------------|---------------|----------|
| **SQLite** | 10 usuarios | File-level locking (1 escritura/vez) |
| **Gemini API** | 60 req/min | Rate limit compartido entre organizaciones |
| **Celery** | 4 workers | Solo 4 test cases simultáneos |
| **Backend** | 1 proceso | Single point of failure |

---

## 💰 OPTIMIZACIÓN DE COSTOS AI (CRÍTICO)

### Problema
- Sin caché: $500/mes para 100 empresas
- Gemini cobra por request (~$0.50-$5 por 1M tokens)

### Solución: Caché Inteligente (80% reducción)

```python
# Cache de resultados similares
cache_key = hash(story.title + story.description + criteria)
cached_tests = redis.get(f"ai_cache:{cache_key}")

if cached_tests:
    return cached_tests  # Ahorra 1 request a Gemini
```

**Impacto**: $500/mes → $100/mes (80% ahorro)

---

## 🎯 PLAN DE ESCALABILIDAD

### FASE 1: Quick Wins (Gratis - 1 semana)

✅ **Caché de IA** (Redis ya instalado)
```python
# Implementar en: backend/services/ai_cache_service.py
- TTL: 7 días
- Ahorro: 70-80% requests
```

✅ **Rate Limiting por Organización**
```python
# Prevenir que 1 empresa acapare todo
@limiter.limit("10/minute")  # Por organización
async def generate_tests():...
```

✅ **Batch Processing**
```python
# 1 request genera 10 test cases (vs 10 requests)
batch_results = gemini.generate_batch(stories[:10])
```

**Resultado**: Soportar 50 empresas con $100/mes

---

### FASE 2: PostgreSQL Migration (2-4 semanas)

✅ **Migrar a PostgreSQL**
```bash
# Setup
docker-compose.yml → postgres:16-alpine
alembic upgrade head

# Capacidad
- SQLite: 10 escrituras/seg
- Postgres: 10,000 escrituras/seg (1000x mejora)
```

**Resultado**: Soportar 200 empresas

---

### FASE 3: Distributed Architecture (1-3 meses)

✅ **Load Balancer (nginx)**
```nginx
upstream backend {
    server backend_1:8000;
    server backend_2:8000;
    server backend_3:8000;
}
```

✅ **Múltiples Gemini API Keys**
```python
# Rotar entre 3 keys
keys = [KEY_1, KEY_2, KEY_3]
# Capacidad: 3 × 2,000 req/min = 6,000 req/min
```

✅ **Auto-scaling Celery Workers**
```yaml
# Kubernetes HPA
minReplicas: 4
maxReplicas: 20
```

**Resultado**: Soportar 500+ empresas con 99.9% uptime

---

## 📊 COSTOS ESTIMADOS

### MVP (Actual)
| Recurso | Costo |
|---------|-------|
| Hosting | $10/mes |
| Gemini (free) | $0 |
| **Total** | **$10/mes** |

**Límite**: 20 empresas

---

### Producción Optimizada (100 empresas)
| Recurso | Costo |
|---------|-------|
| PostgreSQL (managed) | $50 |
| Backend (3 instancias) | $30 |
| Celery (auto-scale 4-10) | $30 |
| Gemini (con caché 80%) | $100 |
| Redis (caché) | $10 |
| **Total** | **$220/mes** |

**Revenue requerido**: $2.20/empresa/mes (break-even)

**Pricing sugerido**:
- Free: 5 test cases/mes
- Basic: $10/mes - 100 test cases
- Pro: $50/mes - 1,000 test cases
- Enterprise: Custom

---

## ✅ PRÓXIMOS PASOS INMEDIATOS

1. **HOY** (Gratis):
   - Implementar caché de IA (Redis ya existe)
   - Rate limiting por organización

2. **ESTA SEMANA** ($0):
   - Batch processing de prompts
   - Aumentar Celery a 10 workers

3. **PRÓXIMO MES** ($50):
   - Migrar a PostgreSQL
   - 3 Gemini API keys

---

**Última actualización**: 2025-11-23


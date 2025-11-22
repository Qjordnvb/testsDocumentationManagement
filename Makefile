# ============================================
# Makefile - Quality Mission Control
# ============================================
# Simplifica todos los comandos comunes
# Uso: make <comando>

.PHONY: help setup dev dev-docker prod test clean install-deps

# ==================== Help ====================
help: ## Muestra esta ayuda
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║         Quality Mission Control - Comandos Disponibles         ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ==================== Setup ====================
setup: ## 🔧 Configuración inicial completa (solo primera vez)
	@echo "🔧 Configurando proyecto..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ .env creado (EDITA tu GEMINI_API_KEY)"; \
	else \
		echo "⚠️  .env ya existe, no se sobrescribe"; \
	fi
	@mkdir -p data output uploads
	@echo "✅ Directorios creados"
	@$(MAKE) install-deps
	@echo ""
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║  ⚠️  IMPORTANTE: Edita .env y agrega tu GEMINI_API_KEY        ║"
	@echo "║     Luego ejecuta: make dev                                   ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"

install-deps: ## 📦 Instala todas las dependencias (Python + Node)
	@echo "📦 Instalando dependencias Python..."
	pip install -r requirements.txt
	@echo "📦 Instalando dependencias Node.js..."
	cd frontend && npm install
	@echo "✅ Dependencias instaladas"

# ==================== Development (Local) ====================
dev: ## 🚀 DESARROLLO LOCAL (4 terminales) - RECOMENDADO
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║  🚀 Iniciando modo DESARROLLO LOCAL                           ║"
	@echo "║                                                               ║"
	@echo "║  Este comando abrirá 4 terminales automáticamente:            ║"
	@echo "║    1. Redis (Docker)                                          ║"
	@echo "║    2. Celery Worker                                           ║"
	@echo "║    3. Backend (FastAPI)                                       ║"
	@echo "║    4. Frontend (React)                                        ║"
	@echo "║                                                               ║"
	@echo "║  Frontend: http://localhost:3000                              ║"
	@echo "║  Backend:  http://localhost:8000                              ║"
	@echo "║  API Docs: http://localhost:8000/docs                         ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@bash ./scripts/dev-start.sh

dev-stop: ## 🛑 Detiene desarrollo local
	@echo "🛑 Deteniendo servicios..."
	@echo "  🐳 Deteniendo Redis (Docker)..."
	@(command -v docker-compose > /dev/null && docker-compose down) || (docker compose down) || true
	@echo "  🔄 Deteniendo Celery Worker..."
	@pkill -9 -f "celery.*worker" 2>/dev/null || true
	@echo "  🐍 Deteniendo Backend (Puerto 8000)..."
	@lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
	@pkill -9 -f "uvicorn" 2>/dev/null || true
	@pkill -9 -f "python.*main:app" 2>/dev/null || true
	@echo "  ⚛️  Deteniendo Frontend (Puertos 3000/5173)..."
	@lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
	@lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null || true
	@pkill -9 -f "vite" 2>/dev/null || true
	@pkill -9 -f "npm.*dev" 2>/dev/null || true
	@echo "  🧹 Verificando limpieza..."
	@sleep 0.5
	@if lsof -i:8000 >/dev/null 2>&1; then echo "⚠️  Puerto 8000 aún ocupado"; else echo "  ✓ Puerto 8000 libre"; fi
	@if lsof -i:3000 >/dev/null 2>&1; then echo "⚠️  Puerto 3000 aún ocupado"; else echo "  ✓ Puerto 3000 libre"; fi
	@if lsof -i:5173 >/dev/null 2>&1; then echo "⚠️  Puerto 5173 aún ocupado"; else echo "  ✓ Puerto 5173 libre"; fi
	@echo "✅ Servicios detenidos"

# ==================== Development (Docker) ====================
dev-docker: ## 🐳 DESARROLLO con Docker (todo containerizado)
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║  🐳 Iniciando modo DESARROLLO DOCKER                          ║"
	@echo "║                                                               ║"
	@echo "║  Todos los servicios en containers:                           ║"
	@echo "║    - Redis                                                    ║"
	@echo "║    - Celery Worker                                            ║"
	@echo "║    - Backend (FastAPI)                                        ║"
	@echo "║    - Frontend (React)                                         ║"
	@echo "║                                                               ║"
	@echo "║  Frontend: http://localhost:3000                              ║"
	@echo "║  Backend:  http://localhost:8000                              ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@(command -v docker-compose > /dev/null && docker-compose -f docker-compose.full.yml up -d) || (docker compose -f docker-compose.full.yml up -d)
	@echo ""
	@echo "✅ Servicios iniciados. Ver logs: make logs"

dev-docker-stop: ## 🛑 Detiene desarrollo Docker
	@(command -v docker-compose > /dev/null && docker-compose -f docker-compose.full.yml down) || (docker compose -f docker-compose.full.yml down)

dev-docker-rebuild: ## 🔄 Rebuild containers Docker
	@(command -v docker-compose > /dev/null && docker-compose -f docker-compose.full.yml up -d --build) || (docker compose -f docker-compose.full.yml up -d --build)

# ==================== Production ====================
prod: ## 🏭 PRODUCCIÓN con Docker (optimizado)
	@echo "🏭 Iniciando modo PRODUCCIÓN..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Servicios de producción iniciados"

prod-stop: ## 🛑 Detiene producción
	docker-compose -f docker-compose.prod.yml down

# ==================== Logs ====================
logs: ## 📋 Ver logs de todos los servicios (Docker)
	@(command -v docker-compose > /dev/null && docker-compose -f docker-compose.full.yml logs -f) || (docker compose -f docker-compose.full.yml logs -f)

logs-backend: ## 📋 Ver logs del Backend
	@(command -v docker-compose > /dev/null && docker-compose -f docker-compose.full.yml logs -f backend) || (docker compose -f docker-compose.full.yml logs -f backend)

logs-celery: ## 📋 Ver logs del Celery Worker
	@(command -v docker-compose > /dev/null && docker-compose -f docker-compose.full.yml logs -f celery_worker) || (docker compose -f docker-compose.full.yml logs -f celery_worker)

logs-redis: ## 📋 Ver logs de Redis
	@(command -v docker-compose > /dev/null && docker-compose -f docker-compose.full.yml logs -f redis) || (docker compose -f docker-compose.full.yml logs -f redis)

logs-frontend: ## 📋 Ver logs del Frontend
	@(command -v docker-compose > /dev/null && docker-compose -f docker-compose.full.yml logs -f frontend) || (docker compose -f docker-compose.full.yml logs -f frontend)

# ==================== Testing ====================
test: ## 🧪 Corre tests
	@echo "🧪 Corriendo tests..."
	cd backend && pytest
	cd frontend && npm test

test-backend: ## 🧪 Tests del Backend
	cd backend && pytest

test-frontend: ## 🧪 Tests del Frontend
	cd frontend && npm test

# ==================== Database ====================
db-clear: ## 🗄️ Limpia TODOS los datos (mantiene estructura de tablas)
	@PYTHONPATH=. python clear_database.py

db-migrate: ## 🗄️ Migra a arquitectura multi-proyecto
	@PYTHONPATH=. python migrate_to_multiproject.py

db-reset: ## 🗄️ Resetea base de datos COMPLETAMENTE (⚠️ NUCLEAR)
	@echo "⚠️  Esto BORRARÁ la base de datos completamente. ¿Continuar? [y/N] " && read ans && [ $${ans:-N} = y ]
	@rm -f data/qa_automation.db
	@echo "✅ Base de datos eliminada. Se creará nueva al iniciar el backend."

db-status: ## 📊 Ver estadísticas de la base de datos
	@PYTHONPATH=. python -c "from backend.database.db import SessionLocal; from backend.database.models import ProjectDB, UserStoryDB, TestCaseDB; db = SessionLocal(); print(f'\n📊 Database Statistics:\n'); print(f'Projects: {db.query(ProjectDB).count()}'); print(f'User Stories: {db.query(UserStoryDB).count()}'); print(f'Test Cases: {db.query(TestCaseDB).count()}\n'); db.close()"

force-reset: ## 🔨 FUERZA detención + recrea base de datos (⚠️ SOLUCIÓN PROBLEMAS)
	@bash ./force_reset.sh

db-create-samples: ## 📁 Crea proyectos de ejemplo (PROJ-001, PROJ-002, PROJ-003)
	@PYTHONPATH=. python create_sample_projects.py

# ==================== Redis ====================
redis-start: ## 🔴 Inicia solo Redis (Docker)
	@(command -v docker-compose > /dev/null && docker-compose up redis -d) || (docker compose up redis -d)

redis-stop: ## 🛑 Detiene Redis
	@(command -v docker-compose > /dev/null && docker-compose down redis) || (docker compose down redis)

redis-cli: ## 💻 Abre Redis CLI
	@docker exec -it qa_redis redis-cli

# ==================== Celery ====================
celery-start: ## 🔄 Inicia solo Celery Worker (local)
	@echo "🔄 Iniciando Celery Worker..."
	@export PYTHONPATH=$(shell pwd) && celery -A backend.celery_app worker --loglevel=info --concurrency=4

celery-stop: ## 🛑 Detiene Celery Worker
	@pkill -f "celery.*worker" || echo "No Celery worker running"

celery-status: ## 📊 Ver estado de Celery
	@export PYTHONPATH=$(shell pwd) && celery -A backend.celery_app inspect active

# ==================== Cleanup ====================
clean: ## 🧹 Limpia archivos temporales y cache
	@echo "🧹 Limpiando archivos temporales..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -prune -o -type d -name ".vite" -exec rm -rf {} + 2>/dev/null || true
	rm -rf output/* uploads/*
	@echo "✅ Limpieza completada"

clean-docker: ## 🧹 Limpia containers y volúmenes Docker
	@(command -v docker-compose > /dev/null && docker-compose -f docker-compose.full.yml down -v) || (docker compose -f docker-compose.full.yml down -v)
	@docker system prune -f
	@echo "✅ Docker limpiado"

# ==================== Utilities ====================
status: ## 📊 Muestra estado de todos los servicios
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║                    Estado de Servicios                         ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "🐳 Docker Containers:"
	@docker ps --filter "name=qa_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "No containers running"
	@echo ""
	@echo "🐍 Backend (Puerto 8000):"
	@if lsof -i:8000 >/dev/null 2>&1; then echo "✅ Backend running"; else echo "❌ Backend NOT running"; fi
	@echo ""
	@echo "⚛️  Frontend (Puertos 3000/5173):"
	@if lsof -i:3000 >/dev/null 2>&1 || lsof -i:5173 >/dev/null 2>&1; then echo "✅ Frontend running"; else echo "❌ Frontend NOT running"; fi
	@echo ""
	@echo "🔄 Celery Workers:"
	@if ps aux | grep "[c]elery -A backend.celery_app worker" > /dev/null 2>&1; then echo "✅ Celery worker running"; else echo "❌ Celery worker NOT running"; fi

check: ## ✅ Verifica que todo esté listo para desarrollo
	@echo "✅ Verificando configuración..."
	@command -v docker >/dev/null 2>&1 || { echo "❌ Docker no instalado"; exit 1; }
	@command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 no instalado"; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "❌ Node.js no instalado"; exit 1; }
	@[ -f .env ] || { echo "⚠️  .env no existe. Corre: make setup"; exit 1; }
	@grep -q "your_gemini_api_key_here" .env && echo "⚠️  Necesitas configurar GEMINI_API_KEY en .env" || echo "✅ .env configurado"
	@echo "✅ Todo listo para desarrollo"

# ==================== Quick Actions ====================
quick-start: check redis-start ## ⚡ Inicio rápido (Redis + verificación)
	@echo "⚡ Inicio rápido completado. Ahora corre: make dev"

restart: dev-docker-stop dev-docker ## 🔄 Reinicia todos los servicios Docker

# ==================== Default ====================
.DEFAULT_GOAL := help

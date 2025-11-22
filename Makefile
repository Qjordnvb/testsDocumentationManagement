# ============================================
# Makefile - Quality Mission Control
# ============================================
# Comandos simples que FUNCIONAN
# Todo corre en Docker - nada local

.PHONY: help setup up down restart logs status clean reset-db

# ==================== Help ====================
help: ## Muestra ayuda
	@echo "╔════════════════════════════════════════════╗"
	@echo "║   Quality Mission Control - Comandos       ║"
	@echo "╚════════════════════════════════════════════╝"
	@echo ""
	@echo "Primera vez:"
	@echo "  make setup      - Configuración inicial (solo una vez)"
	@echo ""
	@echo "Comandos diarios:"
	@echo "  make up         - Iniciar todos los servicios"
	@echo "  make down       - Detener todos los servicios"
	@echo "  make restart    - Reiniciar servicios"
	@echo "  make logs       - Ver logs en tiempo real"
	@echo "  make status     - Ver estado de servicios"
	@echo ""
	@echo "Base de datos:"
	@echo "  make reset-db   - BORRAR base de datos y empezar limpio"
	@echo "  make clean      - Limpiar TODO (containers, volumes, DB)"
	@echo ""

# ==================== Setup ====================
setup: ## Configuración inicial (solo primera vez)
	@echo "🔧 Configurando Quality Mission Control..."
	@echo ""
	@echo "1️⃣  Verificando archivo .env..."
	@if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
			echo "    ✅ .env creado desde .env.example"; \
			echo "    ⚠️  IMPORTANTE: Edita .env y agrega tu GEMINI_API_KEY"; \
		else \
			echo "    ❌ ERROR: .env.example no encontrado"; \
			exit 1; \
		fi \
	else \
		echo "    ✅ .env ya existe"; \
	fi
	@echo ""
	@echo "2️⃣  Creando directorios necesarios..."
	@mkdir -p data output uploads logs
	@echo "    ✅ Directorios creados"
	@echo ""
	@echo "3️⃣  Construyendo containers Docker (esto puede tardar 2-3 minutos)..."
	@docker compose build
	@echo "    ✅ Containers construidos"
	@echo ""
	@echo "╔════════════════════════════════════════════╗"
	@echo "║          ✅ Setup Completado               ║"
	@echo "╚════════════════════════════════════════════╝"
	@echo ""
	@echo "📝 Próximos pasos:"
	@echo "   1. Edita .env y agrega tu GEMINI_API_KEY"
	@echo "   2. Ejecuta: make up"
	@echo "   3. Abre: http://localhost:3000"
	@echo ""

# ==================== Start ====================
up: ## Iniciar todos los servicios
	@echo "🚀 Iniciando servicios..."
	@docker compose up -d
	@echo ""
	@echo "✅ Servicios iniciados"
	@echo ""
	@echo "🌐 URLs:"
	@echo "   Frontend:  http://localhost:3000"
	@echo "   Backend:   http://localhost:8000"
	@echo "   API Docs:  http://localhost:8000/docs"
	@echo ""
	@echo "📋 Ver logs: make logs"

# ==================== Stop ====================
down: ## Detener todos los servicios
	@echo "🛑 Deteniendo servicios..."
	@docker compose down
	@echo "✅ Servicios detenidos"

# ==================== Restart ====================
restart: down up ## Reiniciar servicios

# ==================== Logs ====================
logs: ## Ver logs en tiempo real
	@docker compose logs -f

logs-backend: ## Ver logs del backend
	@docker compose logs -f backend

logs-frontend: ## Ver logs del frontend
	@docker compose logs -f frontend

logs-celery: ## Ver logs de celery
	@docker compose logs -f celery

# ==================== Status ====================
status: ## Ver estado de servicios
	@echo "╔════════════════════════════════════════════╗"
	@echo "║         Estado de Servicios                ║"
	@echo "╚════════════════════════════════════════════╝"
	@echo ""
	@docker compose ps
	@echo ""
	@echo "Puertos:"
	@if lsof -i:8000 >/dev/null 2>&1; then echo "  ✅ Backend:  http://localhost:8000"; else echo "  ❌ Backend NO está corriendo"; fi
	@if lsof -i:3000 >/dev/null 2>&1; then echo "  ✅ Frontend: http://localhost:3000"; else echo "  ❌ Frontend NO está corriendo"; fi

# ==================== Reset Database ====================
reset-db: ## BORRAR base de datos completamente
	@echo "⚠️  =========================================="
	@echo "⚠️   ADVERTENCIA: Esto borrará TODA la BD"
	@echo "⚠️  =========================================="
	@echo ""
	@echo "Presiona Ctrl+C para cancelar, o Enter para continuar..."
	@read -r confirm
	@echo ""
	@echo "1️⃣  Deteniendo servicios..."
	@docker compose down
	@echo ""
	@echo "2️⃣  Borrando archivos de base de datos..."
	@rm -f data/qa_automation.db data/qa_automation.db-shm data/qa_automation.db-wal
	@echo "    ✅ BD eliminada"
	@echo ""
	@echo "3️⃣  Iniciando servicios (BD se creará vacía)..."
	@docker compose up -d backend
	@echo ""
	@echo "✅ Base de datos reseteada"
	@echo ""
	@echo "📝 Ahora puedes:"
	@echo "   1. Crear un proyecto"
	@echo "   2. Subir Excel con user stories"
	@echo "   3. make up  (para iniciar frontend también)"

# ==================== Clean Everything ====================
clean: ## Limpiar TODO (containers, volumes, DB, logs)
	@echo "🧹 Limpiando TODO..."
	@echo ""
	@echo "1️⃣  Deteniendo y eliminando containers..."
	@docker compose down -v
	@echo ""
	@echo "2️⃣  Eliminando base de datos..."
	@rm -f data/qa_automation.db data/qa_automation.db-shm data/qa_automation.db-wal
	@echo ""
	@echo "3️⃣  Limpiando outputs y uploads..."
	@rm -rf output/* uploads/*
	@echo ""
	@echo "4️⃣  Limpiando logs..."
	@rm -rf logs/*
	@echo ""
	@echo "✅ TODO limpio"
	@echo ""
	@echo "Para iniciar de nuevo: make up"

# ==================== Build ====================
build: ## Rebuild containers
	@echo "🔨 Rebuilding containers..."
	@docker compose build
	@echo "✅ Build completado"

rebuild: down build up ## Stop, rebuild, start

# ==================== Database Tools ====================
db-status: ## Ver estadísticas de la BD
	@if [ -f "data/qa_automation.db" ]; then \
		echo "📊 Estadísticas de la BD:"; \
		echo ""; \
		docker compose exec backend python -c "\
from backend.database.db import SessionLocal; \
from backend.database.models import ProjectDB, UserStoryDB, TestCaseDB; \
db = SessionLocal(); \
print(f'Projects:      {db.query(ProjectDB).count()}'); \
print(f'User Stories:  {db.query(UserStoryDB).count()}'); \
print(f'Test Cases:    {db.query(TestCaseDB).count()}'); \
db.close()"; \
	else \
		echo "❌ Base de datos no existe"; \
	fi

# ==================== Default ====================
.DEFAULT_GOAL := help

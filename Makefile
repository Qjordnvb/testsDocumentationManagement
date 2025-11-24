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

# ==================== Database Management (NUEVO & MEJORADO) ====================

db-fresh: ## 🆕 Instalación LIMPIA (Borra todo -> Schema -> Admin -> Demo)
	@echo "🏗️  Iniciando instalación fresca Multi-Tenant..."
	@docker compose exec backend python backend/setup_database.py --fresh-install --yes
	@echo "✅ Sistema listo para usar."

db-migrate: ## 🔄 Migrar DB existente a Multi-Tenant
	@echo "🔧 Ejecutando migración de esquema..."
	@docker compose exec backend python backend/setup_database.py --migrate
	@echo "✅ Migración completada."

db-seed: ## 🌱 Cargar solo datos de prueba (en DB existente)
	@echo "📦 Cargando datos demo..."
	@docker compose exec backend python backend/setup_database.py --seed-demo --yes

db-admin: ## 👤 Crear usuario admin (si no existe)
	@echo "👤 Creando super admin..."
	@docker compose exec backend python backend/setup_database.py --create-admin --yes

reset-db: ## ⚠️  Resetear DB manteniendo conexión (Reemplaza al rm -f manual)
	@echo "⚠️  ADVERTENCIA: Esto borrará todos los datos."
	@docker compose exec backend python backend/setup_database.py --reset --yes

# Crea una instalación limpia con nombre personalizado
# Uso: make db-init ORG=ORG-COCA NAME="Coca Cola" EMAIL=admin@coca.com
db-init:
	@echo "🏗️  Creando organización inicial personalizada..."
	@docker compose exec backend python backend/setup_database.py \
		--fresh-install \
		--org-id "$(ORG)" \
		--org-name "$(NAME)" \
		--admin-email "$(EMAIL)" \
		--yes

# Agrega una NUEVA empresa sin borrar las anteriores
# Uso: make db-add ORG=ORG-PEPSI NAME="Pepsi Co" EMAIL=admin@pepsi.com
db-add:
	@echo "🏢 Agregando nueva organización..."
	@docker compose exec backend python backend/setup_database.py \
		--create-admin \
		--org-id "$(ORG)" \
		--org-name "$(NAME)" \
		--admin-email "$(EMAIL)" \
		--yes

# ==================== Database Tools (UTILIDADES DE LECTURA) ====================

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

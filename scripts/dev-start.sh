#!/bin/bash
# ============================================
# Development Start Script
# ============================================
# Inicia todos los servicios para desarrollo local

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Quality Mission Control - Development Start           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env no encontrado${NC}"
    echo -e "${YELLOW}Corre: make setup${NC}"
    exit 1
fi

# Check if GEMINI_API_KEY is configured
if grep -q "your_gemini_api_key_here" .env; then
    echo -e "${YELLOW}⚠️  Advertencia: GEMINI_API_KEY no configurado en .env${NC}"
    echo -e "${YELLOW}   La generación de test cases con IA no funcionará${NC}"
    echo ""
fi

# Create necessary directories
mkdir -p data output uploads logs

# Detect docker-compose vs docker compose and create function
if command -v docker-compose &> /dev/null; then
    echo -e "${BLUE}Using: docker-compose (V1)${NC}"
    docker_compose_cmd() {
        docker-compose "$@"
    }
elif command -v docker &> /dev/null && docker compose version &> /dev/null 2>&1; then
    echo -e "${BLUE}Using: docker compose (V2)${NC}"
    docker_compose_cmd() {
        docker compose "$@"
    }
else
    echo -e "${RED}❌ Error: Docker Compose no encontrado${NC}"
    echo -e "${YELLOW}Instala Docker Desktop o Docker Compose${NC}"
    exit 1
fi

echo ""

# ==================== 1. Start Redis ====================
echo -e "${GREEN}[1/4]${NC} Iniciando Redis (Docker)..."
docker_compose_cmd up redis -d > /dev/null 2>&1

# Wait for Redis to be ready
echo "      Esperando Redis..."
sleep 2

if docker ps | grep -q qa_redis; then
    echo -e "      ${GREEN}✅ Redis iniciado${NC}"
else
    echo -e "${RED}❌ Error: Redis no pudo iniciar${NC}"
    exit 1
fi

# ==================== 2. Start Celery Worker ====================
echo -e "${GREEN}[2/4]${NC} Iniciando Celery Worker..."

# Set PYTHONPATH
export PYTHONPATH=$(pwd)

# Kill existing celery workers
pkill -f "celery.*worker" 2>/dev/null || true
sleep 1

# Start Celery in background
nohup celery -A backend.celery_app worker --loglevel=info --concurrency=4 \
    > logs/celery.log 2>&1 &
CELERY_PID=$!

# Wait and check if Celery started
sleep 3
if ps -p $CELERY_PID > /dev/null; then
    echo -e "      ${GREEN}✅ Celery Worker iniciado (PID: $CELERY_PID)${NC}"
    echo "      📋 Logs: tail -f logs/celery.log"
else
    echo -e "${RED}❌ Error: Celery Worker no pudo iniciar${NC}"
    echo "      Ver logs: cat logs/celery.log"
    exit 1
fi

# ==================== 3. Start Backend ====================
echo -e "${GREEN}[3/4]${NC} Iniciando Backend (FastAPI)..."

# Kill existing uvicorn
pkill -f "uvicorn.*main:app" 2>/dev/null || true
sleep 1

# Start Backend in background
cd backend
nohup uvicorn main:app --reload --port 8000 \
    > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait and check if Backend started
sleep 3
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "      ${GREEN}✅ Backend iniciado (PID: $BACKEND_PID)${NC}"
    echo "      🌐 http://localhost:8000"
    echo "      📋 Logs: tail -f logs/backend.log"
else
    echo -e "${RED}❌ Error: Backend no pudo iniciar${NC}"
    echo "      Ver logs: cat logs/backend.log"
    exit 1
fi

# ==================== 4. Start Frontend ====================
echo -e "${GREEN}[4/4]${NC} Iniciando Frontend (React + Vite)..."

# Kill existing vite
pkill -f "vite" 2>/dev/null || true
sleep 1

# Start Frontend in background
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait and check if Frontend started
sleep 5
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "      ${GREEN}✅ Frontend iniciado (PID: $FRONTEND_PID)${NC}"
    echo "      🌐 http://localhost:5173"
    echo "      📋 Logs: tail -f logs/frontend.log"
else
    echo -e "${RED}❌ Error: Frontend no pudo iniciar${NC}"
    echo "      Ver logs: cat logs/frontend.log"
    exit 1
fi

# ==================== Summary ====================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   ✅ Todos los servicios iniciados              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Servicios:${NC}"
echo -e "   🔴 Redis:        docker ps | grep redis"
echo -e "   🔄 Celery:       PID $CELERY_PID"
echo -e "   🐍 Backend:      PID $BACKEND_PID  →  http://localhost:8000"
echo -e "   ⚛️  Frontend:     PID $FRONTEND_PID  →  http://localhost:5173"
echo ""
echo -e "${GREEN}📋 Logs:${NC}"
echo -e "   tail -f logs/celery.log"
echo -e "   tail -f logs/backend.log"
echo -e "   tail -f logs/frontend.log"
echo ""
echo -e "${GREEN}🌐 URLs:${NC}"
echo -e "   Frontend:  ${YELLOW}http://localhost:5173${NC}"
echo -e "   Backend:   ${YELLOW}http://localhost:8000${NC}"
echo -e "   API Docs:  ${YELLOW}http://localhost:8000/docs${NC}"
echo ""
echo -e "${GREEN}🛑 Para detener:${NC}"
echo -e "   make dev-stop"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"

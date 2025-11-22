#!/bin/bash
# check_services.sh - Diagnóstico de servicios corriendo

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           DIAGNÓSTICO DE SERVICIOS - Quality Mission Control    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Función para verificar puerto
check_port() {
    local port=$1
    local service=$2
    local expected_url=$3

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔍 Puerto $port - $service"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 1. Ver si el puerto está en uso
    if lsof -i :$port 2>/dev/null | grep -q LISTEN; then
        echo "✅ Puerto ACTIVO"
        echo ""
        echo "Proceso usando el puerto:"
        lsof -i :$port 2>/dev/null | head -5
        echo ""

        # 2. Intentar conexión HTTP
        http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port 2>/dev/null)
        if [ "$http_code" != "000" ]; then
            echo "✅ HTTP respondiendo: $http_code"
            if [ -n "$expected_url" ]; then
                echo "   Prueba: $expected_url"
            fi
        else
            echo "⚠️  Puerto abierto pero HTTP no responde"
        fi
    else
        echo "❌ Puerto INACTIVO (no hay proceso escuchando)"
        echo ""

        # Verificar si curl responde (podría ser cache)
        http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port 2>/dev/null)
        if [ "$http_code" != "000" ]; then
            echo "⚠️  ANOMALÍA: curl responde pero lsof no detecta proceso"
            echo "   Posible cache del navegador o proxy intermedio"
        fi
    fi
    echo ""
}

# Verificar puertos principales
check_port 3000 "Frontend (React + Vite)" "http://localhost:3000"
check_port 8000 "Backend (FastAPI)" "http://localhost:8000/docs"
check_port 6379 "Redis" ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Procesos relacionados"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Python/Uvicorn
echo "🐍 Python/Uvicorn:"
if pgrep -f "uvicorn" > /dev/null 2>&1; then
    ps aux | grep -E "uvicorn" | grep -v grep
else
    echo "   ❌ No hay procesos uvicorn"
fi
echo ""

# Node/Vite/NPM
echo "⚛️  Node/Vite/NPM:"
if pgrep -f "vite" > /dev/null 2>&1 || pgrep -f "npm.*dev" > /dev/null 2>&1; then
    ps aux | grep -E "(node.*vite|npm.*dev)" | grep -v grep
else
    echo "   ❌ No hay procesos vite/npm"
fi
echo ""

# Celery
echo "🔄 Celery:"
if pgrep -f "celery" > /dev/null 2>&1; then
    ps aux | grep -E "celery" | grep -v grep
else
    echo "   ❌ No hay procesos celery"
fi
echo ""

# Redis
echo "🔴 Redis:"
if pgrep -f "redis-server" > /dev/null 2>&1; then
    ps aux | grep -E "redis-server" | grep -v grep
else
    echo "   ❌ No hay procesos redis"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Contar servicios activos
active_count=0
if lsof -i :3000 2>/dev/null | grep -q LISTEN; then
    echo "✅ Frontend (puerto 3000) - CORRIENDO"
    active_count=$((active_count+1))
else
    echo "❌ Frontend (puerto 3000) - DETENIDO"
fi

if lsof -i :8000 2>/dev/null | grep -q LISTEN; then
    echo "✅ Backend (puerto 8000) - CORRIENDO"
    active_count=$((active_count+1))
else
    echo "❌ Backend (puerto 8000) - DETENIDO"
fi

if lsof -i :6379 2>/dev/null | grep -q LISTEN; then
    echo "✅ Redis (puerto 6379) - CORRIENDO"
    active_count=$((active_count+1))
else
    echo "❌ Redis (puerto 6379) - DETENIDO"
fi

if pgrep -f "celery.*worker" > /dev/null 2>&1; then
    echo "✅ Celery Worker - CORRIENDO"
    active_count=$((active_count+1))
else
    echo "❌ Celery Worker - DETENIDO"
fi

echo ""
echo "Total: $active_count/4 servicios activos"
echo ""

if [ $active_count -eq 0 ]; then
    echo "💡 Ningún servicio está corriendo. Para iniciar:"
    echo "   make dev"
elif [ $active_count -eq 4 ]; then
    echo "💡 Todos los servicios están corriendo correctamente."
else
    echo "⚠️  Algunos servicios están corriendo. Para detener todos:"
    echo "   make dev-stop    (o)    make force-reset"
    echo ""
    echo "   Para iniciar todos:"
    echo "   make dev"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Si tu navegador muestra contenido pero los puertos están"
echo "   INACTIVOS, es porque tienes CACHE del navegador activo."
echo ""
echo "   Solución:"
echo "   1. Abre DevTools (F12)"
echo "   2. Network tab → marca 'Disable cache'"
echo "   3. Hard reload (Ctrl+Shift+R o Cmd+Shift+R)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

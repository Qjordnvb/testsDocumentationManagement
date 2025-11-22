#!/bin/bash
# force_reset.sh - Fuerza la detención de servicios y recrea la base de datos

set -e  # Exit on error

echo "🛑 ========================================="
echo "🛑  FORCE RESET - Deteniendo TODOS los servicios"
echo "🛑 ========================================="

# 1. Matar TODOS los procesos relacionados
echo ""
echo "1️⃣  Matando procesos Python/Uvicorn..."
pkill -9 -f "uvicorn" 2>/dev/null || true
pkill -9 -f "python.*main.py" 2>/dev/null || true
pkill -9 -f "celery" 2>/dev/null || true

echo "2️⃣  Matando procesos Node/Vite/Frontend..."
pkill -9 -f "vite" 2>/dev/null || true
pkill -9 -f "node.*vite" 2>/dev/null || true
pkill -9 -f "npm.*dev" 2>/dev/null || true

echo "3️⃣  Matando procesos Redis..."
pkill -9 -f "redis-server" 2>/dev/null || true

# 2. Liberar puertos
echo "4️⃣  Liberando puertos 3000, 8000, 6379..."
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:6379 2>/dev/null | xargs kill -9 2>/dev/null || true

# 3. Esperar un momento
echo "5️⃣  Esperando 2 segundos..."
sleep 2

# 4. Verificar que los puertos están libres
echo ""
echo "📊 Verificando puertos..."
PORTS_IN_USE=$(lsof -i :3000 -i :8000 -i :6379 2>/dev/null | wc -l)
if [ "$PORTS_IN_USE" -gt 0 ]; then
    echo "⚠️  ADVERTENCIA: Algunos puertos aún están en uso:"
    lsof -i :3000 -i :8000 -i :6379 2>/dev/null || true
    echo ""
    echo "⚠️  Intentando matar de nuevo..."
    lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:6379 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo "✅ Todos los servicios detenidos"
echo ""

# 5. Eliminar base de datos
echo "🗄️  ========================================="
echo "🗄️   ELIMINANDO BASE DE DATOS"
echo "🗄️  ========================================="

if [ -f "data/qa_automation.db" ]; then
    echo "📍 Base de datos encontrada: data/qa_automation.db"

    # Verificar schema actual
    echo "📊 Schema ACTUAL (VIEJO):"
    python3 -c "
import sqlite3
try:
    conn = sqlite3.connect('data/qa_automation.db')
    cursor = conn.cursor()
    cursor.execute(\"SELECT sql FROM sqlite_master WHERE type='table' AND name='user_stories'\")
    result = cursor.fetchone()
    if result:
        print(result[0])
    conn.close()
except Exception as e:
    print(f'Error: {e}')
" || true

    echo ""
    echo "🗑️  Eliminando base de datos vieja..."
    rm -f data/qa_automation.db
    rm -f data/qa_automation.db-shm
    rm -f data/qa_automation.db-wal

    if [ -f "data/qa_automation.db" ]; then
        echo "❌ ERROR: No se pudo eliminar la base de datos"
        echo "   Puede estar bloqueada por algún proceso"
        exit 1
    else
        echo "✅ Base de datos eliminada"
    fi
else
    echo "ℹ️  Base de datos no existe (ya estaba limpia)"
fi

echo ""

# 6. Recrear base de datos con nuevo schema
echo "🔨 ========================================="
echo "🔨  RECREANDO BASE DE DATOS CON COMPOSITE KEYS"
echo "🔨 ========================================="

echo "1️⃣  Ejecutando migración..."
PYTHONPATH=. python3 migrate_to_multiproject.py <<EOF
yes
EOF

echo ""
echo "2️⃣  Verificando nuevo schema..."
python3 -c "
import sqlite3
try:
    conn = sqlite3.connect('data/qa_automation.db')
    cursor = conn.cursor()
    cursor.execute(\"SELECT sql FROM sqlite_master WHERE type='table' AND name='user_stories'\")
    result = cursor.fetchone()
    if result:
        schema = result[0]
        print('📊 Schema NUEVO:')
        print(schema)
        print()

        # Verificar que tiene composite key
        if 'PRIMARY KEY (id, project_id)' in schema:
            print('✅ Composite primary key DETECTADO correctamente')
            print('✅ Ahora puedes tener mismo ID en diferentes proyectos')
        else:
            print('❌ ERROR: No se detectó composite primary key')
            print('   Schema puede estar incorrecto')
    else:
        print('❌ Tabla user_stories no encontrada')
    conn.close()
except Exception as e:
    print(f'❌ Error verificando schema: {e}')
"

echo ""
echo "🎉 ========================================="
echo "🎉  RESET COMPLETADO"
echo "🎉 ========================================="
echo ""
echo "✅ Servicios detenidos"
echo "✅ Base de datos eliminada"
echo "✅ Base de datos recreada con composite keys"
echo ""
echo "📝 Próximos pasos:"
echo "   1. make dev              # Iniciar servicios"
echo "   2. Subir Excel a PROJ-002"
echo "   3. Verificar que NO hay error UNIQUE constraint"
echo ""

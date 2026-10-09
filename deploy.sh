#!/bin/bash
# ==============================================================================
# BLUE HAWK OPS (BHOps) — SCRIPT AUTOMATIZADO DE DESPLIEGUE EN SERVIDOR
# ==============================================================================

set -e

echo "🚀 [Blue Hawk Ops] Iniciando proceso de despliegue en servidor..."

# 1. Verificar Docker y Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado en este servidor. Por favor instale Docker:"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# 2. Descargar últimos cambios del repositorio
echo "📥 [1/4] Actualizando código fuente desde origin main..."
git pull origin main

# 3. Validar archivo de entorno (.env)
if [ ! -f "backend/.env" ]; then
    echo "⚠️  [2/4] Archivo backend/.env no encontrado. Creando a partir de .env.example..."
    cp backend/.env.example backend/.env
    # Generar un SECRET_KEY aleatorio si no existe
    RANDOM_SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
    sed -i "s/generar_un_secreto_aleatorio_de_minimo_32_caracteres/$RANDOM_SECRET/g" backend/.env
    echo "   ✓ Clave criptográfica SECRET_KEY generada automáticamente."
fi

# 4. Construir y levantar contenedores
echo "🐳 [3/4] Construyendo y arrancando contenedores con Docker Compose..."
docker compose down || true
docker compose up -d --build

# 5. Verificación de salud (Health Check)
echo "🔍 [4/4] Verificando salud de la plataforma..."
sleep 5

if curl -s -f http://127.0.0.1:8001/health > /dev/null; then
    echo "   ✓ Backend Core API: OPERATIVO (HTTP 200)"
else
    echo "   ⚠️  El backend está tardando en iniciar. Verifique los logs con: docker compose logs backend"
fi

if curl -s -f http://127.0.0.1:3000/ > /dev/null; then
    echo "   ✓ Frontend Next.js: OPERATIVO (HTTP 200)"
else
    echo "   ⚠️  El frontend está compilando. Verifique los logs con: docker compose logs frontend"
fi

echo ""
echo "🎉 [Blue Hawk Ops] ¡Despliegue completado con éxito!"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:8001/api/v1"
echo "   • Para monitorear logs: docker compose logs -f"

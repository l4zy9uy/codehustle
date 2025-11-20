#!/bin/bash
set -euo pipefail

echo "🚀 Starting CodeHustle deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Make sure to create one with production values."
    echo "   You can copy from .env.example if available."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

IMAGE_TAG="${IMAGE_TAG:-latest}"
export IMAGE_TAG
echo "🏷️  Using image tag: ${IMAGE_TAG}"

# Pull prebuilt images if available
echo "📥 Pulling Docker images (backend, judge-worker, frontend)..."
if docker-compose pull backend judge-worker frontend; then
    echo "✅ Pulled application images successfully."
else
    echo "⚠️  Pull failed (likely missing registry credentials). Falling back to local build..."
    docker-compose build backend judge-worker frontend
fi

echo "🔄 Starting services..."
docker-compose up -d --remove-orphans

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo "📊 Service status:"
docker-compose ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Check logs: docker-compose logs -f"
echo "   2. Verify services: docker-compose ps"
echo "   3. Check backend health: curl http://localhost:8081/swagger/index.html"
echo "   4. Check frontend: http://localhost"
echo ""
echo "🔍 Useful commands:"
echo "   - View logs: docker-compose logs -f [service-name]"
echo "   - Stop services: docker-compose down"
echo "   - Restart service: docker-compose restart [service-name]"







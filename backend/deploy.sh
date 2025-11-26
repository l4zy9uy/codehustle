#!/bin/bash
set -euo pipefail

echo "Starting CodeHustle deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Make sure to create one with production values."
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

SERVICES="backend judge-worker cadvisor cloudflared"
FRONTEND_DIR="../frontend"

# Pull prebuilt images if available
echo "📥 Pulling Docker images (${SERVICES})..."
if docker-compose pull ${SERVICES}; then
    echo "Pulled application images successfully."
else
    echo "⚠Pull failed (likely missing registry credentials). Falling back to local build..."
    docker-compose build ${SERVICES}
fi

echo "Starting services..."
docker-compose up -d --remove-orphans

echo "Building & starting frontend..."
(
  cd "${FRONTEND_DIR}"
  docker-compose build frontend
  docker-compose up -d frontend
)

echo "Waiting for services to be healthy..."
sleep 10

# Check service status
echo "Service status:"
docker-compose ps

echo ""
echo "Deployment complete!"
echo ""

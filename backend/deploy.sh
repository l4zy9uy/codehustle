#!/bin/bash
set -euo pipefail

echo "Starting CodeHustle deployment..."

to_bool() {
    case "$(echo "${1:-}" | tr '[:upper:]' '[:lower:]')" in
        1|y|yes|true) echo "true" ;;
        *) echo "false" ;;
    esac
}

DEPLOY_BACKEND=$(to_bool "${DEPLOY_BACKEND:-true}")
DEPLOY_FRONTEND=$(to_bool "${DEPLOY_FRONTEND:-true}")
echo "Deploy backend stack: ${DEPLOY_BACKEND}"
echo "Deploy frontend stack: ${DEPLOY_FRONTEND}"

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

SERVICES="backend caddy judge-worker cadvisor cloudflared"
FRONTEND_DIR="../frontend"

if [ "$DEPLOY_BACKEND" = "true" ]; then
    if [ -n "${REGISTRY_USERNAME:-}" ] && [ -n "${REGISTRY_PASSWORD:-}" ]; then
        echo "Logging into container registry..."
        echo "${REGISTRY_PASSWORD}" | docker login ghcr.io -u "${REGISTRY_USERNAME}" --password-stdin
    fi

    echo "📥 Pulling Docker images (${SERVICES})..."
    if docker-compose pull ${SERVICES}; then
        echo "Pulled application images successfully."
    else
        echo "⚠Pull failed (likely missing registry credentials). Falling back to local build..."
        docker-compose build ${SERVICES}
    fi

    echo "Starting backend services..."
    docker-compose up -d --remove-orphans
else
    echo "Skipping backend services (DEPLOY_BACKEND=false)"
fi

if [ "$DEPLOY_FRONTEND" = "true" ]; then
    echo "Building & starting frontend..."
    (
      cd "${FRONTEND_DIR}"
      docker-compose build frontend
      docker-compose up -d frontend
    )
else
    echo "Skipping frontend deployment (DEPLOY_FRONTEND=false)"
fi

if [ "$DEPLOY_BACKEND" = "true" ] || [ "$DEPLOY_FRONTEND" = "true" ]; then
    echo "Waiting for services to be healthy..."
    sleep 10

    # Check service status
    echo "Service status:"
    docker-compose ps
fi

echo ""
echo "Deployment complete!"
echo ""

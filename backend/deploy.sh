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
RECREATE_CADDY=$(to_bool "${RECREATE_CADDY:-false}")
echo "Deploy backend stack: ${DEPLOY_BACKEND}"
echo "Deploy frontend stack: ${DEPLOY_FRONTEND}"
echo "Recreate Caddy container: ${RECREATE_CADDY}"

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

if [ "$DEPLOY_BACKEND" = "true" ] || [ "$DEPLOY_FRONTEND" = "true" ]; then
    if [ -n "${REGISTRY_USERNAME:-}" ] && [ -n "${REGISTRY_PASSWORD:-}" ]; then
        echo "Logging into container registry..."
        echo "${REGISTRY_PASSWORD}" | docker login ghcr.io -u "${REGISTRY_USERNAME}" --password-stdin
    fi
fi

if [ "$DEPLOY_BACKEND" = "true" ]; then
    echo "📥 Pulling Docker images (${SERVICES})..."
    if docker-compose pull ${SERVICES}; then
        echo "Pulled application images successfully."
    else
        echo "⚠Pull failed (likely missing registry credentials). Falling back to local build..."
        docker-compose build ${SERVICES}
    fi

    echo "Starting backend services..."
    docker-compose up -d --remove-orphans

    # Force recreate Caddy container if Caddyfile changed
    if [ "$RECREATE_CADDY" = "true" ]; then
        echo "🔄 Caddyfile changed - forcing recreation of Caddy container..."
        docker-compose up -d --force-recreate --no-deps caddy
        echo "✓ Caddy container recreated with new Caddyfile"
    fi
else
    echo "Skipping backend services (DEPLOY_BACKEND=false)"
fi

if [ "$DEPLOY_FRONTEND" = "true" ]; then
    echo "Pulling & starting frontend..."
    (
      cd "${FRONTEND_DIR}"
      docker-compose pull frontend
      docker-compose up -d --remove-orphans frontend
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

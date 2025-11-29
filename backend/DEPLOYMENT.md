# Deployment Guide

This guide covers deploying CodeHustle to production.

## Prerequisites

- Docker and Docker Compose installed
- Production server with sufficient resources
- Domain names configured (app.codehustle.space, api.codehustle.space)
- Cloudflare tunnel token (if using Cloudflare Tunnel)
- Google OAuth credentials

## Quick Start

1. **Clone the repository** on your production server:
   ```bash
   git clone <your-repo-url>
   cd codehustle/backend
   ```

2. **Create production environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your production values (or pull them from your secret store)
   ```

3. **Deploy**:
   ```bash
   ./deploy.sh
   ```

## Manual Deployment Steps

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory with production values (copy from `.env.example` as a template). Keep the real values in your secret manager and inject them during deployment:

```env
ENV=production
PUBLIC_DOMAIN=codehustle.space          # set once; auto-fills FRONTEND_URL, VITE_API_HOST, GOOGLE_REDIRECT_URI
JWT_SECRET=<generate-strong-random-secret>
DB_NAME=codehustle
DB_USER=app
DB_PASSWORD=<strong-password>
MYSQL_ROOT_PASSWORD=<strong-root-password>
MINIO_ROOT_USER=<minio-user>
MINIO_ROOT_PASSWORD=<strong-minio-password>
REDIS_PASSWORD=<optional-redis-password>
FRONTEND_URL=https://app.codehustle.space
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://api.codehustle.space/api/v1/auth/google/callback
VITE_API_BASE_URL=/api
VITE_API_HOST=https://api.codehustle.space
VITE_GOOGLE_CLIENT_ID=<your-client-id>
CADDY_HTTP_PORT=80
CADDY_HTTPS_PORT=443
TUNNEL_TOKEN=<cloudflare-tunnel-token>
LOG_LEVEL=info
LOG_FORMAT=json
IMAGE_TAG=latest
BACKEND_IMAGE_REPO=ghcr.io/<your-org>/codehustle-backend
FRONTEND_IMAGE_REPO=ghcr.io/<your-org>/codehustle-frontend
```

Tip: set `PUBLIC_DOMAIN` once (e.g., `codehustle.space`) and leave `FRONTEND_URL`, `VITE_API_HOST`, and `GOOGLE_REDIRECT_URI` blank in your vaulted vars; the Ansible template fills them based on that domain.

**Important**: Generate a strong JWT_SECRET:
```bash
openssl rand -base64 32
```

### Secret Management

- **GitHub Actions**: Store production values as encrypted repository or organization secrets. Workflows can reference them via `${{ secrets.YOUR_KEY }}` so credentials never live in git history.
- **DigitalOcean**: Mirror the same keys as App Platform config vars, Droplet metadata, or Kubernetes secrets so the platform injects them at runtime.
- **Developers**: Copy `.env.example` → `.env` locally and pull the sensitive values from the approved vault/password manager. Never commit `.env`; the root `.gitignore` keeps it untracked.
- **Rotation**: When secrets change, update both GitHub and DigitalOcean stores and refresh `.env.example` if new keys are needed.

### 2. Build and Start Services (manual server)

```bash
cd backend
chmod +x deploy.sh
./deploy.sh
```

The script attempts to pull pre-built images (`BACKEND_IMAGE_REPO`, `FRONTEND_IMAGE_REPO`) tagged with `IMAGE_TAG`. If the registry pull fails (for example on a dev laptop), it falls back to building the images locally before running `docker-compose up -d`.

### 3. Verify Deployment

Check service status:
```bash
docker-compose ps
```

View logs:
```bash
docker-compose logs -f
```

Test endpoints:
- Frontend: `http://app.codehustle.space` (or via Cloudflare tunnel)
- API: `http://api.codehustle.space/api/v1/health` (if health endpoint exists)
- Swagger: `http://api.codehustle.space/swagger/index.html`

## CI/CD Deployment Flow

- `Manual Deploy` workflow (`.github/workflows/deploy.yml`) builds the backend and frontend Docker images, pushes them to GitHub Container Registry (GHCR), then SSHes into each production host defined in `DEPLOY_TARGETS`.
- Hosts clone/pull this repository, check out the exact commit that was built, and execute `backend/deploy.sh` with the matching `IMAGE_TAG`. The script pulls the GHCR images and restarts the stack.
- Required GitHub secrets:
  - `DEPLOY_TARGETS`: JSON array (`[{ "name": "prod-a", "host": "xx.xx.xx.xx", "user": "root", "path": "/srv/codehustle", "port": "22" }, ...]`)
  - `DEPLOY_SSH_KEY` (+ optional `DEPLOY_SSH_KEY_PASSPHRASE`): private key that can SSH into every host listed in `DEPLOY_TARGETS`
  - `REGISTRY_USERNAME` / `REGISTRY_PASSWORD`: credentials with `read:packages` access to GHCR (used on the droplet to `docker login`)
- Optional: limit a run to one host by providing its `name` when triggering the workflow; otherwise every host in the matrix deploys in parallel.

## Provisioning Hosts with Ansible

Instead of configuring each server manually, run the playbook in `infra/ansible/playbook.yml`:

```bash
cp infra/ansible/inventory.example infra/ansible/inventory.prod
# edit inventory.prod with host IPs, SSH users, repo paths, etc.
ansible-playbook -i infra/ansible/inventory.prod infra/ansible/playbook.yml \
  -e backend_env_content="$(cat backend/.env)"
```

The playbook installs Docker + Compose, creates the deploy user, and clones this repo at the desired path so the GitHub Actions deploy workflow can simply pull images and restart the stack.

## Architecture

```
Internet
  ↓
Cloudflare Tunnel (cloudflared)
  ↓
Caddy (Reverse Proxy)
  ├─→ Frontend (Static Files) - app.codehustle.space
  └─→ Backend API - api.codehustle.space
       ├─→ MySQL Database
       ├─→ Redis (Queue)
       ├─→ MinIO (Object Storage)
       └─→ Piston (Code Executor)
  └─→ Judge Worker (Processes submissions)
```

## Service Details

### Backend (`codehustle-backend`)
- Go API server
- Port: 8081 (internal)
- Handles API requests

### Judge Worker (`codehustle-judge-worker`)
- Processes code submission jobs from Redis
- Runs in separate container for scalability

### Frontend (`codehustle-frontend`)
- React application built with Vite
- Served via Caddy
- Port: 80 (internal)

### Caddy (`caddy`)
- Reverse proxy and SSL termination
- Routes requests to frontend and backend
- Ports: 80, 443 (host)

### MySQL (`codehustle-mysql`)
- Database server
- Port: 3306 (internal)
- Data persisted in `mysql_data` volume

### Redis (`codehustle-redis`)
- Message queue for judge jobs
- Port: 6379 (internal)
- Data persisted in `redis_data` volume

### MinIO (`codehustle-minio`)
- Object storage for problem statements, test cases, etc.
- Ports: 9000 (API), 9001 (Console) - internal
- Data persisted in `minio_data` volume

### Piston (`codehustle-piston`)
- Code execution engine
- Port: 2000 (internal)
- Requires privileged mode

## Updating Deployment

1. **Pull latest code**:
   ```bash
   git pull
   ```

2. **Rebuild and restart**:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

3. **Restart specific service**:
   ```bash
   docker-compose restart backend
   ```

## Troubleshooting

### Services won't start
- Check logs: `docker-compose logs [service-name]`
- Verify `.env` file has all required variables
- Check port conflicts: `netstat -tulpn | grep :80`

### Database connection errors
- Ensure MySQL is healthy: `docker-compose ps mysql`
- Check MySQL logs: `docker-compose logs mysql`
- Verify DB credentials in `.env`

### Frontend not loading
- Check Caddy logs: `docker-compose logs caddy`
- Verify Caddyfile syntax
- Check frontend build: `docker-compose logs frontend`

### Judge worker not processing jobs
- Check Redis connection: `docker-compose logs redis`
- Verify judge-worker logs: `docker-compose logs judge-worker`
- Check Piston is accessible: `docker-compose logs piston`

## Backup

### Database Backup
```bash
docker-compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} codehustle > backup.sql
```

### Restore Database
```bash
docker-compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} codehustle < backup.sql
```

### MinIO Data Backup
The MinIO data is stored in the `minio_data` Docker volume. Backup the volume:
```bash
docker run --rm -v codehustle_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio_backup.tar.gz /data
```

## Scaling

To scale judge workers:
```bash
docker-compose up -d --scale judge-worker=3
```

## Security Notes

- Change all default passwords in production
- Use strong JWT_SECRET
- Keep `.env` file secure (don't commit to git)
- Regularly update Docker images
- Monitor logs for suspicious activity
- Configure firewall rules appropriately

## Monitoring

View all logs:
```bash
docker-compose logs -f
```

View specific service logs:
```bash
docker-compose logs -f backend
docker-compose logs -f judge-worker
```

Check resource usage:
```bash
docker stats
```





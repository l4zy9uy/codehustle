FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL=/api
ARG VITE_API_HOST=http://localhost:8081
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_ENABLE_API_MOCKS=false

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_HOST=$VITE_API_HOST
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_ENABLE_API_MOCKS=$VITE_ENABLE_API_MOCKS

# Build the application
RUN npm run build

# Runtime stage: serve built assets with Caddy
FROM caddy:2-alpine AS runtime
WORKDIR /srv

# Copy built assets
COPY --from=builder /app/dist /srv

# Caddy config for SPA routing and API proxy
COPY Caddyfile /etc/caddy/Caddyfile

# Expose HTTP
EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

# Output is in /app/dist - this will be uploaded to R2

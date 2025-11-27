# Build stage
FROM golang:1.24-alpine AS builder

# Install build dependencies for CGO (needed for containerd client)
RUN apk add --no-cache gcc musl-dev

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build server binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server/main.go

# Build judge-worker binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/judge-worker ./cmd/judge-worker/main.go

# Build container-metadata-exporter binary (requires CGO for containerd client)
RUN CGO_ENABLED=1 GOOS=linux go build -o /app/container-metadata-exporter ./cmd/container-metadata-exporter/main.go

# Runtime stage
FROM alpine:latest

# Install ca-certificates (CGO binary will use musl libc which is already in Alpine)
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binaries from builder
COPY --from=builder /app/server /app/judge-worker /app/container-metadata-exporter ./

# Copy SQL migrations so golang-migrate can find them at runtime
COPY --from=builder /app/internal/db/migrations ./internal/db/migrations

# Default command runs server
CMD ["./server"]

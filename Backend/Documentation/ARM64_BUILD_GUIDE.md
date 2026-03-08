# ARM64 Docker Build Guide

This guide explains how to build and deploy Docker images for ARM64 devices (Jetson Nano, Turing RK1).

## Architecture

```
Frontend (React)          Backend (.NET)           Database (PostgreSQL)
  Node:20                 .NET 10 Runtime          Postgres:16
  Alpine ARM64            ARM64                    Alpine ARM64
```

## Prerequisites

- Docker 20.10+ (with buildx support)
- For cross-platform builds: QEMU emulation
- At least 4GB free disk space (build cache)

## Quick Start

### 1. Setup (One-time)

```bash
cd Backend

# Make scripts executable
chmod +x setup-buildx.sh build-arm64.sh

# Setup Docker buildx for multi-architecture builds
./setup-buildx.sh
```

### 2. Build for ARM64

**Option A: Build locally for testing**
```bash
cd Backend
./build-arm64.sh
```

**Option B: Build for specific registry**
```bash
export REGISTRY="your-registry.com"
./build-arm64.sh
```

**Option C: Manual Docker Compose build**
```bash
cd Backend
docker-compose build --platform linux/arm64
```

### 3. Run Locally

```bash
cd Backend

# Start all services (DB, API, Frontend)
docker-compose up

# Services available at:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:5001
# Database:  localhost:5432
```

## Building for Multiple Architectures

To build images that work on both ARM64 and AMD64 (for flexibility):

```bash
# Backend
docker buildx build \
  --platform linux/arm64,linux/amd64 \
  -t your-registry/health-api:latest \
  --push \
  .

# Frontend
docker buildx build \
  --platform linux/arm64,linux/amd64 \
  -t your-registry/health-frontend:latest \
  --push \
  ../Frontend
```

## Deploying to Jetson Nano / Turing RK1

### 1. On your target device:

```bash
# Verify architecture
uname -m
# Should output: aarch64

# Pull and run images
docker run -p 3000:3000 your-registry/health-frontend:arm64
docker run -p 5001:8080 your-registry/health-api:arm64
```

### 2. Using Kubernetes (with Envoy):

```bash
# Apply Gateway and HTTPRoute (as discussed)
kubectl apply -f k8s-gateway.yaml
kubectl apply -f k8s-httproute.yaml

# Deploy services
kubectl apply -f k8s-backend.yaml
kubectl apply -f k8s-frontend.yaml
kubectl apply -f k8s-postgres.yaml
```

## Troubleshooting

### Build fails with "no matching manifest"
- Ensure images have ARM64 tag: use `--platform linux/arm64`
- May need to rebuild: `docker buildx build --no-cache`

### Image too large
- Current size: ~300MB (backend), ~150MB (frontend)
- Alpine base images keep size minimal
- Consider using multi-stage builds (already implemented)

### QEMU errors during cross-platform build
```bash
# Reinstall QEMU support
docker run --rm --privileged tonistiigi/binfmt --install all
```

## Registry Setup

If using a private registry on your network:

```bash
# On registry host (or use Docker Hub)
docker run -d \
  -p 5000:5000 \
  --restart always \
  registry:2

# Configure Docker on Jetson to trust insecure registry
# Edit /etc/docker/daemon.json:
{
  "insecure-registries": ["your-registry:5000"]
}

# Push images
docker tag health-api:arm64 your-registry:5000/health-api:arm64
docker push your-registry:5000/health-api:arm64
```

## Performance Notes

- Jetson Nano: ~15-20 min for full build (limited CPU/RAM)
- Turing RK1: ~5-10 min for full build
- Subsequent builds faster due to Docker layer caching

## Files Modified

- `Dockerfile` - Added `--platform=linux/arm64` for .NET SDK
- `../Frontend/Dockerfile` - Added Node.js ARM64 Dockerfile
- `docker-compose.yml` - Added platform declarations and frontend service
- `build-arm64.sh` - Build script for ARM64 images
- `setup-buildx.sh` - Docker buildx setup script

## Next Steps

1. Create Kubernetes manifests (.yaml files) for deployment
2. Set up container registry (Docker Hub or private)
3. Configure network routing via Envoy Gateway
4. Test on physical Jetson/Turing device

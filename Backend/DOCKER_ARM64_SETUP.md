# Docker ARM64 Setup - Summary

## What Was Created

### 1. **Updated Dockerfiles (ARM64 compatible)**

#### Backend Dockerfile (`Dockerfile`)
- Added `--platform=linux/arm64` directive to both build and runtime stages
- Uses .NET SDK 10.0 and ASP.NET Runtime 10.0 (ARM64 compatible)
- Multi-stage build for optimized image size
- Output: ~300MB image

#### Frontend Dockerfile (`../Frontend/Dockerfile`)
- Created new Node.js 20 Alpine-based Dockerfile
- Multi-stage build: compile in build stage, serve with `serve` package
- Output: ~150MB image

### 2. **Build Scripts**

#### `build-arm64.sh`
- Automatically detects Docker buildx availability
- Builds both backend and frontend for ARM64
- Supports custom registries via `REGISTRY` environment variable
- Outputs clear build status and next steps

#### `setup-buildx.sh`
- One-time setup for Docker buildx
- Installs QEMU emulation support
- Enables cross-platform builds on any host

### 3. **Docker Compose Update**

Updated `docker-compose.yml`:
- Added `platform: linux/arm64` to all services
- Added frontend service (Node.js 20)
- Frontend connects to backend at `http://api:8080`
- Includes proper networking and health checks

### 4. **Kubernetes Manifests** (`k8s/`)

#### `gateway.yaml`
- Envoy Gateway definition
- HTTPRoute for path-based routing:
  - `/api/*` → Backend service
  - `/*` → Frontend service
- Single hostname: `health.gitlab.be`

#### `backend.yaml`
- Backend API Deployment (2 replicas, ARM64 nodeSelector)
- Backend Service (ClusterIP on port 5000)
- Health checks enabled

#### `frontend.yaml`
- Frontend Deployment (2 replicas, ARM64 nodeSelector)
- Frontend Service (ClusterIP on port 3000)
- Health checks enabled

#### `postgres.yaml`
- PostgreSQL Deployment (ARM64)
- PersistentVolumeClaim for data storage
- Secret for password management
- Health checks

#### `DEPLOYMENT.md`
- Step-by-step deployment guide
- Envoy Gateway setup
- Monitoring and troubleshooting
- Scaling instructions
- Production considerations

### 5. **Documentation**

#### `Documentation/ARM64_BUILD_GUIDE.md`
- Complete build instructions
- Local testing guide
- Multi-architecture build examples
- Registry setup guide
- Troubleshooting tips
- Performance notes for Jetson/RK1

### 6. **Docker Ignore Files**

- `.dockerignore` files for both frontend and backend
- Reduces build context and speeds up builds

## Quick Start

### Local Testing
```bash
cd Backend
chmod +x build-arm64.sh setup-buildx.sh
./setup-buildx.sh
./build-arm64.sh
docker-compose up
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/gateway.yaml      # Setup Gateway
kubectl apply -f k8s/postgres.yaml     # Database
kubectl apply -f k8s/backend.yaml      # API
kubectl apply -f k8s/frontend.yaml     # Frontend
```

## Architecture

```
Single Subdomain: health.gitlab.be
│
├─ Envoy Gateway (ListenPort 80)
│  │
│  └─ HTTPRoute (health-routes)
│     │
│     ├─ /api/* → Backend Service (5000)
│     │           ├─ Deployment (2 replicas)
│     │           └─ Pod (running .NET app on 8080)
│     │
│     └─ /* → Frontend Service (3000)
│             ├─ Deployment (2 replicas)
│             └─ Pod (running React app on 3000)
│
└─ Backend connections
   │
   └─ PostgreSQL Service (5432)
      └─ StatefulSet Pod + PVC
```

## Hardware Target

- **Jetson Nano**: 4GB RAM, ARM64, ~15-20min builds
- **Turing RK1**: 12GB RAM, ARM64, ~5-10min builds

## Files Modified/Created

✅ `Dockerfile` - Backend ARM64 compatible
✅ `Frontend/Dockerfile` - New frontend Docker image
✅ `docker-compose.yml` - Updated with frontend and platform specs
✅ `build-arm64.sh` - Build script
✅ `setup-buildx.sh` - Docker buildx setup
✅ `k8s/gateway.yaml` - Envoy Gateway + HTTPRoute
✅ `k8s/backend.yaml` - Backend K8s resources
✅ `k8s/frontend.yaml` - Frontend K8s resources
✅ `k8s/postgres.yaml` - Database K8s resources
✅ `k8s/DEPLOYMENT.md` - K8s deployment guide
✅ `Documentation/ARM64_BUILD_GUIDE.md` - Complete build guide
✅ `.dockerignore` - Frontend and Backend optimizations

## Next Steps (Optional)

1. **Push to Registry**: `docker push your-registry/health-api:arm64`
2. **Test on Jetson**: SSH to device and pull images
3. **Setup TLS**: Add certificates to Gateway listener
4. **Configure DNS**: Point health.gitlab.be to your Envoy load balancer
5. **Database Backups**: Set up automated backups for production

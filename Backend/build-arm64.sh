#!/bin/bash

# Build script for ARM64 architecture (Jetson Nano / Turing RK1)
# This script builds Docker images for linux/arm64 platform

set -e

PROJECT_NAME="health-tracking"
BACKEND_IMAGE="${PROJECT_NAME}-api:arm64"
FRONTEND_IMAGE="${PROJECT_NAME}-frontend:arm64"
REGISTRY="${REGISTRY:-localhost:5000}"  # Default to local registry, override with REGISTRY env var

echo "=========================================="
echo "Building Docker images for ARM64"
echo "=========================================="

# Check if docker buildx is available (for multi-arch builds)
if command -v docker buildx &> /dev/null; then
    echo "✓ Docker buildx found - using for multi-arch support"
    
    # Build backend
    echo ""
    echo "Building backend API (ARM64)..."
    docker buildx build \
        --platform linux/arm64 \
        -t "$REGISTRY/$BACKEND_IMAGE" \
        -f ./Dockerfile \
        --output type=docker \
        .
    
    # Build frontend
    echo ""
    echo "Building frontend (ARM64)..."
    docker buildx build \
        --platform linux/arm64 \
        -t "$REGISTRY/$FRONTEND_IMAGE" \
        -f ../Frontend/Dockerfile \
        --output type=docker \
        ../Frontend
else
    echo "⚠ Docker buildx not found - using standard docker build"
    echo "  Note: Images will be built for your current platform"
    echo ""
    
    # Build backend
    echo "Building backend API..."
    docker build \
        --platform linux/arm64 \
        -t "$REGISTRY/$BACKEND_IMAGE" \
        -f ./Dockerfile \
        .
    
    # Build frontend
    echo ""
    echo "Building frontend..."
    docker build \
        --platform linux/arm64 \
        -t "$REGISTRY/$FRONTEND_IMAGE" \
        -f ../Frontend/Dockerfile \
        ../Frontend
fi

echo ""
echo "=========================================="
echo "Build complete!"
echo ""
echo "Images built:"
echo "  - Backend: $REGISTRY/$BACKEND_IMAGE"
echo "  - Frontend: $REGISTRY/$FRONTEND_IMAGE"
echo ""
echo "To run locally:"
echo "  docker-compose up"
echo ""
echo "To push to registry:"
echo "  docker push $REGISTRY/$BACKEND_IMAGE"
echo "  docker push $REGISTRY/$FRONTEND_IMAGE"
echo "=========================================="

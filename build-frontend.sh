#!/bin/bash

# Simple frontend build script (no buildx complications)
set -e

REGISTRY="${REGISTRY:-localhost:5000}"
IMAGE_NAME="health-tracking-frontend"
TAG="${TAG:-latest}"

echo "=========================================="
echo "Building Frontend Docker Image"
echo "=========================================="
echo ""

# Build using standard docker build (not buildx)
echo "Building $IMAGE_NAME:$TAG..."
docker build \
    -t "$IMAGE_NAME:$TAG" \
    -t "$REGISTRY/$IMAGE_NAME:$TAG" \
    ./Frontend

echo ""
echo "=========================================="
echo "Build complete!"
echo "Image: $IMAGE_NAME:$TAG"
echo "=========================================="

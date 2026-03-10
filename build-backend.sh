#!/bin/bash

# Simple backend build script (no buildx complications)
set -e

REGISTRY="${REGISTRY:-localhost:5000}"
IMAGE_NAME="health-tracking-api"
TAG="${TAG:-latest}"

echo "=========================================="
echo "Building Backend Docker Image"
echo "=========================================="
echo ""

# Build using standard docker build (not buildx)
echo "Building $IMAGE_NAME:$TAG..."
docker build \
    -t "$IMAGE_NAME:$TAG" \
    -t "$REGISTRY/$IMAGE_NAME:$TAG" \
    ./Backend

echo ""
echo "=========================================="
echo "Build complete!"
echo "Image: $IMAGE_NAME:$TAG"
echo "=========================================="

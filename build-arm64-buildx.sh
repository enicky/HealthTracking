#!/bin/bash

# Build for ARM64 using buildx (Jetson Nano / Turing RK1)
# This pushes to a registry (no local loading issues)

set -e

PROJECT_NAME="health-tracking"
REGISTRY="${REGISTRY:-localhost:5000}"
VERSION="${VERSION:-latest}"
PLATFORM="${PLATFORM:-linux/arm64}"

echo "=========================================="
echo "Building for ARM64 with Buildx"
echo "=========================================="
echo ""
echo "Platform: $PLATFORM"
echo "Registry: $REGISTRY"
echo ""

# Check if buildx is available
if ! command -v docker buildx &> /dev/null; then
    echo "❌ docker buildx not found"
    echo "Install buildx or use build.sh for native platform"
    exit 1
fi

# Build Backend for ARM64
echo "[1/2] Building Backend API for ARM64..."
docker buildx build \
    --platform "$PLATFORM" \
    -t "$REGISTRY/$PROJECT_NAME-api:$VERSION-arm64" \
    --push \
    ./Backend
echo "✓ Backend built and pushed"
echo ""

# Build Frontend for ARM64
echo "[2/2] Building Frontend App for ARM64..."
docker buildx build \
    --platform "$PLATFORM" \
    -t "$REGISTRY/$PROJECT_NAME-frontend:$VERSION-arm64" \
    --push \
    ./Frontend
echo "✓ Frontend built and pushed"
echo ""

echo "=========================================="
echo "ARM64 Build Complete!"
echo "=========================================="
echo ""
echo "Images in registry:"
echo "  $REGISTRY/$PROJECT_NAME-api:$VERSION-arm64"
echo "  $REGISTRY/$PROJECT_NAME-frontend:$VERSION-arm64"
echo ""

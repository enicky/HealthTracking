#!/bin/bash

# Build everything - Backend, Frontend, and Database
set -e

PROJECT_NAME="health-tracking"
REGISTRY="${REGISTRY:-localhost:5000}"
VERSION="${VERSION:-latest}"

echo "=========================================="
echo "Health Tracking Platform - Full Build"
echo "=========================================="
echo ""

# Build Backend
echo "[1/2] Building Backend API..."
docker build \
    -t "$PROJECT_NAME-api:$VERSION" \
    -t "$REGISTRY/$PROJECT_NAME-api:$VERSION" \
    ./Backend
echo "✓ Backend built successfully"
echo ""

# Build Frontend
echo "[2/2] Building Frontend App..."
docker build \
    -t "$PROJECT_NAME-frontend:$VERSION" \
    -t "$REGISTRY/$PROJECT_NAME-frontend:$VERSION" \
    ./Frontend
echo "✓ Frontend built successfully"
echo ""

echo "=========================================="
echo "Build Complete!"
echo "=========================================="
echo ""
echo "Images ready:"
echo "  Backend:  $PROJECT_NAME-api:$VERSION"
echo "  Frontend: $PROJECT_NAME-frontend:$VERSION"
echo ""
echo "To start with Docker Compose:"
echo "  docker-compose -f Backend/docker-compose.yml up"
echo ""

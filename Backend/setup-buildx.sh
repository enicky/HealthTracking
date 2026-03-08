#!/bin/bash

# Setup script for Docker buildx (multi-architecture builds)
# This enables building for multiple platforms including ARM64

set -e

echo "Setting up Docker buildx for multi-arch builds..."
echo ""

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if buildx builder exists
if docker buildx ls | grep -q "^buildx" 2>/dev/null; then
    echo "✓ buildx builder already exists"
else
    echo "Creating new buildx builder instance..."
    docker buildx create --name buildx --driver docker-container --use
    echo "✓ buildx builder created and set as default"
fi

# Enable QEMU for emulation (needed for building non-native architectures on ARM64 hosts)
echo ""
echo "Setting up QEMU for architecture emulation..."
docker run --rm --privileged tonistiigi/binfmt --install all
echo "✓ QEMU emulation support installed"

echo ""
echo "=========================================="
echo "buildx setup complete!"
echo ""
echo "You can now build for multiple platforms:"
echo "  docker buildx build --platform linux/arm64,linux/amd64 -t image:latest ."
echo ""
echo "Or use the build scripts provided"
echo "=========================================="

#!/bin/bash

# Quick setup script for GitHub Actions
# This script helps you set up GitHub Actions for Docker image builds

set -e

echo "=========================================="
echo "GitHub Actions Setup for Docker Builds"
echo "=========================================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Run this from your repository root."
    exit 1
fi

echo "✓ Git repository detected"
echo ""

# Check if workflow directory exists
if [ ! -d ".github/workflows" ]; then
    echo "❌ .github/workflows directory not found. Running from wrong location?"
    exit 1
fi

echo "✓ Workflow files found"
ls -la .github/workflows/
echo ""

# Ask which registry to use
echo "Which registry would you like to use?"
echo "1) GitHub Container Registry (GHCR) - Recommended, no setup needed"
echo "2) Docker Hub - Requires credentials setup"
echo ""
read -p "Choose [1 or 2]: " registry_choice

case $registry_choice in
    1)
        echo ""
        echo "=========================================="
        echo "GitHub Container Registry (GHCR) Setup"
        echo "=========================================="
        echo ""
        echo "✓ No additional setup needed!"
        echo ""
        echo "Your images will be available at:"
        echo "  ghcr.io/$(git config --get remote.origin.url | sed 's/.*github.com.//' | sed 's/.git$//')/"
        echo ""
        echo "Next steps:"
        echo "1. Push your code: git push origin main"
        echo "2. Go to https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com.//' | sed 's/.git$//')/actions"
        echo "3. Watch the build-images workflow"
        echo "4. Pull image when done: docker pull ghcr.io/$(git config --get remote.origin.url | sed 's/.*github.com.//' | sed 's/.git$//').../health-api:latest"
        ;;
    2)
        echo ""
        echo "=========================================="
        echo "Docker Hub Setup"
        echo "=========================================="
        echo ""
        echo "Follow these steps:"
        echo ""
        echo "1. Create Docker Hub account (if needed):"
        echo "   Visit https://hub.docker.com and sign up"
        echo ""
        echo "2. Create repositories (PUBLIC is fine):"
        echo "   - yourusername/health-api"
        echo "   - yourusername/health-frontend"
        echo ""
        echo "3. Create Personal Access Token:"
        echo "   - Visit https://hub.docker.com/settings/security"
        echo "   - New Access Token → Generate"
        echo "   - Copy the token"
        echo ""
        echo "4. Add GitHub Secrets:"
        echo "   - Go to: https://github.com/your-repo/settings/secrets/actions"
        echo "   - New repository secret: DOCKER_USERNAME = yourusername"
        echo "   - New repository secret: DOCKER_PASSWORD = (paste token)"
        echo ""
        echo "5. Push code:"
        echo "   git push origin main"
        echo ""
        echo "Images will be available at:"
        echo "   docker pull yourusername/health-api:latest"
        echo "   docker pull yourusername/health-frontend:latest"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="

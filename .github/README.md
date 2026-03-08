# GitHub Actions CI/CD Pipeline

Automated Docker image builds for ARM64 and AMD64 architectures.

## Quick Start

### Option 1: GitHub Container Registry (Recommended)
**Works out of the box - no setup needed!**

```bash
# 1. Push to GitHub
git add .
git commit -m "Add Docker builds"
git push origin main

# 2. Watch the build
# Go to: https://github.com/YOUR_ORG/HealtTracking/actions

# 3. Pull the image
docker pull ghcr.io/your-org/healtracking/health-api:latest
```

### Option 2: Docker Hub
**Requires credentials (3 minutes to set up)**

```bash
# 1. Add secrets to GitHub (DOCKER_USERNAME, DOCKER_PASSWORD)
# 2. Push code: git push origin main
# 3. Pull image: docker pull your-username/health-api:latest
```

See [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) for full details.

## Workflows

| Workflow | Registry | Setup | Status |
|----------|----------|-------|--------|
| `build-images.yml` | GHCR | ✅ No setup | Recommended |
| `build-docker-hub.yml` | Docker Hub | ⚙️ Needs secrets | Optional |

## What Gets Built

- Backend C# API - ARM64 & AMD64
- Frontend React App - ARM64 & AMD64
- Automatically tagged with version/branch

## Auto-Triggers

✅ Every push to `main` or `develop`
✅ Every git tag (`v1.0.0`)
✅ Pull requests (build only, no push)

## Deploy to Kubernetes

After images are built:

```bash
# Update image in k8s manifests
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

## For Docker Hub Setup

Run the setup script:
```bash
./setup-github-actions.sh
```

Then follow the prompts to configure secrets.

---

See [.github/workflows/](../.github/workflows/) for workflow definitions.

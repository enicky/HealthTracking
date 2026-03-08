# GitHub Actions - Docker Image Build Guide

This guide explains how to set up and use GitHub Actions to automatically build and push Docker images for ARM64 and AMD64 architectures.

## Workflows Included

### 1. `build-images.yml` - GitHub Container Registry (GHCR)
Automatically builds and pushes images to GitHub Container Registry when you push code.

**Best for:**
- Private registries
- Integrated with GitHub
- No additional setup needed (uses GitHub token)

### 2. `build-docker-hub.yml` - Docker Hub
Builds and pushes images to Docker Hub for public distribution.

**Best for:**
- Public registries
- Sharing with community
- Mobile apps pulling from public registry

## Setup Instructions

### Option A: GitHub Container Registry (Recommended - No Setup!)

This works **out of the box** with your GitHub repository.

1. Push your code to GitHub:
```bash
git add .
git commit -m "Add Docker builds and Kubernetes manifests"
git push origin main
```

2. Go to your repository → **Actions** tab
3. You should see the `build-images.yml` workflow running
4. Images will be automatically pushed to `ghcr.io/your-org/health-api:latest`

**Access your images:**
```bash
docker pull ghcr.io/your-org/health-tracking/health-api:latest
docker pull ghcr.io/your-org/health-tracking/health-frontend:latest
```

### Option B: Docker Hub Registry

If you want to push to Docker Hub instead:

1. **Create Docker Hub account** (if you don't have one)
   - Go to https://hub.docker.com/
   - Sign up for free account

2. **Create two repositories on Docker Hub:**
   - `your-username/health-api`
   - `your-username/health-frontend`

3. **Add GitHub Secrets to your repository:**
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Add two secrets:
     - `DOCKER_USERNAME`: Your Docker Hub username
     - `DOCKER_PASSWORD`: Your Docker Hub personal access token (create at https://hub.docker.com/settings/security)

4. **Push your code:**
```bash
git push origin main
```

5. **Monitor the build:**
   - Go to **Actions** tab
   - Click `Build Images for Docker Hub` workflow
   - Watch it build and push your images

**Access your images:**
```bash
docker pull your-username/health-api:latest
docker pull your-username/health-frontend:latest
```

## Automatic Triggers

Both workflows trigger on:
- ✅ Push to `main` or `develop` branches
- ✅ Git tags (e.g., `v1.0.0`)
- ✅ Pull requests (builds but doesn't push)

### Examples

```bash
# Trigger build on main branch
git push origin main

# Trigger build with version tag
git tag v1.0.0
git push origin v1.0.0

# Create a feature branch (builds but doesn't push)
git checkout -b feature/my-feature
git push origin feature/my-feature
```

## Image Tagging

Images are automatically tagged with:

| Trigger | Tags |
|---------|------|
| `git push origin main` | `latest`, `main`, `sha-xxxxx`, `latest` |
| `git push origin develop` | `develop`, `sha-xxxxx` |
| `git tag v1.0.0` | `v1.0.0`, `1.0`, `latest` |
| Pull Request | Docker build only (no push) |

## Multi-Architecture Support

Both workflows build for:
- **linux/arm64** (Jetson Nano, Turing RK1)
- **linux/amd64** (Standard x86-64 servers)

This means one image works on both ARM64 and AMD64 devices!

```bash
# Same image works everywhere
docker run ghcr.io/your-org/health-api:latest
# Automatically pulls correct architecture
```

## Security Features

The GHCR workflow includes:
- Trivy vulnerability scanning
- Results published to GitHub Security tab
- Issues are automatically reported

## Example Usage

### On Your Jetson Nano

```bash
# Pull the latest built image
docker pull ghcr.io/your-org/health-tracking/health-api:latest

# Run it
docker run -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="Host=postgres;..." \
  ghcr.io/your-org/health-tracking/health-api:latest
```

### Use in Kubernetes

Update your `k8s/backend.yaml`:

```yaml
containers:
- name: api
  image: ghcr.io/your-org/health-tracking/health-api:latest
  imagePullPolicy: IfNotPresent  # Always pull latest
```

Then deploy:
```bash
kubectl apply -f k8s/backend.yaml
```

## Monitoring Builds

### View build logs
1. Go to **Actions** tab
2. Click the workflow run
3. Click the job to see full logs
4. Scroll down to see build output

### Common issues

**Build timeout:**
- First build takes 15-20 minutes (no cache)
- Subsequent builds: 5-10 minutes
- ARM64 emulation on GitHub runners is slower

**Out of disk space:**
- GitHub runners have ~14GB free
- Multi-arch builds need more space
- Try removing old cache: Actions → delete workflows

**Images not pushing:**
- Check Docker credentials are correct
- Verify repository exists on Docker Hub
- Check workflow permissions in repo settings

## Advanced: Manual Registry

If you want to push to a custom registry:

1. Edit the workflow file
2. Change `REGISTRY` environment variable:
```yaml
env:
  REGISTRY: your-registry.com
  BACKEND_IMAGE_NAME: your-registry.com/health-api
```

3. Update login step with your registry credentials
4. Add secrets to GitHub: `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`

## Cost Considerations

**GitHub Actions (GHCR):**
- Free for public repositories
- 2,000 free minutes/month for private repos
- Multi-arch builds use ~2x minutes

**Docker Hub:**
- Free public repositories
- Rate limited: 100 pulls/6 hours (unauthenticated)
- Unlimited pulls for authenticated users

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Wait for first build (15-20 min)
3. ✅ Pull image on your Jetson
4. ✅ Deploy to Kubernetes
5. ✅ Access at http://health.gitlab.be

## Troubleshooting

### Workflow not running?
- Check `.github/workflows/` directory exists
- Verify YAML syntax (use online YAML validator)
- Actions might be disabled in repo settings

### Images building but not pushing?
- It's normal for pull requests (security feature)
- Only `push` events trigger pushes
- Check workflow logs for errors

### "permission denied" when pulling image?
```bash
# Authenticate to GitHub Container Registry
cat ~/your-token.txt | docker login ghcr.io -u your-username --password-stdin

# Or use GitHub CLI
gh auth login
```

### Build takes too long on Jetson?
- GitHub runners emulate ARM64
- First build: 15-20 minutes
- Cached builds: 5-10 minutes
- For faster builds on Jetson directly, use local Docker buildx

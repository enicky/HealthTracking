# Kubernetes Deployment Guide for ARM64 (Jetson Nano / Turing RK1)

## Prerequisites

- Kubernetes 1.26+ cluster running on ARM64 (Jetson, RK1)
- Envoy Gateway Controller installed
- kubectl configured to access your cluster
- Docker images pushed to accessible registry

## Setup Steps

### 1. Install Envoy Gateway (if not already installed)

```bash
kubectl apply -f https://github.com/envoyproxy/gateway/releases/download/v1.0.0/install.yaml
```

Verify installation:
```bash
kubectl get pods -n envoy-gateway-system
```

### 2. Create Namespace and Deploy Services

```bash
# Apply namespace, gateway, and routing config
kubectl apply -f k8s/gateway.yaml

# Deploy database
kubectl apply -f k8s/postgres.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n health-tracking --timeout=300s

# Deploy backend API
kubectl apply -f k8s/backend.yaml

# Wait for backend to be ready
kubectl wait --for=condition=ready pod -l app=backend-api -n health-tracking --timeout=300s

# Deploy frontend
kubectl apply -f k8s/frontend.yaml

# Wait for frontend to be ready
kubectl wait --for=condition=ready pod -l app=frontend -n health-tracking --timeout=300s
```

### 3. Verify Deployment

```bash
# Check all resources
kubectl get all -n health-tracking

# Check gateway status
kubectl get gateway -n health-tracking
kubectl describe gateway health-gateway -n health-tracking

# Check HTTPRoute status
kubectl get httproute -n health-tracking
kubectl describe httproute health-routes -n health-tracking

# Check pod logs
kubectl logs -f deployment/backend-api -n health-tracking
kubectl logs -f deployment/frontend -n health-tracking
```

### 4. Access the Application

Once the Envoy Gateway is exposed:

```bash
# Get the Gateway IP/hostname
kubectl get svc -n envoy-gateway-system

# Add to your /etc/hosts file (for local cluster)
# <gateway-ip> health.gitlab.be

# Or configure DNS to point health.gitlab.be to your gateway IP
```

Then access:
- Frontend: `http://health.gitlab.be`
- API: `http://health.gitlab.be/api`

## Monitoring & Troubleshooting

### Check deployment status
```bash
kubectl rollout status deployment/backend-api -n health-tracking
kubectl rollout status deployment/frontend -n health-tracking
```

### View pod events
```bash
kubectl describe pod <pod-name> -n health-tracking
```

### Check resource usage (Jetson/RK1)
```bash
kubectl top nodes
kubectl top pods -n health-tracking
```

### Database connectivity issues
```bash
# Test database connection from a pod
kubectl run -it --rm debug --image=postgres:16-alpine \
  --restart=Never -- \
  psql -h postgres -U healthtracking -d healthtracking
```

### API health check
```bash
kubectl port-forward svc/backend-service 5000:5000 -n health-tracking
curl http://localhost:5000/health
```

## Scaling

### Scale backend API
```bash
kubectl scale deployment backend-api --replicas=3 -n health-tracking
```

### Scale frontend
```bash
kubectl scale deployment frontend --replicas=3 -n health-tracking
```

## Resource Constraints (Jetson Nano)

If running on resource-limited devices:

Edit the resource limits in `backend.yaml` and `frontend.yaml`:
```yaml
resources:
  limits:
    memory: "256Mi"      # Reduce if needed
    cpu: "250m"          # Reduce if needed
  requests:
    memory: "128Mi"
    cpu: "100m"
```

## Production Considerations

1. **Use a private registry:**
   ```bash
   kubectl create secret docker-registry regcred \
     --docker-server=your-registry.com \
     --docker-username=user \
     --docker-password=pass \
     -n health-tracking
   ```
   Add `imagePullSecrets` to deployments

2. **Use ConfigMaps for configuration:**
   ```bash
   kubectl create configmap app-config \
     --from-literal=API_URL=https://health.gitlab.be/api \
     -n health-tracking
   ```

3. **Enable TLS/HTTPS:**
   Add certificate to Gateway listener

4. **Database backups:**
   ```bash
   kubectl exec -it postgres-pod -n health-tracking -- \
     pg_dump healthtracking > backup.sql
   ```

5. **Persistent storage:**
   Ensure your cluster has persistent volume provisioner configured

## Cleanup

To remove all resources:
```bash
kubectl delete namespace health-tracking
```

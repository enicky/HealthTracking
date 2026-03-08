# Kubernetes Deployment Guide

## Overview

This guide covers deploying the Health Tracking API to a Kubernetes cluster. The deployment includes:
- API deployment with horizontal pod autoscaling
- PostgreSQL StatefulSet for persistent data
- ConfigMaps and Secrets for configuration
- Service exposure via LoadBalancer or Ingress
- Health checks and monitoring

## Prerequisites

- Kubernetes cluster (1.24+)
- `kubectl` CLI configured
- Docker registry credentials
- Helm (optional, for package management)

## Step 1: Prepare Docker Image

### Build and Push Image

```bash
# Build the image
docker build -f HealthTracking.Api/Dockerfile -t your-registry.azurecr.io/health-tracking-api:v1.0.0 .

# Push to container registry
docker push your-registry.azurecr.io/health-tracking-api:v1.0.0
```

## Step 2: Create Kubernetes Namespace

```bash
kubectl create namespace health-tracking
kubectl config set-context --current --namespace=health-tracking
```

## Step 3: Create Secrets

```bash
# Create secret for database credentials
kubectl create secret generic db-credentials \
  --from-literal=DB_HOST=postgres \
  --from-literal=DB_PORT=5432 \
  --from-literal=DB_NAME=healthtracking \
  --from-literal=DB_USER=healthtracking \
  --from-literal=DB_PASSWORD=your-secure-password \
  -n health-tracking

# Create secret for image pull
kubectl create secret docker-registry acr-secret \
  --docker-server=your-registry.azurecr.io \
  --docker-username=<username> \
  --docker-password=<password> \
  -n health-tracking
```

## Step 4: Deploy PostgreSQL

Create `postgres-statefulset.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
data:
  POSTGRES_DB: healthtracking
  POSTGRES_USER: healthtracking
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
          name: postgres
        envFrom:
        - configMapRef:
            name: postgres-config
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: DB_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U healthtracking
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U healthtracking
          initialDelaySeconds: 5
          periodSeconds: 10
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
  - port: 5432
    name: postgres
```

Apply:
```bash
kubectl apply -f postgres-statefulset.yaml -n health-tracking
```

## Step 5: Deploy API

Create `api-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: health-tracking-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: health-tracking-api
  template:
    metadata:
      labels:
        app: health-tracking-api
    spec:
      imagePullSecrets:
      - name: acr-secret
      containers:
      - name: api
        image: your-registry.azurecr.io/health-tracking-api:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ConnectionStrings__DefaultConnection
          value: "Host=postgres;Port=5432;Database=healthtracking;Username=healthtracking;Password=$(DB_PASSWORD)"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: DB_PASSWORD
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /api/healthcheck
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/healthcheck
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
---
apiVersion: v1
kind: Service
metadata:
  name: health-tracking-api
spec:
  type: LoadBalancer
  selector:
    app: health-tracking-api
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: health-tracking-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: health-tracking-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

Apply:
```bash
kubectl apply -f api-deployment.yaml -n health-tracking
```

## Step 6: Verify Deployment

```bash
# Check pods
kubectl get pods -n health-tracking

# Check services
kubectl get svc -n health-tracking

# Get external IP for LoadBalancer
kubectl get svc health-tracking-api -n health-tracking

# View logs
kubectl logs -f deployment/health-tracking-api -n health-tracking

# Test the API
EXTERNAL_IP=$(kubectl get svc health-tracking-api -n health-tracking -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$EXTERNAL_IP/api/healthcheck
```

## Step 7: Setup Ingress (Optional)

If using Ingress instead of LoadBalancer:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: health-tracking-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.healthtracking.com
    secretName: health-tracking-tls
  rules:
  - host: api.healthtracking.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: health-tracking-api
            port:
              number: 80
```

## Scaling

### Manual Scaling

```bash
# Scale API replicas
kubectl scale deployment health-tracking-api --replicas=5 -n health-tracking
```

### View HPA Status

```bash
kubectl get hpa health-tracking-api-hpa -n health-tracking --watch
```

## Monitoring

### Check Deployment Status

```bash
kubectl status deployment health-tracking-api -n health-tracking
```

### View Events

```bash
kubectl get events -n health-tracking --sort-by='.lastTimestamp'
```

### Pod Metrics (requires metrics-server)

```bash
kubectl top pods -n health-tracking
kubectl top nodes
```

## Updates & Rollbacks

### Update Image

```bash
kubectl set image deployment/health-tracking-api \
  api=your-registry.azurecr.io/health-tracking-api:v1.1.0 \
  -n health-tracking
```

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/health-tracking-api -n health-tracking

# Rollback to previous version
kubectl rollout undo deployment/health-tracking-api -n health-tracking

# Rollback to specific revision
kubectl rollout undo deployment/health-tracking-api --to-revision=2 -n health-tracking
```

## Database Migrations in Kubernetes

The application automatically runs migrations on startup. To run migrations manually:

```bash
# Port-forward to API pod
kubectl port-forward pod/health-tracking-api-<pod-id> 5000:8080 -n health-tracking

# Or use a Job:
kubectl create job migrate --image=your-registry.azurecr.io/health-tracking-api:latest -- \
  dotnet ef database update -n health-tracking
```

## Cleanup

```bash
# Delete all resources in namespace
kubectl delete namespace health-tracking

# Or delete individual resources
kubectl delete deployment health-tracking-api -n health-tracking
kubectl delete statefulset postgres -n health-tracking
kubectl delete pvc postgres-pvc -n health-tracking
kubectl delete secrets db-credentials -n health-tracking
```

## Troubleshooting

### CrashLoopBackOff

```bash
# Check pod logs
kubectl logs <pod-name> -n health-tracking

# Describe pod for events
kubectl describe pod <pod-name> -n health-tracking
```

### Database Connection Issues

```bash
# Test connectivity from API pod
kubectl exec -it <api-pod> -n health-tracking -- sh

# Inside pod:
apt-get update && apt-get install -y postgresql-client
psql -h postgres -U healthtracking -d healthtracking
```

### LoadBalancer Not Getting External IP

```bash
# Check service status
kubectl describe svc health-tracking-api -n health-tracking

# May need to install metallb or configure cloud load balancer
```

## Production Recommendations

1. **Use managed database** (Azure Database for PostgreSQL, AWS RDS, etc.) instead of StatefulSet
2. **Enable authentication** - implement JWT or OAuth2
3. **Use secrets management** - Azure Key Vault, Vault, etc.
4. **Enable network policies** - restrict pod-to-pod communication
5. **Setup monitoring** - Prometheus, Grafana
6. **Enable logging** - ELK stack, Azure Monitor
7. **Use SSL/TLS** - Ingress with cert-manager
8. **Backup strategy** - Regular database backups
9. **Pod Disruption Budgets** - Maintain availability during updates

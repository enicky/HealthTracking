# Local Testing Guide

Now you can test everything locally with nginx as the reverse proxy!

## Start Local Environment

```bash
cd Backend
docker-compose up
```

This starts:
- 🗄️ PostgreSQL (port 5432)
- 🔧 Backend API (internal port 8080, exposed on 5001 for direct access)
- ⚛️ Frontend (internal port 3000)
- 🔀 Nginx Reverse Proxy (port 80)

## Access Services

### Via Nginx (Production-like setup)
```
Frontend:  http://localhost/
API:       http://localhost/api/
Health:    http://localhost/health
```

### Direct Access (for debugging)
```
Backend:   http://localhost:5001
Frontend:  http://localhost:3000
Database:  localhost:5432
```

## Testing API Endpoints

### Through Nginx proxy (as it will be in production)
```bash
# Health check
curl http://localhost/health

# Example API call (adjust path to your endpoints)
curl -X GET http://localhost/api/your-endpoint
curl -X POST http://localhost/api/your-endpoint \
  -H "Content-Type: application/json" \
  -d '{"data": "value"}'
```

### Direct to backend
```bash
curl -X GET http://localhost:5001/your-endpoint
```

## Monitoring

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f nginx

# Only errors
docker-compose logs --tail=50 nginx | grep error
```

### Check service health
```bash
# View running containers
docker-compose ps

# Nginx config test
docker-compose exec nginx nginx -t

# Database connectivity
docker-compose exec api nc -zv postgres 5432

# Frontend health
curl http://localhost:3000
```

## Database Access

### Connect to PostgreSQL
```bash
docker-compose exec postgres psql -U healthtracking -d healthtracking
```

### View database
```sql
\dt              -- List tables
\l               -- List databases
SELECT * FROM your_table;
```

## Common Issues

### Nginx not starting
```bash
# Check nginx config
docker-compose exec nginx nginx -t

# View nginx logs
docker-compose logs nginx
```

### Port already in use
```bash
# Find what's using port 80
lsof -i :80

# Change port in docker-compose.yml
# ports:
#   - "8080:80"  # Use 8080 instead
```

### Backend can't connect to database
```bash
# Test connection
docker-compose exec api nc -zv postgres 5432

# View connection string
docker-compose exec api env | grep ConnectionString
```

### Frontend making wrong API calls
- Check `REACT_APP_API_URL` in docker-compose.yml
- Should be `http://localhost/api` when accessed via nginx
- Browser console will show failed requests in Network tab

## Simulate Production Environment

Your local setup now matches the production Kubernetes + Envoy setup:

```
┌─ localhost:80 (Nginx) ────────────────────┐
│                                           │
├─ /api/* ──────→ Backend (port 8080)      │
│                 - C# ASP.NET Core       │
│                 - Connected to PostgreSQL│
│                                           │
└─ /* ──────────→ Frontend (port 3000)     │
                  - React App              │
                  - Shows data              │
```

When deploying to Kubernetes, replace Nginx with Envoy Gateway + HTTPRoute - same routing logic!

## Cleanup

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (delete database)
docker-compose down -v

# Remove built images
docker-compose down --rmi local
```

## Next Steps

Once local testing works:
1. ✅ Push images to registry
2. ✅ Deploy to Kubernetes
3. ✅ Use Envoy Gateway for routing (instead of Nginx)
4. ✅ Configure DNS for health.gitlab.be

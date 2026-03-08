# Health Tracking API - C# Backend

A multi-tenant, multi-user health tracking API built with C# ASP.NET Core, Entity Framework Core, and PostgreSQL. Designed for scalability and deployment on Kubernetes.

## Features

- **Multi-Tenant Architecture**: Support for multiple tenants with isolated data
- **Multi-User Support**: Each tenant can have multiple users
- **ECG Data Tracking**: Store and retrieve ECG session data with heart rate analysis
- **Blood Pressure Monitoring**: Track systolic, diastolic, and pulse readings
- **RESTful API**: Clean, well-documented API endpoints
- **PostgreSQL Integration**: Persistent data storage with proper indexing
- **Docker & Kubernetes Ready**: Containerized application ready for orchestration
- **Health Checks**: Built-in health check endpoint for monitoring

## Architecture

### Database Schema

**Tenants Table**
- `id` (UUID): Primary key
- `name` (TEXT): Tenant name
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Users Table**
- `id` (UUID): Primary key
- `tenant_id` (UUID): Reference to tenant
- `email` (TEXT): User email (unique per tenant)
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp
- `deleted_at` (TIMESTAMPTZ): Soft delete timestamp

**ECG Sessions Table**
- `id` (UUID): Primary key
- `tenant_id` (UUID): Tenant reference
- `user_id` (UUID): User reference
- `recorded_at` (TIMESTAMPTZ): Recording date/time
- `classification` (TEXT): ECG classification
- `average_heart_rate` (INT): Heart rate
- `samples` (JSONB): Raw ECG samples
- Index: `idx_ecg_tenant_user_time` on (tenant_id, user_id, recorded_at DESC)

**Blood Pressure Readings Table**
- `id` (UUID): Primary key
- `tenant_id` (UUID): Tenant reference
- `user_id` (UUID): User reference
- `recorded_at` (TIMESTAMPTZ): Recording date/time
- `systolic` (INT): Systolic pressure
- `diastolic` (INT): Diastolic pressure
- `pulse` (INT): Pulse rate
- Index: `idx_bp_tenant_user_time` on (tenant_id, user_id, recorded_at DESC)

## Getting Started

### Prerequisites

- Docker and Docker Compose
- .NET 8 SDK (for local development)
- PostgreSQL 16+ (if running without Docker)

### Local Development with Docker Compose

1. **Start the services**:
   ```bash
   docker-compose up -d
   ```

2. **Access the API**:
   - API: http://localhost:5000
   - Swagger UI: http://localhost:5000/swagger/index.html

3. **View logs**:
   ```bash
   docker-compose logs -f api
   ```

4. **Stop the services**:
   ```bash
   docker-compose down
   ```

### Local Development without Docker

1. **Install dependencies**:
   ```bash
   dotnet restore HealthTracking.Api
   ```

2. **Update connection string** in `appsettings.Development.json` to point to your PostgreSQL instance

3. **Run migrations**:
   ```bash
   cd HealthTracking.Api
   dotnet ef database update
   ```

4. **Start the API**:
   ```bash
   dotnet run
   ```

## API Endpoints

### Health Check
```
GET /api/healthcheck
```

### ECG Sessions
```
POST   /api/ecg                 # Create ECG session
GET    /api/ecg                 # List ECG sessions (paginated)
GET    /api/ecg/{id}            # Get specific ECG session
```

### Blood Pressure Readings
```
POST   /api/bloodpressure       # Create blood pressure reading
GET    /api/bloodpressure       # List readings (paginated)
GET    /api/bloodpressure/{id}  # Get specific reading
```

## Request Headers

All API requests (except health check) require:
- `X-Tenant-Id`: UUID of the tenant
- `X-User-Id`: UUID of the user

Example:
```bash
curl -X POST http://localhost:5000/api/ecg \
  -H "X-Tenant-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "X-User-Id: 550e8400-e29b-41d4-a716-446655440001" \
  -H "Content-Type: application/json" \
  -d '{
    "recordedAt": "2024-03-04T10:30:00Z",
    "classification": "Normal",
    "averageHeartRate": 72,
    "samples": [...]
  }'
```

## Project Structure

```
HealthTracking.Api/
├── Controllers/        # API endpoint definitions
├── Services/           # Business logic and data operations
├── Models/            # Entity Framework models
├── DTOs/              # Data transfer objects
├── Data/              # Database context and configurations
├── Middleware/        # Custom middleware (tenant handling)
├── Migrations/        # EF Core database migrations
├── Program.cs         # Application entry point
├── appsettings.json   # Configuration
└── Dockerfile         # Container definition
```

## Multi-Tenant Architecture

The system ensures tenant isolation through:

1. **Request-level isolation**: `X-Tenant-Id` header validation
2. **Database-level isolation**: ALL queries filtered by `tenant_id`
3. **Foreign key constraints**: Data relationships enforced at DB level
4. **Soft deletes**: Support for compliance and data recovery

## Deployment to Kubernetes

### Build Docker Image

```bash
docker build -f HealthTracking.Api/Dockerfile -t your-registry/health-tracking-api:latest .
docker push your-registry/health-tracking-api:latest
```

### Example Kubernetes Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: health-tracking-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: health-tracking-api
  template:
    metadata:
      labels:
        app: health-tracking-api
    spec:
      containers:
      - name: api
        image: your-registry/health-tracking-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: connection-string
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        livenessProbe:
          httpGet:
            path: /api/healthcheck
            port: 8080
          initialDelaySeconds: 20
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/healthcheck
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: health-tracking-api-service
spec:
  selector:
    app: health-tracking-api
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
```

## Database Migrations

### Create a New Migration

```bash
cd HealthTracking.Api
dotnet ef migrations add MigrationName
dotnet ef database update
```

### Roll Back Migration

```bash
dotnet ef migrations remove
# or
dotnet ef database update PreviousMigrationName
```

## Performance Considerations

1. **Indexing**: Composite indexes on `(tenant_id, user_id, recorded_at DESC)` for efficient querying
2. **Pagination**: Use `skip` and `take` query parameters to limit result sets
3. **JSON Storage**: ECG samples stored as JSONB for flexible schema
4. **Connection Pooling**: EF Core manages connection pooling automatically
5. **Soft Deletes**: Filtered at query level to avoid hard deletes

## Security Notes

> **⚠️ Current Implementation**: The tenant and user context is extracted from HTTP headers. For production:
> - Implement JWT authentication
> - Extract tenant/user from authenticated token claims
> - Add role-based access control (RBAC)
> - Encrypt sensitive data at rest

## Future Enhancements

- [ ] JWT-based authentication
- [ ] API key management
- [ ] Audit logging
- [ ] Analytics and reporting endpoints
- [ ] Data export functionality (CSV, PDF)
- [ ] Real-time data streaming (WebSockets)
- [ ] Caching layer (Redis)

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# View container logs
docker-compose logs postgres

# Connect to PostgreSQL
docker-compose exec postgres psql -U healthtracking -d healthtracking
```

### API Not Responding
```bash
# Verify API is running
curl http://localhost:5000/api/healthcheck

# Check API logs
docker-compose logs -f api
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with Docker Compose
4. Submit a pull request

## License

MIT License - feel free to use for your health tracking needs!

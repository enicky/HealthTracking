# Local Development Guide

This guide will help you get the Health Tracking API running locally for development.

## Quick Start (5 minutes with Docker)

### Prerequisites
- Docker Desktop installed
- Git
- Optional: VS Code with C# extension

### Setup

1. **Clone the repository** (if applicable)
   ```bash
   cd Backend
   ```

2. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - API: http://localhost:5000
   - Swagger UI: http://localhost:5000/swagger/index.html
   - PostgreSQL: localhost:5432 (credentials in docker-compose.yml)

4. **Test the API**
   ```bash
   bash test-api.sh
   ```

5. **Stop services**
   ```bash
   docker-compose down
   ```

## Detailed Local Development (with .NET SDK)

### Prerequisites
- .NET 8 SDK
- PostgreSQL 16+
- Visual Studio Code or Visual Studio 2022

### Step 1: Install Dependencies

```bash
# Restore NuGet packages
dotnet restore HealthTracking.Api
```

### Step 2: Setup PostgreSQL

**Option A: Using Docker**
```bash
docker run -d \
  --name postgres-health \
  -e POSTGRES_DB=healthtracking \
  -e POSTGRES_USER=healthtracking \
  -e POSTGRES_PASSWORD=healthtracking123 \
  -p 5432:5432 \
  postgres:16-alpine
```

**Option B: Local PostgreSQL Installation**
```bash
# macOS with Homebrew
brew install postgresql@16
brew services start postgresql@16

# Create database and user
psql postgres -c "CREATE DATABASE healthtracking;"
psql postgres -c "CREATE USER healthtracking WITH PASSWORD 'healthtracking123';"
psql postgres -c "ALTER ROLE healthtracking CREATEDB;"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE healthtracking TO healthtracking;"
```

### Step 3: Configure Connection String

Update `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=healthtracking;Username=healthtracking;Password=healthtracking123"
  }
}
```

### Step 4: Run Database Migrations

```bash
cd HealthTracking.Api

# Create initial migration (first time only)
dotnet ef migrations add InitialCreate

# Apply migrations
dotnet ef database update
```

### Step 5: Run the Application

```bash
# From HealthTracking.Api directory
dotnet run

# Or with file watching for development
dotnet watch run
```

Application starts at: http://localhost:5000

## Development Workflow

### Using VS Code

1. **Install Extensions**
   - C# (Microsoft)
   - REST Client

2. **Open in VS Code**
   ```bash
   code .
   ```

3. **Debug**
   - Press `F5` to start debugging
   - Set breakpoints in code
   - Use Debug Console for inspections

4. **Use REST Client Extension**
   - Open `API-EXAMPLES.http`
   - Send requests directly from VS Code

### Using Visual Studio 2022

1. Open `HealthTracking.Api.csproj` in Visual Studio
2. Build the solution (Ctrl+Shift+B)
3. Set breakpoints and press F5 to debug

### Using Postman

1. Import the API examples from `API-EXAMPLES.http`
2. Set up environment variables:
   - `baseUrl`: http://localhost:5000/api
   - `tenantId`: 550e8400-e29b-41d4-a716-446655440000
   - `userId`: 550e8400-e29b-41d4-a716-446655440001

## Database Development

### Run SQL Scripts

```bash
# Initialize database schema
psql -h localhost -U healthtracking -d healthtracking -f InitializeDatabase.sql

# Seed test data
psql -h localhost -U healthtracking -d healthtracking -f seed-test-data.sql
```

### Connect to PostgreSQL in Docker

```bash
# Using psql in container
docker-compose exec postgres psql -U healthtracking -d healthtracking

# Or directly
psql -h localhost -U healthtracking -d healthtracking
```

### Useful PostgreSQL Commands

```sql
-- List all tables
\dt

-- View table schema
\d+ ecg_sessions

-- List indexes
\di

-- Show database size
SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) 
FROM pg_database;

-- Query test data
SELECT * FROM tenants;
SELECT * FROM users;
SELECT * FROM ecg_sessions LIMIT 5;
SELECT * FROM blood_pressure_readings LIMIT 5;
```

## Testing

### Unit Tests (Coming Soon)

```bash
# Run all tests
dotnet test

# Run specific test class
dotnet test --filter TestClass=EcgServiceTests

# Run with coverage
dotnet test /p:CollectCoverage=true
```

### Integration Tests (Coming Soon)

```bash
# Run integration tests
dotnet test --filter Integration=true
```

### Manual API Testing

Use the provided `test-api.sh` script:
```bash
chmod +x test-api.sh
./test-api.sh
```

Or use the HTTP file with VS Code REST Client:
```bash
# Open API-EXAMPLES.http in VS Code
# Click "Send Request" above each request
```

## Common Development Tasks

### Create a New Migration

```bash
cd HealthTracking.Api
dotnet ef migrations add AddNewColumn
dotnet ef database update
```

### Reset Database

```bash
cd HealthTracking.Api
dotnet ef database drop --force
dotnet ef database update
```

### Check Database Connectivity

```bash
curl http://localhost:5000/api/healthcheck
```

### View Application Logs

**Docker:**
```bash
docker-compose logs -f api
```

**dotnet run:**
```
Logs appear in the console running the app
```

### Reload Configuration

Just restart the application. For Docker Compose:
```bash
docker-compose restart api
```

## Debugging Common Issues

### "Cannot connect to database"
- Verify PostgreSQL is running
- Check connection string in `appsettings.Development.json`
- Verify username/password
- Try connecting with psql: `psql -h localhost -U healthtracking healthtracking`

### "Migration already exists"
- Check `Migrations` folder for duplicates
- Use `dotnet ef migrations remove` to remove last migration

### "Port already in use"
```bash
# Find process using port 5432 (PostgreSQL)
lsof -i :5432

# Or port 5000 (API)
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### "Entity Framework changes not reflecting"
- Delete `bin` and `obj` folders
- Run `dotnet clean`
- Run `dotnet build`

### Docker Compose issues

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Restart from scratch
docker-compose up --build -d
```

## Code Structure for Developers

```
HealthTracking.Api/
├── Controllers/         # API endpoints
├── Services/           # Business logic
├── Models/             # EF Core entities
├── DTOs/               # Data transfer objects
├── Data/               # DbContext
├── Middleware/         # Custom middleware
└── Migrations/         # EF Core migrations
```

### Adding a New Feature

1. **Create Model** in `Models/YourModel.cs`
2. **Add DbSet** to `ApplicationDbContext.cs`
3. **Create DTO** in `DTOs/`
4. **Add Service** in `Services/`
5. **Add Controller** in `Controllers/`
6. **Create Migration**
   ```bash
   dotnet ef migrations add AddYourModel
   dotnet ef database update
   ```

## Code Style

- Use PascalCase for class/method names
- Use camelCase for properties in DTOs
- Add XML comments to public methods
- Keep controllers thin - put logic in services

Example:
```csharp
/// <summary>
/// Retrieves all ECG sessions for the current user
/// </summary>
public async Task<IEnumerable<EcgSessionDto>> GetEcgSessionsAsync(int skip = 0, int take = 50)
{
    // Implementation
}
```

## Environment Variables

Create a `.env` file in the root directory (optional):

```
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=healthtracking;Username=healthtracking;Password=healthtracking123
```

## Performance Tips

- Use pagination (skip/take parameters)
- Indexes are already created on common queries
- Monitor slow queries in PostgreSQL
- Consider caching for frequently accessed data (future enhancement)

## Next Steps

1. Try creating ECG and blood pressure records via Swagger UI
2. Query records using REST Client
3. Examine the database to understand the schema
4. Read through the code to understand multi-tenant architecture
5. Extend with your own features

For production deployment, see `KUBERNETES_DEPLOYMENT.md`

## Getting Help

- Check logs for detailed error messages
- Review exception stack traces in application output
- Use PostgreSQL logs: `docker-compose logs postgres`
- Check Docker for resource issues: `docker stats`

Happy coding! 🚀

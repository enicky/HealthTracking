using HealthPlatform.Application.Interfaces;
using HealthPlatform.Infrastructure.Persistence;
using HealthPlatform.Infrastructure.Repositories;
using HealthPlatform.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddScoped<HealthDbContext>();
builder.Services.AddScoped<IEcgRepository, EcgRepository>();
builder.Services.AddScoped<IBloodPressureRepository, BloodPressureRepository>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IEcgService, EcgService>();
builder.Services.AddScoped<IBloodPressureService, BloodPressureService>();

// Add HTTP context accessor for tenant resolution
builder.Services.AddHttpContextAccessor();

// Add database - get connection string from IConfiguration (reads from environment variables)
var connectionString = builder.Configuration["ConnectionStrings:DefaultConnection"];

if (string.IsNullOrEmpty(connectionString))
{
    // Build from individual environment variables if not found in config
    var dbHost = builder.Configuration["DB_HOST"] ?? "postgres";
    var dbPort = builder.Configuration["DB_PORT"] ?? "5432";
    var dbName = builder.Configuration["DB_NAME"] ?? "healthtracking";
    var dbUser = builder.Configuration["DB_USER"] ?? "healthtracking";
    var dbPassword = builder.Configuration["DB_PASSWORD"] ?? "healthtracking123";
    
    connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword}";
}

builder.Services.AddDbContext<HealthDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add controllers
builder.Services.AddControllers();

// Add Swagger
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Tenant resolution middleware - skip for health probe endpoints
app.Use(async (context, next) =>
{
    // Skip tenant validation for health probes and swagger
    if (context.Request.Path.StartsWithSegments("/health") ||
        context.Request.Path.StartsWithSegments("/swagger") ||
        context.Request.Path == "/")
    {
        await next();
        return;
    }

    var tenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
    var userId = context.Request.Headers["X-User-Id"].FirstOrDefault();

    if (Guid.TryParse(tenantId, out var parsedTenantId) && Guid.TryParse(userId, out var parsedUserId))
    {
        context.Items["TenantId"] = parsedTenantId;
        context.Items["UserId"] = parsedUserId;
    }
    else
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsJsonAsync(new { error = "Invalid or missing X-Tenant-Id and X-User-Id headers" });
        return;
    }

    await next();
});

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Health check endpoint
app.MapGet("/health", async (HealthDbContext context) =>
{
    try
    {
        await context.Database.ExecuteSqlRawAsync("SELECT 1");
        return Results.Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            database = "connected"
        });
    }
    catch
    {
        return Results.StatusCode(500);
    }
});

// Run migrations on startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<HealthDbContext>();
    context.Database.Migrate();
}

app.Run();

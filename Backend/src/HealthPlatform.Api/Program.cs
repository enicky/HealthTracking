using HealthPlatform.Application.Interfaces;
using HealthPlatform.Infrastructure.Persistence;
using HealthPlatform.Infrastructure.Repositories;
using HealthPlatform.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddScoped<HealthDbContext>();

// Add repositories
builder.Services.AddScoped<IEcgRepository, EcgRepository>();
builder.Services.AddScoped<IBloodPressureRepository, BloodPressureRepository>();
builder.Services.AddScoped<ITenantRepository, TenantRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Add services
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IEcgService, EcgService>();
builder.Services.AddScoped<IBloodPressureService, BloodPressureService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Add HTTP context accessor for tenant resolution
builder.Services.AddHttpContextAccessor();

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"];
var issuer = jwtSettings["Issuer"];
var audience = jwtSettings["Audience"];

if (string.IsNullOrEmpty(secretKey) || secretKey.Length < 32)
{
    throw new InvalidOperationException("JWT SecretKey must be at least 32 characters. Configure it in appsettings.json");
}

var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        // Map claim types
        NameClaimType = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
        RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    };
});

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

// Add CORS for local development
builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalDevelopment", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            policy.WithOrigins("https://healthplatform.com")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

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

// Enable CORS
app.UseCors("LocalDevelopment");

// JWT and tenant resolution middleware
app.UseAuthentication();
app.UseAuthorization();

// Tenant resolution middleware - extract from JWT claims or headers
app.Use(async (context, next) =>
{
    // Skip tenant validation for public endpoints and endpoints with their own authorization
    if (context.Request.Path.StartsWithSegments("/health") ||
        context.Request.Path.StartsWithSegments("/swagger") ||
        context.Request.Path.StartsWithSegments("/api/auth") ||
        context.Request.Path.StartsWithSegments("/api/tenants") ||
        context.Request.Path.StartsWithSegments("/api/users") ||
        context.Request.Path == "/")
    {
        await next();
        return;
    }

    // Try to get from JWT claims first
    var tenantIdClaim = context.User?.FindFirst("tenant_id");
    var userIdClaim = context.User?.FindFirst("sub"); // sub is standard for user ID
    var roleClaim = context.User?.FindFirst("role");

    if (tenantIdClaim != null && userIdClaim != null && roleClaim != null)
    {
        if (Guid.TryParse(tenantIdClaim.Value, out var parsedTenantId) && 
            Guid.TryParse(userIdClaim.Value, out var parsedUserId))
        {
            context.Items["TenantId"] = parsedTenantId;
            context.Items["UserId"] = parsedUserId;
            
            // Parse and store role
            if (Enum.TryParse<HealthPlatform.Domain.Entities.UserRole>(roleClaim.Value, out var userRole))
            {
                context.Items["UserRole"] = userRole;
            }
            
            await next();
            return;
        }
    }

    // Fallback to header-based tenant resolution for backward compatibility
    var tenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
    var userId = context.Request.Headers["X-User-Id"].FirstOrDefault();

    if (Guid.TryParse(tenantId, out var parsedTenantIdHeader) && Guid.TryParse(userId, out var parsedUserIdHeader))
    {
        context.Items["TenantId"] = parsedTenantIdHeader;
        context.Items["UserId"] = parsedUserIdHeader;
        // Default role for header-based requests
        context.Items["UserRole"] = HealthPlatform.Domain.Entities.UserRole.User;
        await next();
        return;
    }

    context.Response.StatusCode = 401;
    await context.Response.WriteAsJsonAsync(new { error = "Unauthorized: Missing or invalid authentication" });
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
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    logger.LogInformation("Running database migrations...");
    context.Database.Migrate();
    logger.LogInformation("Database migrations completed");
}

app.Run();

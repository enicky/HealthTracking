using HealthPlatform.Application.Interfaces;
using HealthPlatform.Api.Filters;
using HealthPlatform.Infrastructure.Persistence;
using HealthPlatform.Infrastructure.Repositories;
using HealthPlatform.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.Extensions.Logging.Console;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

// Configure logging with compact single-line format
builder.Logging.ClearProviders();
builder.Logging.AddConsoleFormatter<CompactConsoleFormatter, ConsoleFormatterOptions>();
builder.Logging.AddConsole(options =>
{
    options.FormatterName = "compact";
});

// Add services
builder.Services.AddScoped<HealthDbContext>();
builder.Services.AddScoped<IEcgRepository, EcgRepository>();
builder.Services.AddScoped<IBloodPressureRepository, BloodPressureRepository>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IEcgService, EcgService>();
builder.Services.AddScoped<IBloodPressureService, BloodPressureService>();

// Add HTTP context accessor for tenant resolution
builder.Services.AddHttpContextAccessor();

// Add database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=postgres;Port=5432;Database=healthtracking;Username=healthtracking;Password=healthtracking123";

builder.Services.AddDbContext<HealthDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add controllers
builder.Services.AddControllers();

// Add Swagger with tenant/user header parameters
builder.Services.AddSwaggerGen(options =>
{
    options.OperationFilter<TenantHeaderOperationFilter>();
});

var app = builder.Build();

// Only use HTTPS redirect in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Enable static files (before UseRouting)
app.UseStaticFiles();

// Enable CORS BEFORE routing (important for preflight!)
app.UseCors("AllowFrontend");

// Enable routing
app.UseRouting();

// Swagger middleware (AFTER routing)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Request logging middleware (EARLY in pipeline)
// app.Use(async (context, next) =>
// {
//     var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
//     logger.LogInformation("📨 [EARLY] Incoming Request: {Method} {Path} | Headers: X-Tenant-Id={TenantId}, X-User-Id={UserId}", 
//         context.Request.Method, 
//         context.Request.Path,
//         context.Request.Headers["X-Tenant-Id"].FirstOrDefault() ?? "MISSING",
//         context.Request.Headers["X-User-Id"].FirstOrDefault() ?? "MISSING");
    
//     await next();
// });

// Tenant resolution middleware (runs on all requests)
app.Use(async (context, next) =>
{
    // Skip tenant validation for Swagger and health endpoints
    if (context.Request.Path.StartsWithSegments("/swagger") ||
        context.Request.Path.StartsWithSegments("/health"))
    {
        await next();
        return;
    }
    
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
    var tenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
    var userId = context.Request.Headers["X-User-Id"].FirstOrDefault();

    // logger.LogInformation("🔐 Tenant Resolution - Path: {Path}, TenantId: {TenantId}, UserId: {UserId}", 
    //     context.Request.Path,
    //     tenantId ?? "NULL", 
    //     userId ?? "NULL");

    if (Guid.TryParse(tenantId, out var parsedTenantId) && Guid.TryParse(userId, out var parsedUserId))
    {
        context.Items["TenantId"] = parsedTenantId;
        context.Items["UserId"] = parsedUserId;
        //logger.LogInformation("✅ Valid tenant/user headers - TenantId: {TenantId}, UserId: {UserId}", parsedTenantId, parsedUserId);
        await next();
    }
    else
    {
        logger.LogWarning("❌ Invalid tenant/user headers - TenantId: '{TenantId}' (valid: {TenantIdValid}), UserId: '{UserId}' (valid: {UserIdValid}), Path: {Path}", 
            tenantId ?? "NULL", Guid.TryParse(tenantId, out _), 
            userId ?? "NULL", Guid.TryParse(userId, out _),
            context.Request.Path);
        
        context.Response.StatusCode = 400;
        await context.Response.WriteAsJsonAsync(new 
        { 
            error = "Invalid or missing X-Tenant-Id and X-User-Id headers",
            details = new 
            {
                tenantIdProvided = !string.IsNullOrEmpty(tenantId),
                userIdProvided = !string.IsNullOrEmpty(userId),
                tenantIdValid = Guid.TryParse(tenantId, out _),
                userIdValid = Guid.TryParse(userId, out _),
                path = context.Request.Path.ToString()
            }
        });
        return;
    }
});

app.UseAuthorization();

// Map endpoints AFTER middleware
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

// Custom compact console formatter for single-line logging
public sealed class CompactConsoleFormatter : ConsoleFormatter
{
    public CompactConsoleFormatter() : base("compact") { }

    public override void Write<TState>(
        in Microsoft.Extensions.Logging.Abstractions.LogEntry<TState> logEntry,
        IExternalScopeProvider? scopeProvider,
        TextWriter textWriter)
    {
        var levelStr = GetLevelString(logEntry.LogLevel);
        var timestamp = DateTime.Now.ToString("HH:mm:ss.fff");
        var categoryName = logEntry.Category;
        
        // Extract just the class name from the full namespace
        var className = categoryName.Split('.').Last();
        
        var message = logEntry.Formatter(logEntry.State, logEntry.Exception);
        
        // Format: [HH:mm:ss.fff] LEVEL [ClassName] message
        var logLine = $"[{timestamp}] {levelStr,-5} [{className}] {message}";
        
        if (logEntry.Exception != null)
        {
            logLine += Environment.NewLine + logEntry.Exception;
        }
        
        textWriter.WriteLine(logLine);
    }

    private static string GetLevelString(LogLevel level) => level switch
    {
        LogLevel.Trace => "TRCE",
        LogLevel.Debug => "DBUG",
        LogLevel.Information => "INFO",
        LogLevel.Warning => "WARN",
        LogLevel.Error => "ERR!",
        LogLevel.Critical => "CRIT",
        _ => level.ToString().ToUpper()
    };
}

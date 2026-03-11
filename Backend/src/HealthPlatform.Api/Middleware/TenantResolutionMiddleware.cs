using HealthPlatform.Application.Interfaces;

namespace HealthPlatform.Api.Middleware;

/// <summary>
/// Middleware for resolving tenant context from HTTP headers.
/// Extracts X-Tenant-Id and X-User-Id headers and validates them.
/// </summary>
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantResolutionMiddleware> _logger;

    public TenantResolutionMiddleware(RequestDelegate next, ILogger<TenantResolutionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var tenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        var userId = context.Request.Headers["X-User-Id"].FirstOrDefault();

        _logger.LogInformation("TenantResolutionMiddleware: Received headers - X-Tenant-Id={TenantId}, X-User-Id={UserId}", tenantId, userId);

        if (!Guid.TryParse(tenantId, out var parsedTenantId))
        {
            _logger.LogWarning("Invalid or missing X-Tenant-Id header: {TenantId}", tenantId);
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new { error = "Invalid or missing X-Tenant-Id header" });
            return;
        }

        if (!Guid.TryParse(userId, out var parsedUserId))
        {
            _logger.LogWarning("Invalid or missing X-User-Id header: {UserId}", userId);
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new { error = "Invalid or missing X-User-Id header" });
            return;
        }

        context.Items["TenantId"] = parsedTenantId;
        context.Items["UserId"] = parsedUserId;

        _logger.LogInformation("Tenant context set: TenantId={TenantId}, UserId={UserId}", parsedTenantId, parsedUserId);

        await _next(context);
    }
}

using HealthPlatform.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace HealthPlatform.Infrastructure.Services;

public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid GetCurrentTenantId()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.Items.TryGetValue("TenantId", out var tenantId) == true)
        {
            return (Guid)tenantId;
        }
        throw new InvalidOperationException("Tenant ID not found in context");
    }

    public Guid GetCurrentUserId()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.Items.TryGetValue("UserId", out var userId) == true)
        {
            return (Guid)userId;
        }
        throw new InvalidOperationException("User ID not found in context");
    }
}

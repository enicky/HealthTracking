namespace HealthPlatform.Application.Interfaces;

public interface ITenantService
{
    Guid GetCurrentTenantId();
    Guid GetCurrentUserId();
}

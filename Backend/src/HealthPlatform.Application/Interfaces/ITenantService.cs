namespace HealthPlatform.Application.Interfaces;

public interface ITenantService
{
    Guid GetCurrentTenantId();
    Guid GetCurrentUserId();
    
    /// <summary>
    /// Gets the role of the current user
    /// </summary>
    /// <returns>User role</returns>
    Domain.Entities.UserRole GetCurrentUserRole();

    /// <summary>
    /// Creates a new tenant with an admin user
    /// </summary>
    /// <param name="dto">Tenant creation data</param>
    /// <returns>Created tenant information</returns>
    Task<CreateTenantResponseDto> CreateTenantAsync(CreateTenantDto dto);

    /// <summary>
    /// Gets all tenants (only accessible to super admins)
    /// </summary>
    /// <returns>List of tenants</returns>
    Task<List<TenantDto>> GetAllTenantsAsync();

    /// <summary>
    /// Gets a specific tenant by ID
    /// </summary>
    /// <param name="tenantId">Tenant ID</param>
    /// <returns>Tenant information</returns>
    Task<TenantDto?> GetTenantByIdAsync(Guid tenantId);

    /// <summary>
    /// Updates a tenant
    /// </summary>
    /// <param name="tenantId">Tenant ID</param>
    /// <param name="dto">Update data</param>
    /// <returns>Updated tenant information</returns>
    Task<TenantDto?> UpdateTenantAsync(Guid tenantId, UpdateTenantDto dto);

    /// <summary>
    /// Deletes a tenant
    /// </summary>
    /// <param name="tenantId">Tenant ID</param>
    /// <returns>True if deleted, false otherwise</returns>
    Task<bool> DeleteTenantAsync(Guid tenantId);
}

namespace HealthPlatform.Domain.Entities;

/// <summary>
/// User roles in the system
/// </summary>
public enum UserRole
{
    /// <summary>Super admin - can manage all tenants and users across the system</summary>
    SuperAdmin = 0,
    
    /// <summary>Tenant admin - can manage users and settings within their tenant</summary>
    TenantAdmin = 1,
    
    /// <summary>Regular user - can only view and manage their own data</summary>
    User = 2
}

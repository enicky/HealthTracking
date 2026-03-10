namespace HealthPlatform.Application.Interfaces;

/// <summary>Service for managing authentication and JWT tokens</summary>
public interface IAuthService
{
    /// <summary>
    /// Authenticates a user and returns a JWT token
    /// </summary>
    /// <param name="email">User email</param>
    /// <param name="password">User password</param>
    /// <returns>Login response with token and user info</returns>
    Task<LoginResponseDto> LoginAsync(string email, string password);

    /// <summary>
    /// Creates and signs a JWT token for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="tenantId">Tenant ID</param>
    /// <param name="email">User email</param>
    /// <param name="role">User role</param>
    /// <returns>JWT token string</returns>
    string GenerateToken(Guid userId, Guid tenantId, string email, Domain.Entities.UserRole role);

    /// <summary>
    /// Validates a JWT token and returns the claims
    /// </summary>
    /// <param name="token">JWT token</param>
    /// <returns>Claims if valid, null otherwise</returns>
    System.Security.Claims.ClaimsPrincipal? ValidateToken(string token);
}

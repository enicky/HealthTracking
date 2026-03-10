namespace HealthPlatform.Application.Interfaces;

public interface IUserService
{
    /// <summary>
    /// Creates a new user in a tenant
    /// </summary>
    /// <param name="dto">User creation data</param>
    /// <returns>Created user information with temporary password</returns>
    Task<CreateUserResponseDto> CreateUserAsync(CreateUserDto dto);

    /// <summary>
    /// Gets all users in a tenant
    /// </summary>
    /// <param name="tenantId">Tenant ID</param>
    /// <returns>List of users</returns>
    Task<List<UserDto>> GetTenantUsersAsync(Guid tenantId);

    /// <summary>
    /// Gets a specific user by ID
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>User information</returns>
    Task<UserDto?> GetUserByIdAsync(Guid userId);

    /// <summary>
    /// Updates a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="dto">Update data</param>
    /// <returns>Updated user information</returns>
    Task<UserDto?> UpdateUserAsync(Guid userId, UpdateUserDto dto);

    /// <summary>
    /// Deletes a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>True if deleted, false otherwise</returns>
    Task<bool> DeleteUserAsync(Guid userId);
}

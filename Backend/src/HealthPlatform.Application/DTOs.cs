using HealthPlatform.Domain.Entities;

namespace HealthPlatform.Application;

/// <summary>DTO for user login request</summary>
public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

/// <summary>DTO for login response with token</summary>
public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

/// <summary>DTO for user information</summary>
public class UserDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>DTO for creating a new tenant with admin user</summary>
public class CreateTenantDto
{
    public string Name { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminFirstName { get; set; } = "Admin";
    public string AdminLastName { get; set; } = "";
}

/// <summary>DTO for creating a new tenant response</summary>
public class CreateTenantResponseDto
{
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public UserDto AdminUser { get; set; } = null!;
    public string DefaultPassword { get; set; } = string.Empty;
}

/// <summary>DTO for tenant information</summary>
public class TenantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int UserCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>DTO for updating tenant information</summary>
public class UpdateTenantDto
{
    public string Name { get; set; } = string.Empty;
}

/// <summary>DTO for creating a new user</summary>
public class CreateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public Guid TenantId { get; set; }
}

/// <summary>DTO for creating a new user response</summary>
public class CreateUserResponseDto
{
    public UserDto User { get; set; } = null!;
    public string DefaultPassword { get; set; } = string.Empty;
}

/// <summary>DTO for updating a user</summary>
public class UpdateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
}

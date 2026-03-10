using HealthPlatform.Application;
using HealthPlatform.Application.Interfaces;
using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Repositories;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace HealthPlatform.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ITenantRepository _tenantRepository;
    private readonly ILogger<UserService> _logger;

    public UserService(
        IUserRepository userRepository,
        ITenantRepository tenantRepository,
        ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _tenantRepository = tenantRepository;
        _logger = logger;
    }

    public async Task<CreateUserResponseDto> CreateUserAsync(CreateUserDto dto)
    {
        // Verify tenant exists
        var tenant = await _tenantRepository.GetByIdAsync(dto.TenantId);
        if (tenant == null)
        {
            throw new InvalidOperationException($"Tenant with ID '{dto.TenantId}' not found");
        }

        // Check if user with email already exists in tenant
        var existingUser = await _userRepository.GetByEmailAndTenantAsync(dto.Email, dto.TenantId);
        if (existingUser != null)
        {
            throw new InvalidOperationException($"User with email '{dto.Email}' already exists in this tenant");
        }

        try
        {
            // Generate temporary password
            var tempPassword = GenerateTemporaryPassword();

            // Create new user
            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = dto.TenantId,
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                PasswordHash = HashPassword(tempPassword),
                Role = dto.Role,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdUser = await _userRepository.CreateAsync(user);

            _logger.LogInformation("Created user {UserId} in tenant {TenantId}", createdUser.Id, createdUser.TenantId);

            return new CreateUserResponseDto
            {
                User = new UserDto
                {
                    Id = createdUser.Id,
                    TenantId = createdUser.TenantId,
                    Email = createdUser.Email,
                    FirstName = createdUser.FirstName,
                    LastName = createdUser.LastName,
                    Role = createdUser.Role,
                    CreatedAt = createdUser.CreatedAt
                },
                DefaultPassword = tempPassword
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user: {Message}", ex.Message);
            throw;
        }
    }

    public async Task<List<UserDto>> GetTenantUsersAsync(Guid tenantId)
    {
        var users = await _userRepository.GetTenantUsersAsync(tenantId);
        return users.Select(u => new UserDto
        {
            Id = u.Id,
            TenantId = u.TenantId,
            Email = u.Email,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Role = u.Role,
            CreatedAt = u.CreatedAt
        }).ToList();
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return null;

        return new UserDto
        {
            Id = user.Id,
            TenantId = user.TenantId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserDto?> UpdateUserAsync(Guid userId, UpdateUserDto dto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return null;

        // Check if email is being changed and if new email already exists in tenant
        if (user.Email != dto.Email)
        {
            var existingUser = await _userRepository.GetByEmailAndTenantAsync(dto.Email, user.TenantId);
            if (existingUser != null)
            {
                throw new InvalidOperationException($"User with email '{dto.Email}' already exists in this tenant");
            }
        }

        user.Email = dto.Email;
        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.Role = dto.Role;

        await _userRepository.UpdateAsync(user);

        return new UserDto
        {
            Id = user.Id,
            TenantId = user.TenantId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<bool> DeleteUserAsync(Guid userId)
    {
        return await _userRepository.DeleteAsync(userId);
    }

    private string GenerateTemporaryPassword()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        var random = new Random();
        var password = new StringBuilder();

        for (int i = 0; i < 12; i++)
        {
            password.Append(chars[random.Next(chars.Length)]);
        }

        return password.ToString();
    }

    private string HashPassword(string password)
    {
        using (var sha256 = SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }
}

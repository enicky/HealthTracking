using HealthPlatform.Application;
using HealthPlatform.Application.Interfaces;
using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace HealthPlatform.Infrastructure.Services;

public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ITenantRepository _tenantRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<TenantService> _logger;

    public TenantService(
        IHttpContextAccessor httpContextAccessor,
        ITenantRepository tenantRepository,
        IUserRepository userRepository,
        ILogger<TenantService> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _tenantRepository = tenantRepository;
        _userRepository = userRepository;
        _logger = logger;
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

    public UserRole GetCurrentUserRole()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.Items.TryGetValue("UserRole", out var role) == true)
        {
            return (UserRole)role;
        }
        throw new InvalidOperationException("User role not found in context");
    }

    public async Task<CreateTenantResponseDto> CreateTenantAsync(CreateTenantDto dto)
    {
        // Verify tenant with the same name doesn't exist
        var existingTenant = await _tenantRepository.GetByNameAsync(dto.Name);
        if (existingTenant != null)
        {
            throw new InvalidOperationException($"Tenant with name '{dto.Name}' already exists");
        }

        try
        {
            // Create new tenant
            var tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                CreatedAt = DateTime.UtcNow
            };

            var createdTenant = await _tenantRepository.CreateAsync(tenant);

            // Generate temporary password
            var tempPassword = GenerateTemporaryPassword();

            // Create admin user for the tenant
            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                TenantId = createdTenant.Id,
                Email = dto.AdminEmail,
                FirstName = dto.AdminFirstName,
                LastName = dto.AdminLastName,
                PasswordHash = HashPassword(tempPassword),
                Role = UserRole.TenantAdmin,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdUser = await _userRepository.CreateAsync(adminUser);

            _logger.LogInformation("Created tenant {TenantId} with admin user {UserId}", createdTenant.Id, createdUser.Id);

            return new CreateTenantResponseDto
            {
                TenantId = createdTenant.Id,
                TenantName = createdTenant.Name,
                AdminUser = new UserDto
                {
                    Id = createdUser.Id,
                    TenantId = createdUser.TenantId,
                    Email = createdUser.Email,
                    FirstName = createdUser.FirstName,
                    LastName = createdUser.LastName,
                    Role = createdUser.Role
                },
                DefaultPassword = tempPassword
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tenant: {Message}", ex.Message);
            throw;
        }
    }

    public async Task<List<TenantDto>> GetAllTenantsAsync()
    {
        var tenants = await _tenantRepository.GetAllAsync();
        return tenants.Select(t => new TenantDto
        {
            Id = t.Id,
            Name = t.Name,
            UserCount = t.Users?.Where(u => u.DeletedAt == null).Count() ?? 0,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt
        }).ToList();
    }

    public async Task<TenantDto?> GetTenantByIdAsync(Guid tenantId)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant == null)
            return null;

        return new TenantDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            UserCount = tenant.Users?.Where(u => u.DeletedAt == null).Count() ?? 0,
            CreatedAt = tenant.CreatedAt,
            UpdatedAt = tenant.UpdatedAt
        };
    }

    public async Task<TenantDto?> UpdateTenantAsync(Guid tenantId, UpdateTenantDto dto)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant == null)
            return null;

        // Check if another tenant has the same name
        if (tenant.Name != dto.Name)
        {
            var existingTenant = await _tenantRepository.GetByNameAsync(dto.Name);
            if (existingTenant != null)
            {
                throw new InvalidOperationException($"Tenant with name '{dto.Name}' already exists");
            }
        }

        tenant.Name = dto.Name;
        await _tenantRepository.UpdateAsync(tenant);

        return new TenantDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            UserCount = tenant.Users?.Where(u => u.DeletedAt == null).Count() ?? 0,
            CreatedAt = tenant.CreatedAt,
            UpdatedAt = tenant.UpdatedAt
        };
    }

    public async Task<bool> DeleteTenantAsync(Guid tenantId)
    {
        return await _tenantRepository.DeleteAsync(tenantId);
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

using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthPlatform.Infrastructure.Repositories;

public interface IUserRepository
{
    Task<User> CreateAsync(User user);
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByEmailAndTenantAsync(string email, Guid tenantId);
    Task<List<User>> GetTenantUsersAsync(Guid tenantId);
    Task<bool> UpdateAsync(User user);
    Task<bool> DeleteAsync(Guid id);
    Task SaveChangesAsync();
}

public class UserRepository : IUserRepository
{
    private readonly HealthDbContext _context;

    public UserRepository(HealthDbContext context)
    {
        _context = context;
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == id && u.DeletedAt == null);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null);
    }

    public async Task<User?> GetByEmailAndTenantAsync(string email, Guid tenantId)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => 
                u.Email == email && 
                u.TenantId == tenantId && 
                u.DeletedAt == null);
    }

    public async Task<List<User>> GetTenantUsersAsync(Guid tenantId)
    {
        return await _context.Users
            .Where(u => u.TenantId == tenantId && u.DeletedAt == null)
            .OrderBy(u => u.Email)
            .ToListAsync();
    }

    public async Task<bool> UpdateAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        _context.Users.Update(user);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var user = await GetByIdAsync(id);
        if (user == null)
            return false;

        user.DeletedAt = DateTime.UtcNow;
        _context.Users.Update(user);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}

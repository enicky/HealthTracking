using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthPlatform.Infrastructure.Repositories;

public interface ITenantRepository
{
    Task<Tenant> CreateAsync(Tenant tenant);
    Task<Tenant?> GetByIdAsync(Guid id);
    Task<Tenant?> GetByNameAsync(string name);
    Task<List<Tenant>> GetAllAsync();
    Task<bool> UpdateAsync(Tenant tenant);
    Task<bool> DeleteAsync(Guid id);
    Task SaveChangesAsync();
}

public class TenantRepository : ITenantRepository
{
    private readonly HealthDbContext _context;

    public TenantRepository(HealthDbContext context)
    {
        _context = context;
    }

    public async Task<Tenant> CreateAsync(Tenant tenant)
    {
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();
        return tenant;
    }

    public async Task<Tenant?> GetByIdAsync(Guid id)
    {
        return await _context.Tenants
            .Include(t => t.Users)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<Tenant?> GetByNameAsync(string name)
    {
        return await _context.Tenants
            .FirstOrDefaultAsync(t => t.Name == name);
    }

    public async Task<List<Tenant>> GetAllAsync()
    {
        return await _context.Tenants
            .Include(t => t.Users)
            .OrderBy(t => t.Name)
            .ToListAsync();
    }

    public async Task<bool> UpdateAsync(Tenant tenant)
    {
        tenant.UpdatedAt = DateTime.UtcNow;
        _context.Tenants.Update(tenant);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var tenant = await GetByIdAsync(id);
        if (tenant == null)
            return false;

        _context.Tenants.Remove(tenant);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}

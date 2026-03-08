using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthPlatform.Infrastructure.Repositories;

public interface IBloodPressureRepository
{
    Task<BloodPressureReading> CreateAsync(BloodPressureReading reading);
    Task<BloodPressureReading?> GetByIdAsync(Guid id, Guid tenantId, Guid userId);
    Task<IEnumerable<BloodPressureReading>> GetUserReadingsAsync(Guid tenantId, Guid userId, int skip = 0, int take = 50);
    Task SaveChangesAsync();
}

public class BloodPressureRepository : IBloodPressureRepository
{
    private readonly HealthDbContext _context;

    public BloodPressureRepository(HealthDbContext context)
    {
        _context = context;
    }

    public async Task<BloodPressureReading> CreateAsync(BloodPressureReading reading)
    {
        _context.BloodPressureReadings.Add(reading);
        await _context.SaveChangesAsync();
        return reading;
    }

    public async Task<BloodPressureReading?> GetByIdAsync(Guid id, Guid tenantId, Guid userId)
    {
        return await _context.BloodPressureReadings
            .FirstOrDefaultAsync(b => b.Id == id && b.TenantId == tenantId && b.UserId == userId && b.DeletedAt == null);
    }

    public async Task<IEnumerable<BloodPressureReading>> GetUserReadingsAsync(Guid tenantId, Guid userId, int skip = 0, int take = 50)
    {
        return await _context.BloodPressureReadings
            .Where(b => b.TenantId == tenantId && b.UserId == userId && b.DeletedAt == null)
            .OrderByDescending(b => b.RecordedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}

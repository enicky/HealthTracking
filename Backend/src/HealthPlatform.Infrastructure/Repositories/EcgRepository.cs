using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthPlatform.Infrastructure.Repositories;

public interface IEcgRepository
{
    Task<EcgSession> CreateAsync(EcgSession session);
    Task<EcgSession?> GetByIdAsync(Guid id, Guid tenantId, Guid userId);
    Task<IEnumerable<EcgSession>> GetUserSessionsAsync(Guid tenantId, Guid userId, int skip = 0, int take = 50);
    Task SaveChangesAsync();
}

public class EcgRepository : IEcgRepository
{
    private readonly HealthDbContext _context;

    public EcgRepository(HealthDbContext context)
    {
        _context = context;
    }

    public async Task<EcgSession> CreateAsync(EcgSession session)
    {
        _context.EcgSessions.Add(session);
        await _context.SaveChangesAsync();
        return session;
    }

    public async Task<EcgSession?> GetByIdAsync(Guid id, Guid tenantId, Guid userId)
    {
        return await _context.EcgSessions
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && e.UserId == userId && e.DeletedAt == null);
    }

    public async Task<IEnumerable<EcgSession>> GetUserSessionsAsync(Guid tenantId, Guid userId, int skip = 0, int take = 50)
    {
        return await _context.EcgSessions
            .Where(e => e.TenantId == tenantId && e.UserId == userId && e.DeletedAt == null)
            .OrderByDescending(e => e.RecordedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}

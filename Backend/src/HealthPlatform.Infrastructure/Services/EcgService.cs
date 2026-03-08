using HealthPlatform.Application.Interfaces;
using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthPlatform.Infrastructure.Services;

public class EcgService : IEcgService
{
    private readonly HealthDbContext _context;
    private readonly ITenantService _tenantService;

    public EcgService(HealthDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<EcgSessionDto> CreateEcgSessionAsync(CreateEcgSessionDto dto)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        // Verify user exists and belongs to tenant
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId && u.DeletedAt == null);
        
        if (user == null)
            throw new UnauthorizedAccessException("User not found or does not belong to tenant");

        var session = new EcgSession
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = userId,
            RecordedAt = dto.RecordedAt,
            Classification = dto.Classification,
            AverageHeartRate = dto.AverageHeartRate,
            Samples = System.Text.Json.JsonDocument.Parse(dto.Samples.GetRawText()),
            CreatedAt = DateTime.UtcNow
        };

        _context.EcgSessions.Add(session);
        await _context.SaveChangesAsync();

        return MapToDto(session);
    }

    public async Task<IEnumerable<EcgSessionDto>> GetEcgSessionsAsync(int skip = 0, int take = 50)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        var sessions = await _context.EcgSessions
            .Where(e => e.TenantId == tenantId && e.UserId == userId && e.DeletedAt == null)
            .OrderByDescending(e => e.RecordedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        return sessions.Select(MapToDto);
    }

    public async Task<EcgSessionDto?> GetEcgSessionByIdAsync(Guid id)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        var session = await _context.EcgSessions
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && e.UserId == userId && e.DeletedAt == null);

        return session != null ? MapToDto(session) : null;
    }

    public async Task<bool> DeleteEcgSessionAsync(Guid id)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        var session = await _context.EcgSessions
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && e.UserId == userId && e.DeletedAt == null);

        if (session == null)
            return false;

        // Soft delete by setting DeletedAt
        session.DeletedAt = DateTime.UtcNow;
        _context.EcgSessions.Update(session);
        await _context.SaveChangesAsync();

        return true;
    }

    private static EcgSessionDto MapToDto(EcgSession session)
    {
        return new EcgSessionDto
        {
            Id = session.Id,
            RecordedAt = session.RecordedAt,
            Classification = session.Classification,
            AverageHeartRate = session.AverageHeartRate,
            Samples = System.Text.Json.JsonDocument.Parse(session.Samples.RootElement.GetRawText()).RootElement,
            CreatedAt = session.CreatedAt
        };
    }
}

using HealthPlatform.Application.Interfaces;
using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HealthPlatform.Infrastructure.Services;

public class EcgService : IEcgService
{
    private readonly HealthDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly ILogger<EcgService> _logger;

    public EcgService(HealthDbContext context, ITenantService tenantService, ILogger<EcgService> logger)
    {
        _context = context;
        _tenantService = tenantService;
        _logger = logger;
    }

    public async Task<EcgSessionDto> CreateEcgSessionAsync(CreateEcgSessionDto dto)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        _logger.LogInformation("CreateEcgSessionAsync called - TenantId: {TenantId}, UserId: {UserId}, RecordedAt: {RecordedAt}", 
            tenantId, userId, dto.RecordedAt);

        // Verify user exists and belongs to tenant
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId && u.DeletedAt == null);
        
        if (user == null)
            throw new UnauthorizedAccessException("User not found or does not belong to tenant");

        // Check if a session with the same recordedAt already exists for this user
        _logger.LogInformation("Checking for existing ECG session with RecordedAt: {RecordedAt}, TenantId: {TenantId}, UserId: {UserId}", 
            dto.RecordedAt, tenantId, userId);

        var existingSession = await _context.EcgSessions
            .FirstOrDefaultAsync(e => e.TenantId == tenantId && e.UserId == userId && 
                                       e.RecordedAt == dto.RecordedAt && e.DeletedAt == null);

        if (existingSession != null)
        {
            _logger.LogWarning("Duplicate ECG session detected for RecordedAt: {RecordedAt}, SessionId: {SessionId}. Returning existing session.", 
                dto.RecordedAt, existingSession.Id);
            // Return existing session instead of creating duplicate
            return MapToDto(existingSession);
        }

        _logger.LogInformation("No existing session found. Creating new ECG session for RecordedAt: {RecordedAt}", dto.RecordedAt);

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

        _logger.LogInformation("Successfully created new ECG session with Id: {SessionId}, RecordedAt: {RecordedAt}", 
            session.Id, session.RecordedAt);

        return MapToDto(session);
    }

    public async Task<IEnumerable<EcgSessionListDto>> GetEcgSessionsAsync(int skip = 0, int take = 50)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        _logger.LogInformation("GetEcgSessionsAsync called - TenantId: {TenantId}, UserId: {UserId}, Skip: {Skip}, Take: {Take}", 
            tenantId, userId, skip, take);

        var sessions = await _context.EcgSessions
            .Where(e => e.TenantId == tenantId && e.UserId == userId && e.DeletedAt == null)
            .OrderByDescending(e => e.RecordedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        _logger.LogInformation("Retrieved {SessionCount} ECG sessions from database", sessions.Count);

        return sessions.Select(MapToListDto);
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

    private static EcgSessionListDto MapToListDto(EcgSession session)
    {
        // Count samples in the JsonDocument
        int sampleCount = 0;
        try
        {
            var root = session.Samples.RootElement;
            if (root.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                sampleCount = root.GetArrayLength();
            }
        }
        catch
        {
            // If parsing fails, set count to 0
            sampleCount = 0;
        }

        return new EcgSessionListDto
        {
            Id = session.Id,
            RecordedAt = session.RecordedAt,
            Classification = session.Classification,
            AverageHeartRate = session.AverageHeartRate,
            SampleCount = sampleCount,
            CreatedAt = session.CreatedAt
        };
    }
}

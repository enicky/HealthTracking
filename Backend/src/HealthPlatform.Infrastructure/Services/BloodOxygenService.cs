using HealthPlatform.Application.Interfaces;
using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HealthPlatform.Infrastructure.Services;

public class BloodOxygenService : IBloodOxygenService
{
    private readonly HealthDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly ILogger<BloodOxygenService> _logger;

    public BloodOxygenService(HealthDbContext context, ITenantService tenantService, ILogger<BloodOxygenService> logger)
    {
        _context = context;
        _tenantService = tenantService;
        _logger = logger;
    }

    public async Task<BloodOxygenReadingDto> CreateReadingAsync(CreateBloodOxygenReadingDto dto)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        _logger.LogInformation("CreateReadingAsync called - TenantId: {TenantId}, UserId: {UserId}, RecordedAt: {RecordedAt}", 
            tenantId, userId, dto.RecordedAt);

        // Verify user exists and belongs to tenant
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId && u.DeletedAt == null);
        
        if (user == null)
            throw new UnauthorizedAccessException("User not found or does not belong to tenant");

        var reading = new BloodOxygenReading
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = userId,
            RecordedAt = dto.RecordedAt,
            Percentage = dto.Percentage,
            CreatedAt = DateTime.UtcNow
        };

        _context.BloodOxygenReadings.Add(reading);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully created blood oxygen reading with Id: {ReadingId}, RecordedAt: {RecordedAt}, Percentage: {Percentage}", 
            reading.Id, reading.RecordedAt, reading.Percentage);

        return MapToDto(reading);
    }

    public async Task<IEnumerable<BloodOxygenReadingDto>> GetReadingsAsync(int skip = 0, int take = 50)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        _logger.LogInformation("GetReadingsAsync called - TenantId: {TenantId}, UserId: {UserId}, Skip: {Skip}, Take: {Take}", 
            tenantId, userId, skip, take);

        var readings = await _context.BloodOxygenReadings
            .Where(r => r.TenantId == tenantId && r.UserId == userId && r.DeletedAt == null)
            .OrderByDescending(r => r.RecordedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        _logger.LogInformation("Retrieved {ReadingCount} blood oxygen readings from database", readings.Count);

        return readings.Select(MapToDto);
    }

    public async Task<BloodOxygenReadingDto?> GetReadingByIdAsync(Guid id)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        _logger.LogInformation("GetReadingByIdAsync called - ReadingId: {ReadingId}, TenantId: {TenantId}, UserId: {UserId}", 
            id, tenantId, userId);

        var reading = await _context.BloodOxygenReadings
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.UserId == userId && r.DeletedAt == null);

        if (reading == null)
        {
            _logger.LogWarning("Blood oxygen reading {ReadingId} not found", id);
            return null;
        }

        return MapToDto(reading);
    }

    public async Task DeleteReadingAsync(Guid id)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        _logger.LogInformation("DeleteReadingAsync called - ReadingId: {ReadingId}, TenantId: {TenantId}, UserId: {UserId}", 
            id, tenantId, userId);

        var reading = await _context.BloodOxygenReadings
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.UserId == userId && r.DeletedAt == null);

        if (reading == null)
        {
            _logger.LogWarning("Blood oxygen reading {ReadingId} not found for deletion", id);
            throw new UnauthorizedAccessException("Reading not found");
        }

        reading.DeletedAt = DateTime.UtcNow;
        _context.BloodOxygenReadings.Update(reading);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully soft-deleted blood oxygen reading {ReadingId}", id);
    }

    private static BloodOxygenReadingDto MapToDto(BloodOxygenReading reading)
    {
        return new BloodOxygenReadingDto
        {
            Id = reading.Id,
            RecordedAt = reading.RecordedAt,
            Percentage = reading.Percentage,
            CreatedAt = reading.CreatedAt
        };
    }
}

using HealthPlatform.Application.Interfaces;
using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HealthPlatform.Infrastructure.Services;

public class WristTemperatureService : IWristTemperatureService
{
    private readonly HealthDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly ILogger<WristTemperatureService> _logger;

    public WristTemperatureService(HealthDbContext context, ITenantService tenantService, ILogger<WristTemperatureService> logger)
    {
        _context = context;
        _tenantService = tenantService;
        _logger = logger;
    }

    public async Task<WristTemperatureReadingDto> CreateReadingAsync(CreateWristTemperatureReadingDto dto)
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

        // Check for duplicate RecordedAt
        var existingReading = await _context.WristTemperatureReadings
            .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.UserId == userId && r.RecordedAt == dto.RecordedAt && r.DeletedAt == null);
        
        if (existingReading != null)
        {
            _logger.LogWarning("Duplicate wrist temperature reading detected for RecordedAt: {RecordedAt}", dto.RecordedAt);
            throw new InvalidOperationException($"A wrist temperature reading already exists for {dto.RecordedAt:O}");
        }

        var reading = new WristTemperatureReading
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = userId,
            RecordedAt = dto.RecordedAt,
            Temperature = dto.Temperature,
            CreatedAt = DateTime.UtcNow
        };

        _context.WristTemperatureReadings.Add(reading);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully created wrist temperature reading with Id: {ReadingId}, RecordedAt: {RecordedAt}, Temperature: {Temperature}", 
            reading.Id, reading.RecordedAt, reading.Temperature);

        return MapToDto(reading);
    }

    public async Task<IEnumerable<WristTemperatureReadingDto>> GetReadingsAsync(int skip = 0, int take = 50)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        _logger.LogInformation("GetReadingsAsync called - TenantId: {TenantId}, UserId: {UserId}, Skip: {Skip}, Take: {Take}", 
            tenantId, userId, skip, take);

        var readings = await _context.WristTemperatureReadings
            .Where(r => r.TenantId == tenantId && r.UserId == userId && r.DeletedAt == null)
            .OrderByDescending(r => r.RecordedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        _logger.LogInformation("Retrieved {ReadingCount} wrist temperature readings from database", readings.Count);

        return readings.Select(MapToDto);
    }

    public async Task<WristTemperatureReadingDto?> GetReadingByIdAsync(Guid id)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        _logger.LogInformation("GetReadingByIdAsync called - ReadingId: {ReadingId}, TenantId: {TenantId}, UserId: {UserId}", 
            id, tenantId, userId);

        var reading = await _context.WristTemperatureReadings
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.UserId == userId && r.DeletedAt == null);

        if (reading == null)
        {
            _logger.LogWarning("Wrist temperature reading {ReadingId} not found", id);
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

        var reading = await _context.WristTemperatureReadings
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.UserId == userId && r.DeletedAt == null);

        if (reading == null)
        {
            _logger.LogWarning("Wrist temperature reading {ReadingId} not found for deletion", id);
            throw new UnauthorizedAccessException("Reading not found");
        }

        reading.DeletedAt = DateTime.UtcNow;
        _context.WristTemperatureReadings.Update(reading);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully soft-deleted wrist temperature reading {ReadingId}", id);
    }

    private static WristTemperatureReadingDto MapToDto(WristTemperatureReading reading)
    {
        return new WristTemperatureReadingDto
        {
            Id = reading.Id,
            RecordedAt = reading.RecordedAt,
            Temperature = reading.Temperature,
            CreatedAt = reading.CreatedAt
        };
    }
}

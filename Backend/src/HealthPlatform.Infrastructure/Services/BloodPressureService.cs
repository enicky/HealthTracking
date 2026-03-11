using HealthPlatform.Application.Interfaces;
using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HealthPlatform.Infrastructure.Services;

public class BloodPressureService : IBloodPressureService
{
    private readonly HealthDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly ILogger<BloodPressureService> _logger;

    public BloodPressureService(HealthDbContext context, ITenantService tenantService, ILogger<BloodPressureService> logger)
    {
        _context = context;
        _tenantService = tenantService;
        _logger = logger;
    }

    public async Task<BloodPressureReadingDto> CreateReadingAsync(CreateBloodPressureReadingDto dto)
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
        var existingReading = await _context.BloodPressureReadings
            .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.UserId == userId && r.RecordedAt == dto.RecordedAt && r.DeletedAt == null);
        
        if (existingReading != null)
        {
            _logger.LogWarning("Duplicate blood pressure reading detected for RecordedAt: {RecordedAt}. Returning existing reading.", dto.RecordedAt);
            return MapToDto(existingReading);
        }

        var reading = new BloodPressureReading
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = userId,
            RecordedAt = dto.RecordedAt,
            Systolic = dto.Systolic,
            Diastolic = dto.Diastolic,
            Pulse = dto.Pulse,
            CreatedAt = DateTime.UtcNow
        };

        _context.BloodPressureReadings.Add(reading);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully created blood pressure reading with Id: {ReadingId}, RecordedAt: {RecordedAt}, Systolic: {Systolic}, Diastolic: {Diastolic}", 
            reading.Id, reading.RecordedAt, reading.Systolic, reading.Diastolic);

        return MapToDto(reading);
    }

    public async Task<IEnumerable<BloodPressureReadingDto>> GetReadingsAsync(int skip = 0, int take = 50)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        _logger.LogInformation("GetReadingsAsync called - TenantId: {TenantId}, UserId: {UserId}, Skip: {Skip}, Take: {Take}", 
            tenantId, userId, skip, take);

        var readings = await _context.BloodPressureReadings
            .Where(r => r.TenantId == tenantId && r.UserId == userId && r.DeletedAt == null)
            .OrderByDescending(r => r.RecordedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        _logger.LogInformation("Retrieved {ReadingCount} blood pressure readings from database", readings.Count);

        return readings.Select(MapToDto);
    }

    public async Task<BloodPressureReadingDto?> GetReadingByIdAsync(Guid id)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        _logger.LogInformation("GetReadingByIdAsync called - Id: {ReadingId}, TenantId: {TenantId}, UserId: {UserId}", 
            id, tenantId, userId);

        var reading = await _context.BloodPressureReadings
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.UserId == userId && r.DeletedAt == null);

        if (reading == null)
        {
            _logger.LogWarning("Blood pressure reading not found - Id: {ReadingId}", id);
            return null;
        }

        _logger.LogInformation("Retrieved blood pressure reading - Id: {ReadingId}, RecordedAt: {RecordedAt}", 
            id, reading.RecordedAt);

        return MapToDto(reading);
    }

    public async Task DeleteReadingAsync(Guid id)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        _logger.LogInformation("DeleteReadingAsync called - Id: {ReadingId}, TenantId: {TenantId}, UserId: {UserId}", 
            id, tenantId, userId);

        var reading = await _context.BloodPressureReadings
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.UserId == userId && r.DeletedAt == null);

        if (reading == null)
        {
            _logger.LogWarning("Blood pressure reading not found for deletion - Id: {ReadingId}", id);
            throw new UnauthorizedAccessException("Blood pressure reading not found or does not belong to user");
        }

        reading.DeletedAt = DateTime.UtcNow;
        _context.BloodPressureReadings.Update(reading);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully deleted blood pressure reading - Id: {ReadingId}", id);
    }

    private static BloodPressureReadingDto MapToDto(BloodPressureReading reading)
    {
        return new BloodPressureReadingDto
        {
            Id = reading.Id,
            RecordedAt = reading.RecordedAt,
            Systolic = reading.Systolic,
            Diastolic = reading.Diastolic,
            Pulse = reading.Pulse,
            CreatedAt = reading.CreatedAt
        };
    }
}

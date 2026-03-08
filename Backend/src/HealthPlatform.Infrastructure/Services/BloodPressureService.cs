using HealthPlatform.Application.Interfaces;
using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthPlatform.Infrastructure.Services;

public class BloodPressureService : IBloodPressureService
{
    private readonly HealthDbContext _context;
    private readonly ITenantService _tenantService;

    public BloodPressureService(HealthDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<BloodPressureReadingDto> CreateReadingAsync(CreateBloodPressureReadingDto dto)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        // Verify user exists and belongs to tenant
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId && u.DeletedAt == null);
        
        if (user == null)
            throw new UnauthorizedAccessException("User not found or does not belong to tenant");

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

        return MapToDto(reading);
    }

    public async Task<IEnumerable<BloodPressureReadingDto>> GetReadingsAsync(int skip = 0, int take = 50)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        var readings = await _context.BloodPressureReadings
            .Where(r => r.TenantId == tenantId && r.UserId == userId && r.DeletedAt == null)
            .OrderByDescending(r => r.RecordedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        return readings.Select(MapToDto);
    }

    public async Task<BloodPressureReadingDto?> GetReadingByIdAsync(Guid id)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        var reading = await _context.BloodPressureReadings
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.UserId == userId && r.DeletedAt == null);

        return reading != null ? MapToDto(reading) : null;
    }

    public async Task DeleteReadingAsync(Guid id)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var userId = _tenantService.GetCurrentUserId();

        var reading = await _context.BloodPressureReadings
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.UserId == userId && r.DeletedAt == null);

        if (reading == null)
            throw new UnauthorizedAccessException("Blood pressure reading not found or does not belong to user");

        reading.DeletedAt = DateTime.UtcNow;
        _context.BloodPressureReadings.Update(reading);
        await _context.SaveChangesAsync();
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

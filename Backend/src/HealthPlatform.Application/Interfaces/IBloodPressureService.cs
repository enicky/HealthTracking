using HealthPlatform.Domain.Entities;

namespace HealthPlatform.Application.Interfaces;

public interface IBloodPressureService
{
    Task<BloodPressureReadingDto> CreateReadingAsync(CreateBloodPressureReadingDto dto);
    Task<IEnumerable<BloodPressureReadingDto>> GetReadingsAsync(int skip = 0, int take = 50);
    Task<BloodPressureReadingDto?> GetReadingByIdAsync(Guid id);
    Task DeleteReadingAsync(Guid id);
}

public class CreateBloodPressureReadingDto
{
    public DateTime RecordedAt { get; set; }
    public int Systolic { get; set; }
    public int Diastolic { get; set; }
    public int? Pulse { get; set; }
}

public class BloodPressureReadingDto
{
    public Guid Id { get; set; }
    public DateTime RecordedAt { get; set; }
    public int Systolic { get; set; }
    public int Diastolic { get; set; }
    public int? Pulse { get; set; }
    public DateTime CreatedAt { get; set; }
}

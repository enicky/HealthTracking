namespace HealthPlatform.Application.Interfaces;

public interface IBloodOxygenService
{
    Task<BloodOxygenReadingDto> CreateReadingAsync(CreateBloodOxygenReadingDto dto);
    Task<IEnumerable<BloodOxygenReadingDto>> GetReadingsAsync(int skip = 0, int take = 50);
    Task<BloodOxygenReadingDto?> GetReadingByIdAsync(Guid id);
    Task DeleteReadingAsync(Guid id);
}

public class CreateBloodOxygenReadingDto
{
    public DateTime RecordedAt { get; set; }
    public string RecordedAtDebug { get; set; } = string.Empty; // For logging raw input
    public double Percentage { get; set; }
}

public class BloodOxygenReadingDto
{
    public Guid Id { get; set; }
    public DateTime RecordedAt { get; set; }
    public double Percentage { get; set; }
    public DateTime CreatedAt { get; set; }
}

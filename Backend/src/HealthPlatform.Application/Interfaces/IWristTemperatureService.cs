namespace HealthPlatform.Application.Interfaces;

public interface IWristTemperatureService
{
    Task<WristTemperatureReadingDto> CreateReadingAsync(CreateWristTemperatureReadingDto dto);
    Task<IEnumerable<WristTemperatureReadingDto>> GetReadingsAsync(int skip = 0, int take = 50);
    Task<WristTemperatureReadingDto?> GetReadingByIdAsync(Guid id);
    Task DeleteReadingAsync(Guid id);
}

public class CreateWristTemperatureReadingDto
{
    public DateTime RecordedAt { get; set; }
    public double Temperature { get; set; }
}

public class WristTemperatureReadingDto
{
    public Guid Id { get; set; }
    public DateTime RecordedAt { get; set; }
    public double Temperature { get; set; }
    public DateTime CreatedAt { get; set; }
}

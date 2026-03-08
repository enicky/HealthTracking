using System.Text.Json;
using System.Text.Json.Serialization;
using HealthPlatform.Application.Converters;
using HealthPlatform.Domain.Entities;

namespace HealthPlatform.Application.Interfaces;

public interface IEcgService
{
    Task<EcgSessionDto> CreateEcgSessionAsync(CreateEcgSessionDto dto);
    Task<IEnumerable<EcgSessionDto>> GetEcgSessionsAsync(int skip = 0, int take = 50);
    Task<EcgSessionDto?> GetEcgSessionByIdAsync(Guid id);
    Task<bool> DeleteEcgSessionAsync(Guid id);
}

public class CreateEcgSessionDto
{
    [JsonConverter(typeof(UnixTimestampConverter))]
    public DateTime RecordedAt { get; set; }
    public string RecordedAtDebug { get; set; } = string.Empty; // For logging raw input
    public string Classification { get; set; } = string.Empty;
    public int? ClassificationCode { get; set; }
    public int? AverageHeartRate { get; set; }
    public JsonElement Samples { get; set; }
}

public class EcgSessionDto
{
    public Guid Id { get; set; }
    public DateTime RecordedAt { get; set; }
    public string Classification { get; set; } = string.Empty;
    public int? AverageHeartRate { get; set; }
    public JsonElement Samples { get; set; }
    public DateTime CreatedAt { get; set; }
}

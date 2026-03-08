using System.Text.Json;

namespace HealthPlatform.Domain.Entities;

public class EcgSession
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public DateTime RecordedAt { get; set; }
    public string Classification { get; set; } = string.Empty;
    public int? AverageHeartRate { get; set; }
    public JsonDocument Samples { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public User? User { get; set; }
}

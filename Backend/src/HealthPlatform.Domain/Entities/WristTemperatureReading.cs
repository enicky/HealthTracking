namespace HealthPlatform.Domain.Entities;

public class WristTemperatureReading
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public DateTime RecordedAt { get; set; }
    public double Temperature { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public User? User { get; set; }
}

namespace HealthPlatform.Domain.Entities;

public class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<EcgSession> EcgSessions { get; set; } = new List<EcgSession>();
    public ICollection<BloodPressureReading> BloodPressureReadings { get; set; } = new List<BloodPressureReading>();
}

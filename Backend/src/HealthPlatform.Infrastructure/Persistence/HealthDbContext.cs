using HealthPlatform.Domain.Entities;
using HealthPlatform.Infrastructure.Persistence.Configurations;
using Microsoft.EntityFrameworkCore;

namespace HealthPlatform.Infrastructure.Persistence;

public class HealthDbContext : DbContext
{
    public HealthDbContext(DbContextOptions<HealthDbContext> options) : base(options)
    {
    }

    public DbSet<Tenant> Tenants { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<EcgSession> EcgSessions { get; set; } = null!;
    public DbSet<BloodPressureReading> BloodPressureReadings { get; set; } = null!;
    public DbSet<BloodOxygenReading> BloodOxygenReadings { get; set; } = null!;
    public DbSet<WristTemperatureReading> WristTemperatureReadings { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations
        modelBuilder.ApplyConfiguration(new TenantConfiguration());
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new EcgSessionConfiguration());
        modelBuilder.ApplyConfiguration(new BloodPressureReadingConfiguration());
        modelBuilder.ApplyConfiguration(new BloodOxygenReadingConfiguration());
        modelBuilder.ApplyConfiguration(new WristTemperatureReadingConfiguration());

        // Set string length for all string properties to 255 by default (unless overridden in configurations)
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(string))
                {
                    if (property.GetMaxLength() == null)
                    {
                        property.SetMaxLength(255);
                    }
                }
            }
        }
    }
}

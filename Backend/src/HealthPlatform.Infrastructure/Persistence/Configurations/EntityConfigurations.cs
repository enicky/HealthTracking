using HealthPlatform.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HealthPlatform.Infrastructure.Persistence.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id)
            .ValueGeneratedNever();

        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(t => t.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(t => t.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Relationships
        builder.HasMany(t => t.Users)
            .WithOne(u => u.Tenant)
            .HasForeignKey(u => u.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.EcgSessions)
            .WithOne(e => e.Tenant)
            .HasForeignKey(e => e.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.BloodPressureReadings)
            .WithOne(b => b.Tenant)
            .HasForeignKey(b => b.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.BloodOxygenReadings)
            .WithOne(bo => bo.Tenant)
            .HasForeignKey(bo => bo.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.WristTemperatureReadings)
            .WithOne(wt => wt.Tenant)
            .HasForeignKey(wt => wt.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(t => t.Name)
            .IsUnique();
    }
}

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Id)
            .ValueGeneratedNever();

        builder.Property(u => u.TenantId)
            .IsRequired();

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(u => u.FirstName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(u => u.LastName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(u => u.Role)
            .IsRequired()
            .HasDefaultValue(UserRole.User)
            .HasSentinel(UserRole.User);

        builder.Property(u => u.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(u => u.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Relationships
        builder.HasOne(u => u.Tenant)
            .WithMany(t => t.Users)
            .HasForeignKey(u => u.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.EcgSessions)
            .WithOne(e => e.User)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.BloodPressureReadings)
            .WithOne(b => b.User)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.BloodOxygenReadings)
            .WithOne(bo => bo.User)
            .HasForeignKey(bo => bo.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.WristTemperatureReadings)
            .WithOne(wt => wt.User)
            .HasForeignKey(wt => wt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(u => new { u.TenantId, u.Email })
            .IsUnique();

        builder.HasIndex(u => u.DeletedAt)
            .HasFilter("\"DeletedAt\" IS NULL");
    }
}

public class EcgSessionConfiguration : IEntityTypeConfiguration<EcgSession>
{
    public void Configure(EntityTypeBuilder<EcgSession> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .ValueGeneratedNever();

        builder.Property(e => e.TenantId)
            .IsRequired();

        builder.Property(e => e.UserId)
            .IsRequired();

        builder.Property(e => e.RecordedAt)
            .IsRequired();

        builder.Property(e => e.Classification)
            .HasMaxLength(50);

        builder.Property(e => e.Samples)
            .HasColumnType("jsonb");

        builder.Property(e => e.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(e => e.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Relationships
        builder.HasOne(e => e.Tenant)
            .WithMany(t => t.EcgSessions)
            .HasForeignKey(e => e.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.User)
            .WithMany(u => u.EcgSessions)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(e => new { e.TenantId, e.UserId, e.RecordedAt })
            .HasDatabaseName("idx_ecg_tenant_user_time")
            .IsDescending(false, false, true);

        builder.HasIndex(e => e.DeletedAt)
            .HasFilter("\"DeletedAt\" IS NULL");
    }
}

public class BloodPressureReadingConfiguration : IEntityTypeConfiguration<BloodPressureReading>
{
    public void Configure(EntityTypeBuilder<BloodPressureReading> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id)
            .ValueGeneratedNever();

        builder.Property(b => b.TenantId)
            .IsRequired();

        builder.Property(b => b.UserId)
            .IsRequired();

        builder.Property(b => b.RecordedAt)
            .IsRequired();

        builder.Property(b => b.Systolic)
            .IsRequired();

        builder.Property(b => b.Diastolic)
            .IsRequired();

        builder.Property(b => b.Pulse)
            .IsRequired();

        builder.Property(b => b.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(b => b.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Relationships
        builder.HasOne(b => b.Tenant)
            .WithMany(t => t.BloodPressureReadings)
            .HasForeignKey(b => b.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(b => b.User)
            .WithMany(u => u.BloodPressureReadings)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(b => new { b.TenantId, b.UserId, b.RecordedAt })
            .HasDatabaseName("idx_bp_tenant_user_time")
            .IsDescending(false, false, true);

        builder.HasIndex(b => b.DeletedAt)
            .HasFilter("\"DeletedAt\" IS NULL");
    }
}

public class BloodOxygenReadingConfiguration : IEntityTypeConfiguration<BloodOxygenReading>
{
    public void Configure(EntityTypeBuilder<BloodOxygenReading> builder)
    {
        builder.HasKey(bo => bo.Id);

        builder.Property(bo => bo.Id)
            .ValueGeneratedNever();

        builder.Property(bo => bo.TenantId)
            .IsRequired();

        builder.Property(bo => bo.UserId)
            .IsRequired();

        builder.Property(bo => bo.RecordedAt)
            .IsRequired();

        builder.Property(bo => bo.Percentage)
            .IsRequired()
            .HasPrecision(5, 2);

        builder.Property(bo => bo.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(bo => bo.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Relationships
        builder.HasOne(bo => bo.Tenant)
            .WithMany(t => t.BloodOxygenReadings)
            .HasForeignKey(bo => bo.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(bo => bo.User)
            .WithMany(u => u.BloodOxygenReadings)
            .HasForeignKey(bo => bo.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(bo => new { bo.TenantId, bo.UserId, bo.RecordedAt })
            .HasDatabaseName("idx_bo_tenant_user_time")
            .IsDescending(false, false, true);

        builder.HasIndex(bo => bo.DeletedAt)
            .HasFilter("\"DeletedAt\" IS NULL");
    }
}

public class WristTemperatureReadingConfiguration : IEntityTypeConfiguration<WristTemperatureReading>
{
    public void Configure(EntityTypeBuilder<WristTemperatureReading> builder)
    {
        builder.HasKey(wt => wt.Id);

        builder.Property(wt => wt.Id)
            .ValueGeneratedNever();

        builder.Property(wt => wt.TenantId)
            .IsRequired();

        builder.Property(wt => wt.UserId)
            .IsRequired();

        builder.Property(wt => wt.RecordedAt)
            .IsRequired();

        builder.Property(wt => wt.Temperature)
            .IsRequired()
            .HasPrecision(5, 2);

        builder.Property(wt => wt.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(wt => wt.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Relationships
        builder.HasOne(wt => wt.Tenant)
            .WithMany(t => t.WristTemperatureReadings)
            .HasForeignKey(wt => wt.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(wt => wt.User)
            .WithMany(u => u.WristTemperatureReadings)
            .HasForeignKey(wt => wt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(wt => new { wt.TenantId, wt.UserId, wt.RecordedAt })
            .HasDatabaseName("idx_wt_tenant_user_time")
            .IsDescending(false, false, true);

        builder.HasIndex(wt => wt.DeletedAt)
            .HasFilter("\"DeletedAt\" IS NULL");
    }
}

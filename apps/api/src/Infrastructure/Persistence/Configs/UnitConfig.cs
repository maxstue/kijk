using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>
/// Configures unit persistence.
/// </summary>
public sealed class UnitConfig : IEntityTypeConfiguration<Unit>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<Unit> builder)
    {
        builder.HasKey(unit => unit.Id);
        builder.Property(unit => unit.Name).HasMaxLength(50);
        builder.Property(unit => unit.Symbol).HasMaxLength(20);
        builder.Property(unit => unit.QuantityKey).HasMaxLength(100);
        builder.Property(unit => unit.UnitsNetUnitName).HasMaxLength(100);
        builder.Property(unit => unit.ConversionType).HasConversion<string>().HasMaxLength(16);
        builder.Property(unit => unit.ConversionFactor).HasPrecision(28, 12);

        builder.Property<string>("NormalizedName")
            .HasMaxLength(50)
            .HasComputedColumnSql("lower(btrim(name))", stored: true);

        builder.HasIndex("QuantityKey", "UnitsNetUnitName")
            .IsUnique()
            .HasFilter("creator_type = 'system'");
        builder.HasIndex("OwnerUserId", "NormalizedName")
            .IsUnique()
            .HasFilter("creator_type = 'user' AND archived_at IS NULL");

        builder.HasOne(unit => unit.ReferenceUnit)
            .WithMany()
            .HasForeignKey(unit => unit.ReferenceUnitId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(unit => unit.OwnerUser)
            .WithMany(user => user.Units)
            .HasForeignKey(unit => unit.OwnerUserId)
            .OnDelete(DeleteBehavior.SetNull);

        var createdAt = new DateTime(2026, 9, 22, 0, 0, 0, DateTimeKind.Utc);
        builder.HasData(
            SystemUnit(new("11111111-1111-4111-8111-111111111111"), "Liter", "l", "Volume", "Liter", createdAt),
            SystemUnit(new("11111111-1111-4111-8111-111111111112"), "Milliliter", "ml", "Volume", "Milliliter", createdAt),
            SystemUnit(new("11111111-1111-4111-8111-111111111113"), "Cubic meter", "m³", "Volume", "CubicMeter", createdAt),
            SystemUnit(new("22222222-2222-4222-8222-222222222221"), "Watt hour", "Wh", "Energy", "WattHour", createdAt),
            SystemUnit(new("22222222-2222-4222-8222-222222222222"), "Kilowatt hour", "kWh", "Energy", "KilowattHour", createdAt),
            SystemUnit(new("22222222-2222-4222-8222-222222222223"), "Megawatt hour", "MWh", "Energy", "MegawattHour", createdAt),
            SystemUnit(new("33333333-3333-4333-8333-333333333331"), "Gram", "g", "Mass", "Gram", createdAt),
            SystemUnit(new("33333333-3333-4333-8333-333333333332"), "Kilogram", "kg", "Mass", "Kilogram", createdAt),
            SystemUnit(new("33333333-3333-4333-8333-333333333333"), "Tonne", "t", "Mass", "Tonne", createdAt));
    }

    private static Unit SystemUnit(
        Guid id,
        string name,
        string symbol,
        string quantityKey,
        string unitsNetUnitName,
        DateTime createdAt) => new()
        {
            Id = id,
            Name = name,
            Symbol = symbol,
            CreatorType = CreatorType.System,
            ConversionType = UnitConversionType.UnitsNet,
            QuantityKey = quantityKey,
            UnitsNetUnitName = unitsNetUnitName,
            CreatedAt = createdAt
        };
}
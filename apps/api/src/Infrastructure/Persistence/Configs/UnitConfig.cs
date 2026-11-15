using Kijk.Domain.Entities;
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
        builder.ToTable(table => table.HasCheckConstraint("ck_units_name_trimmed", "name = btrim(name)"));
        builder.HasKey(unit => unit.Id);
        builder.Property(unit => unit.Name).HasMaxLength(50).UseCollation(AppDbContext.CaseInsensitiveCollation);
        builder.Property(unit => unit.Symbol).HasMaxLength(20).UseCollation(AppDbContext.CaseInsensitiveCollation);
        builder.Property(unit => unit.QuantityKey).HasMaxLength(100);
        builder.Property(unit => unit.UnitsNetUnitName).HasMaxLength(100);

        // The consumption import identifies units by symbol regardless of case.
        builder.HasIndex(unit => unit.Symbol).IsUnique();
        builder.HasIndex(unit => unit.Name).IsUnique();

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
            SystemUnit(new("33333333-3333-4333-8333-333333333333"), "Tonne", "t", "Mass", "Tonne", createdAt),
            SystemUnit(new("44444444-4444-4444-8444-444444444441"), "Meter", "m", "Length", "Meter", createdAt),
            SystemUnit(new("44444444-4444-4444-8444-444444444442"), "Kilometer", "km", "Length", "Kilometer", createdAt),
            SystemUnit(new("55555555-5555-4555-8555-555555555551"), "Piece", "pcs", "Count", null, createdAt));
    }

    private static Unit SystemUnit(
        Guid id,
        string name,
        string symbol,
        string quantityKey,
        string? unitsNetUnitName,
        DateTime createdAt) => new()
        {
            Id = id,
            Name = name,
            Symbol = symbol,
            QuantityKey = quantityKey,
            UnitsNetUnitName = unitsNetUnitName,
            CreatedAt = createdAt
        };
}
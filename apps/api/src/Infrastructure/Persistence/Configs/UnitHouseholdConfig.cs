using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>
/// Configures household unit sharing.
/// </summary>
public sealed class UnitHouseholdConfig : IEntityTypeConfiguration<UnitHousehold>
{
    public void Configure(EntityTypeBuilder<UnitHousehold> builder)
    {
        builder.HasKey(link => new { link.UnitId, link.HouseholdId });
        builder.HasOne(link => link.Unit)
            .WithMany(unit => unit.Households)
            .HasForeignKey(link => link.UnitId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(link => link.Household)
            .WithMany(household => household.UnitHouseholds)
            .HasForeignKey(link => link.HouseholdId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(link => link.SharedByUser)
            .WithMany()
            .HasForeignKey(link => link.SharedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

public class ResourceConfig : IEntityTypeConfiguration<Resource>
{
    public void Configure(EntityTypeBuilder<Resource> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name);
        builder.Property(x => x.Name).HasMaxLength(30);
        builder.Property(x => x.Unit).HasMaxLength(10);
        builder.Property(x => x.Color).HasMaxLength(7);

        builder.Property(x => x.Color).HasDefaultValue(AppConstants.Colors.Default);

        builder.Property<string>("NormalizedName")
            .HasMaxLength(30)
            .HasComputedColumnSql("lower(btrim(name))", stored: true);
        builder.Property<string>("NormalizedUnit")
            .HasMaxLength(10)
            .HasComputedColumnSql("lower(btrim(unit))", stored: true);

        builder.HasIndex("NormalizedName", "NormalizedUnit")
            .IsUnique()
            .HasFilter("household_id IS NULL");
        builder.HasIndex("HouseholdId", "NormalizedName", "NormalizedUnit")
            .IsUnique()
            .HasFilter("household_id IS NOT NULL");

        builder.HasOne(x => x.Household)
            .WithMany(x => x.Resources)
            .HasForeignKey(x => x.HouseholdId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
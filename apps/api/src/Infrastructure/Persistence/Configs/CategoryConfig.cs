using Kijk.Domain.Catalogs;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="Category" />.</summary>
public class CategoryConfig : IEntityTypeConfiguration<Category>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(50);
        builder.Property(x => x.Color).HasMaxLength(7);
        builder.Property(x => x.Icon).HasMaxLength(50);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.Property<string>("NormalizedName")
            .HasMaxLength(50)
            .HasComputedColumnSql("lower(btrim(name))", stored: true);
        builder.HasIndex("NormalizedName")
            .IsUnique()
            .HasFilter("household_id IS NULL");
        builder.HasIndex("HouseholdId", "NormalizedName")
            .IsUnique()
            .HasFilter("household_id IS NOT NULL");

        builder.HasOne(x => x.Household)
            .WithMany(x => x.Categories)
            .HasForeignKey(x => x.HouseholdId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasData(SystemCategories.All.Select(category => new
        {
            category.Id,
            category.Name,
            category.Icon,
            category.Color,
            category.Kind,
            CreatorType = CreatorType.System,
            SeedData.CreatedAt
        }));
    }
}
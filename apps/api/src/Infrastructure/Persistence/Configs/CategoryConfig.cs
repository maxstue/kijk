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
        builder.ToTable(table => table.HasCheckConstraint("ck_categories_name_trimmed", "name = btrim(name)"));
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(50).UseCollation(AppDbContext.CaseInsensitiveCollation);
        builder.Property(x => x.Color).HasMaxLength(7);
        builder.Property(x => x.Icon).HasMaxLength(50);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.HasIndex(category => category.Name)
            .IsUnique()
            .HasFilter("space_id IS NULL");
        builder.HasIndex(category => new { category.SpaceId, category.Name })
            .IsUnique()
            .HasFilter("space_id IS NOT NULL");

        builder.HasOne(x => x.Space)
            .WithMany(x => x.Categories)
            .HasForeignKey(x => x.SpaceId)
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
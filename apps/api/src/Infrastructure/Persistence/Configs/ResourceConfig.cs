using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="Resource" />.</summary>
public class ResourceConfig : IEntityTypeConfiguration<Resource>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<Resource> builder)
    {
        builder.ToTable(table => table.HasCheckConstraint("ck_resources_name_trimmed", "name = btrim(name)"));
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name);
        builder.Property(x => x.Name).HasMaxLength(30).UseCollation(AppDbContext.CaseInsensitiveCollation);
        builder.Property(x => x.Color).HasMaxLength(7);
        builder.Property(x => x.Icon).HasMaxLength(50);

        builder.Property(x => x.Color).HasDefaultValue(AppConstants.Colors.Default);
        builder.Property(x => x.Icon).HasDefaultValue("circle");

        builder.HasIndex(resource => new { resource.Name, resource.UnitId })
            .IsUnique()
            .HasFilter("space_id IS NULL");
        builder.HasIndex(resource => new { resource.SpaceId, resource.Name, resource.UnitId })
            .IsUnique()
            .HasFilter("space_id IS NOT NULL");

        builder.HasOne(x => x.Unit)
            .WithMany()
            .HasForeignKey(x => x.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Space)
            .WithMany(x => x.Resources)
            .HasForeignKey(x => x.SpaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
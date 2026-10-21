using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="CategoryRule" />.</summary>
public class CategoryRuleConfig : IEntityTypeConfiguration<CategoryRule>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<CategoryRule> builder)
    {
        builder.HasKey(x => x.Id);
        // One rule per key for the space and one per key for each member's private rules.
        builder.HasIndex(x => new { x.SpaceId, x.Scope, x.Key })
            .HasDatabaseName("ix_category_rules_space_id_scope_key")
            .HasFilter("owner_id IS NULL")
            .IsUnique();
        builder.HasIndex(x => new { x.SpaceId, x.OwnerId, x.Scope, x.Key })
            .HasDatabaseName("ix_category_rules_space_id_owner_id_scope_key")
            .HasFilter("owner_id IS NOT NULL")
            .IsUnique();
        builder.Ignore(x => x.Visibility);
        builder.HasOne(x => x.Owner)
            .WithMany()
            .HasForeignKey(x => x.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Property(x => x.Key).HasMaxLength(200);
        builder.Property(x => x.Label).HasMaxLength(200);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Space)
            .WithMany(x => x.CategoryRules)
            .HasForeignKey(x => x.SpaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
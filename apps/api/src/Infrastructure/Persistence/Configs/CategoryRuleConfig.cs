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
        builder.HasIndex(x => new { x.SpaceId, x.Scope, x.Key }).IsUnique();
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
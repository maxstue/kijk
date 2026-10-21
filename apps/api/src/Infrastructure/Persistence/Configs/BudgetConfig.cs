using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="Budget" />.</summary>
public class BudgetConfig : IEntityTypeConfiguration<Budget>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<Budget> builder)
    {
        builder.HasKey(x => x.Id);
        // One version per month and category: once for the space and once per member's private budgets.
        builder.HasIndex(x => new { x.SpaceId, x.CategoryId, x.ValidFrom })
            .HasDatabaseName("ix_budgets_space_id_category_id_valid_from")
            .HasFilter("owner_id IS NULL")
            .IsUnique();
        builder.HasIndex(x => new { x.SpaceId, x.OwnerId, x.CategoryId, x.ValidFrom })
            .HasDatabaseName("ix_budgets_space_id_owner_id_category_id_valid_from")
            .HasFilter("owner_id IS NOT NULL")
            .IsUnique();
        builder.Ignore(x => x.Visibility);
        builder.HasOne(x => x.Owner)
            .WithMany()
            .HasForeignKey(x => x.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Property(x => x.Amount).HasPrecision(18, 2);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.CreatedBy)
            .WithMany()
            .HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Space)
            .WithMany(x => x.Budgets)
            .HasForeignKey(x => x.SpaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
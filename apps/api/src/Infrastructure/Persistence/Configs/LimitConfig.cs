using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="Limit" />.</summary>
public class LimitConfig : IEntityTypeConfiguration<Limit>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<Limit> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name);
        builder.HasIndex(x => new { x.SpaceId, x.ResourceId, x.Period }).IsUnique();
        builder.Property(x => x.Name).HasMaxLength(100);
        builder.Property(x => x.Description).HasMaxLength(250);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.HasOne(x => x.Resource)
            .WithMany()
            .HasForeignKey(x => x.ResourceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.CreatedBy)
            .WithMany()
            .HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>
/// Configures space unit sharing.
/// </summary>
public sealed class UnitSpaceConfig : IEntityTypeConfiguration<UnitSpace>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<UnitSpace> builder)
    {
        builder.HasKey(link => new { link.UnitId, link.SpaceId });
        builder.HasOne(link => link.Unit)
            .WithMany(unit => unit.Spaces)
            .HasForeignKey(link => link.UnitId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(link => link.Space)
            .WithMany(space => space.UnitSpaces)
            .HasForeignKey(link => link.SpaceId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(link => link.SharedByUser)
            .WithMany()
            .HasForeignKey(link => link.SharedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
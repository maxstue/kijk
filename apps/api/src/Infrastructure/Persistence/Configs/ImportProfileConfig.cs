using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="ImportProfile" />.</summary>
public class ImportProfileConfig : IEntityTypeConfiguration<ImportProfile>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<ImportProfile> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.SpaceId, x.HeaderFingerprint, x.Version }).IsUnique();
        builder.Property(x => x.HeaderFingerprint).HasMaxLength(64);
        builder.Property(x => x.Name).HasMaxLength(100);
        builder.Property(x => x.Mapping).HasColumnType("jsonb");

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.HasOne(x => x.Space)
            .WithMany()
            .HasForeignKey(x => x.SpaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
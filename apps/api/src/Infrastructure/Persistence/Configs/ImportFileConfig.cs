using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="ImportFile" />.</summary>
public class ImportFileConfig : IEntityTypeConfiguration<ImportFile>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<ImportFile> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.ImportJobId).IsUnique();
        builder.HasIndex(x => x.ExpiresAt);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.HasOne(x => x.ImportJob)
            .WithMany()
            .HasForeignKey(x => x.ImportJobId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
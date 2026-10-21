using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="ImportCandidate" />.</summary>
public class ImportCandidateConfig : IEntityTypeConfiguration<ImportCandidate>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<ImportCandidate> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.ImportJobId, x.RowNumber });
        builder.Ignore(x => x.IsValid);
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Counterparty).HasMaxLength(200);
        builder.Property(x => x.Purpose).HasMaxLength(500);
        builder.Property(x => x.BookingKey).HasMaxLength(64);
        builder.Property(x => x.CounterpartyKey).HasMaxLength(64);
        builder.Property(x => x.Errors).HasMaxLength(500);

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
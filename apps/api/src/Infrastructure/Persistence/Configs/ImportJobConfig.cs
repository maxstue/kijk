using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="ImportJob" />.</summary>
public class ImportJobConfig : IEntityTypeConfiguration<ImportJob>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<ImportJob> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.HouseholdId, x.CreatedAt });
        builder.HasIndex(x => new { x.AccountId, x.Status });
        builder.Property(x => x.FileName).HasMaxLength(200);
        builder.Property(x => x.Error).HasMaxLength(250);
        builder.Property(x => x.ProposedMapping).HasColumnType("jsonb");
        builder.Property(x => x.Mapping).HasColumnType("jsonb");
        builder.Property(x => x.Version).IsRowVersion();

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.HasOne(x => x.Account)
            .WithMany()
            .HasForeignKey(x => x.AccountId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(x => x.CreatedBy)
            .WithMany()
            .HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Household)
            .WithMany(x => x.ImportJobs)
            .HasForeignKey(x => x.HouseholdId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="Transaction" />.</summary>
public class TransactionConfig : IEntityTypeConfiguration<Transaction>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.HouseholdId, x.BookingDate });
        builder.HasIndex(x => x.CategoryId);
        builder.HasIndex(x => new { x.AccountId, x.BookingDate });
        builder.HasIndex(x => x.CounterpartyKey);
        builder.Property(x => x.BookingKey).HasMaxLength(64);
        builder.Property(x => x.CounterpartyKey).HasMaxLength(64);
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3);
        builder.Property(x => x.Counterparty).HasMaxLength(200);
        builder.Property(x => x.Purpose).HasMaxLength(500);

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

        builder.HasOne(x => x.Account)
            .WithMany()
            .HasForeignKey(x => x.AccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ImportJob)
            .WithMany()
            .HasForeignKey(x => x.ImportJobId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.CreatedBy)
            .WithMany()
            .HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Household)
            .WithMany(x => x.Transactions)
            .HasForeignKey(x => x.HouseholdId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
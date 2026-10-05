using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="Account" />.</summary>
public class AccountConfig : IEntityTypeConfiguration<Account>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.HouseholdId);
        builder.Property(x => x.Name).HasMaxLength(100);
        builder.Property(x => x.IbanLast4).HasMaxLength(4);
        // Every household has exactly one cash account.
        builder.HasIndex(x => x.HouseholdId, "ix_accounts_household_id_cash")
            .HasDatabaseName("ix_accounts_household_id_cash")
            .HasFilter($"kind = {(int)AccountKind.Cash}")
            .IsUnique();

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.Ignore(x => x.Visibility);
        builder.HasOne(x => x.Owner)
            .WithMany()
            .HasForeignKey(x => x.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Household)
            .WithMany(x => x.Accounts)
            .HasForeignKey(x => x.HouseholdId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
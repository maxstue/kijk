using Kijk.Api.Domain.Entities;

using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Api.Persistence.Configs;

public class RecurringTransactionConfig : IEntityTypeConfiguration<RecurringTransactions>
{
    public void Configure(EntityTypeBuilder<RecurringTransactions> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name);
        builder.Property(x => x.Name).HasMaxLength(100);
        builder.Property(x => x.Description).HasMaxLength(250);

        // builder.Property(x => x.Frequency).HasConversion<string>();

        builder.HasOne(x => x.LastTransaction)
            .WithOne()
            .HasForeignKey<Transaction>(x => x.RecurringTransactionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
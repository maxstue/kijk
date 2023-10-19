using Kijk.Api.Domain.Entities;

using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Api.Persistence.Configs;

public class TransactionConfig : IEntityTypeConfiguration<Transaction>
{

    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable(nameof(Transaction).ToLower());
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Type).HasConversion<string>();
        
        builder.HasOne(v => v.Category).WithMany(c => c.Transactions);

    }
}

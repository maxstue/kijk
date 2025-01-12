using Kijk.Api.Domain.Entities;

using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Api.Persistence.Configs;

public class BudgetConfig : IEntityTypeConfiguration<Budget>
{
    public void Configure(EntityTypeBuilder<Budget> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name);

        builder.Property(x => x.Name).HasMaxLength(100);
    }
}
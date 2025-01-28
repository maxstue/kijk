using Kijk.Api.Domain.Entities;

using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Api.Persistence.Configs;

public class EnergyConsumptionConfig : IEntityTypeConfiguration<Energy>
{
    public void Configure(EntityTypeBuilder<Energy> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name);

        builder.Property(x => x.Name).HasMaxLength(100);
        builder.Property(x => x.Description).HasMaxLength(250);
    }
}
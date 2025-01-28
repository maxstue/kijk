using Kijk.Api.Domain.Entities;

using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Api.Persistence.Configs;

public class EnergyConsumptionLimitConfig : IEntityTypeConfiguration<EnergyLimit>
{
    public void Configure(EntityTypeBuilder<EnergyLimit> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name);
        builder.Property(x => x.Name).HasMaxLength(100);
        builder.Property(x => x.Description).HasMaxLength(250);

        builder.HasOne(x => x.CreatedBy)
            .WithMany()
            .HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
﻿using Kijk.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Api.Persistence.Configs;

public class EnergyConsumptionConfig : IEntityTypeConfiguration<EnergyConsumption>
{
    public void Configure(EntityTypeBuilder<EnergyConsumption> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name);

        builder.Property(x => x.Name).HasMaxLength(100);
        builder.Property(x => x.Description).HasMaxLength(250);

        builder.Property(x => x.Type).HasConversion<string>();
    }
}

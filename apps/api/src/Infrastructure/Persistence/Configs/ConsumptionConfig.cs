using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="Consumption" />.</summary>
public class ConsumptionConfig : IEntityTypeConfiguration<Consumption>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<Consumption> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name);

        builder.Property(x => x.Name).HasMaxLength(100);
        builder.Property(x => x.Description).HasMaxLength(250);
        builder.Property(x => x.Date);
        builder.Property(x => x.ValueType).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.StartsNewMeterSegment);
        builder.Property(x => x.CalculatedConsumption);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.HasOne(x => x.Resource)
            .WithMany()
            .HasForeignKey(x => x.ResourceId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
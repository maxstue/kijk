using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

public class ConsumptionConfig : IEntityTypeConfiguration<Consumption>
{
    public void Configure(EntityTypeBuilder<Consumption> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name);

        builder.Property(x => x.Name).HasMaxLength(100);
        builder.Property(x => x.Description).HasMaxLength(250);
        builder.ComplexProperty(x => x.Date, x => x.Property(m => m.Value).HasColumnName("date"));

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.HasOne(x => x.Resource)
            .WithMany()
            .HasForeignKey(x => x.ResourceId);
    }
}
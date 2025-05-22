using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

public class ResourceConfig : IEntityTypeConfiguration<Resource>
{
    public void Configure(EntityTypeBuilder<Resource> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name);
        builder.Property(x => x.Name).HasMaxLength(100);
        builder.Property(x => x.Unit).HasMaxLength(100);
        builder.HasIndex(x => new { x.Name, x.Unit }).IsUnique();

        builder.Property(x => x.Color).HasDefaultValue(AppConstants.Colors.Default);
    }
}
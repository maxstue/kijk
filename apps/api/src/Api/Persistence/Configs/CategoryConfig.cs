using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;

using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Api.Persistence.Configs;

public class CategoryConfig : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(100);
        builder.Property(x => x.Color).HasMaxLength(50);

        builder.Property(x => x.Color).HasDefaultValue(AppConstants.Colors.Default);
    }
}
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Persistence.Configs;

public class WeatherConfig : IEntityTypeConfiguration<Weather>
{
    public void Configure(EntityTypeBuilder<Weather> builder)
    {
        builder.ToTable(nameof(Weather).ToLower());
        builder.HasKey(x => x.Id);
    }
}

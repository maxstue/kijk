using Kijk.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Api.Persistence.Configs;

public class UserHouseholdConfig : IEntityTypeConfiguration<UserHousehold>
{
    public void Configure(EntityTypeBuilder<UserHousehold> builder)
    {
        builder.HasKey(x => new { x.UserId, x.HouseholdId });
        builder.HasIndex(x => x.IsDefault);
        builder.Property(x => x.Role).HasConversion<string>();

        builder.HasOne(x => x.User)
            .WithMany(x => x.UserHouseholds)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

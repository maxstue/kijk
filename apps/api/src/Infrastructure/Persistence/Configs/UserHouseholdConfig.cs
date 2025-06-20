using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

public class UserHouseholdConfig : IEntityTypeConfiguration<UserHousehold>
{
    public void Configure(EntityTypeBuilder<UserHousehold> builder)
    {
        builder.HasKey(x => new { x.UserId, x.HouseholdId });
        builder.HasIndex(x => x.IsActive);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.HasOne(x => x.User)
            .WithMany(x => x.UserHouseholds)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.UserHouseHoldExtraPermissions)
            .WithMany(x => x.UserHouseholds)
            .UsingEntity("user_households_permissions");
    }
}
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="Role" />.</summary>
public class RoleConfig : IEntityTypeConfiguration<Role>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name).IsUnique();

        builder.Property(x => x.Name).HasMaxLength(100);

        builder.HasMany(x => x.Permissions)
            .WithMany(c => c.Roles)
            .UsingEntity("roles_permissions", join => join.HasData(
                HouseholdRoles.All.SelectMany(role => role.Permissions.Select(permission => new
                {
                    RolesId = role.Id,
                    PermissionsId = HouseholdPermissions.All.Single(item => item.Name == permission).Id
                }))));

        builder.HasMany(x => x.UserHouseholds)
            .WithOne(x => x.Role)
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasData(HouseholdRoles.All.Select(role => new
        {
            role.Id,
            role.Name,
            SeedData.CreatedAt
        }));
    }
}
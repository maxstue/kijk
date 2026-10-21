using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="Permission" />.</summary>
public class PermissionConfig : IEntityTypeConfiguration<Permission>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name).IsUnique();

        builder.Property(x => x.Name).HasMaxLength(100);

        builder.HasData(SpacePermissions.All.Select(permission => new
        {
            permission.Id,
            permission.Name,
            SeedData.CreatedAt
        }));
    }
}
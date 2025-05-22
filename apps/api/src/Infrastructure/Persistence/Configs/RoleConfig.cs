using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

public class RoleConfig : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name);

        builder.Property(x => x.Name).HasMaxLength(100);

        builder.HasMany(x => x.Permissions)
            .WithMany(c => c.Roles)
            .UsingEntity("roles_permissions");

        builder.HasMany(x => x.UserHouseholds)
            .WithOne(x => x.Role)
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
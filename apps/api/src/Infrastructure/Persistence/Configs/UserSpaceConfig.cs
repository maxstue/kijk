using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="UserSpace" />.</summary>
public class UserSpaceConfig : IEntityTypeConfiguration<UserSpace>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<UserSpace> builder)
    {
        builder.HasKey(x => new { x.UserId, x.SpaceId });
        builder.HasIndex(x => x.IsActive);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.HasOne(x => x.User)
            .WithMany(x => x.UserSpaces)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kijk.Infrastructure.Persistence.Configs;

/// <summary>EF Core mapping of <see cref="SpaceInvitation" />.</summary>
public class SpaceInvitationConfig : IEntityTypeConfiguration<SpaceInvitation>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<SpaceInvitation> builder)
    {
        builder.HasKey(x => x.Id);
        // Accepting looks an invitation up by the hash of its token.
        builder.HasIndex(x => x.TokenHash).IsUnique();
        builder.HasIndex(x => x.SpaceId);

        builder.Property(x => x.TokenHash).HasMaxLength(32);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()")
            .ValueGeneratedOnAdd();

        builder.Property(m => m.UpdatedAt)
            .ValueGeneratedOnUpdate();

        builder.HasOne(x => x.Space)
            .WithMany()
            .HasForeignKey(x => x.SpaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Role)
            .WithMany()
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.CreatedBy)
            .WithMany()
            .HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.AcceptedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
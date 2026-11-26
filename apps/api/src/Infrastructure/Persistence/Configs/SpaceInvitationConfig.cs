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
        builder.HasIndex(x => x.SpaceId);
        // At most one open invitation per person and space. Expiry cannot be part of an index predicate; creating an
        // invitation therefore revokes an expired one for the same person first.
        builder.HasIndex(x => new { x.SpaceId, x.InviteeAuthId })
            .IsUnique()
            .HasFilter("invitee_auth_id IS NOT NULL AND accepted_at IS NULL AND declined_at IS NULL AND revoked_at IS NULL");
        // The inbox lists the invitations of one person.
        builder.HasIndex(x => x.InviteeAuthId);

        builder.Property(x => x.InviteeAuthId).HasMaxLength(255);
        builder.Property(x => x.ProviderInvitationId).HasMaxLength(255);
        builder.Property(x => x.InviteeLabel).HasMaxLength(SpaceInvitation.InviteeLabelMaxLength);

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
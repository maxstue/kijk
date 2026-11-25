using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Shared;

namespace Kijk.Application.Spaces.PreviewInvitation;

/// <summary>
/// Shows a signed-in person what an invitation offers.
/// </summary>
public sealed class PreviewInvitationHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>
    /// Describes a pending invitation. Anyone with the link may call it, signed in or not; it reveals only what the
    /// invitation page needs and never the space's members or data.
    /// </summary>
    /// <param name="request">The invitation token.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The invitation, or the same not-found error for every token that cannot be accepted.</returns>
    public async Task<Result<InvitationPreviewResponse>> HandleAsync(InvitationTokenRequest request, CancellationToken cancellationToken)
    {
        if (!InvitationToken.TryHash(request.Token, out var hash))
        {
            return InvitationLookup.Invalid;
        }

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var invitation = await dbContext.SpaceInvitations
            .AsNoTracking()
            .Where(item => item.TokenHash == hash && item.AcceptedAt == null && item.RevokedAt == null && item.ExpiresAt > utcNow)
            .Select(item => new
            {
                item.SpaceId,
                SpaceName = item.Space.Name,
                item.RoleId,
                RoleName = item.Role.Name,
                InvitedByName = item.CreatedBy.Name,
                item.ExpiresAt
            })
            .SingleOrDefaultAsync(cancellationToken);
        if (invitation is null)
        {
            return InvitationLookup.Invalid;
        }

        // Anonymous callers and people without a Kijk account yet cannot be members.
        var isMember = currentUser.User is { } user && await dbContext.UserSpaces
            .AnyAsync(link => link.UserId == user.Id && link.SpaceId == invitation.SpaceId, cancellationToken);

        return new InvitationPreviewResponse(
            invitation.SpaceName,
            invitation.RoleId,
            invitation.RoleName,
            invitation.InvitedByName,
            invitation.ExpiresAt,
            isMember ? invitation.SpaceId : null);
    }
}
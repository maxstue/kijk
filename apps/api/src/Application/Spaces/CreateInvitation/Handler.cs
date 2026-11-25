using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Spaces.CreateInvitation;

/// <summary>
/// Creates a single-use invitation link for a shared space.
/// </summary>
public sealed class CreateInvitationHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>
    /// Creates an invitation when the current user's role allows inviting. Personal spaces are never shared.
    /// </summary>
    /// <param name="spaceId">The space identifier.</param>
    /// <param name="request">The role of the invitation.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The invitation with its token, which is not stored and cannot be retrieved again.</returns>
    public async Task<Result<CreateSpaceInvitationResponse>> HandleAsync(
        Guid spaceId,
        CreateSpaceInvitationRequest request,
        CancellationToken cancellationToken)
    {
        if (await dbContext.AuthorizeSpaceAsync(currentUser.Id, spaceId, SpacePermissions.Members.Invite, cancellationToken) is { } error)
        {
            return error;
        }

        var space = await dbContext.Spaces.SingleAsync(item => item.Id == spaceId, cancellationToken);
        if (space.IsPersonal)
        {
            return Error.Conflict("A personal space cannot be shared");
        }

        var roleId = request.RoleId ?? SpaceRoles.Member.Id;
        var role = await dbContext.Roles.SingleAsync(item => item.Id == roleId, cancellationToken);
        var creator = await dbContext.Users.SingleAsync(item => item.Id == currentUser.Id, cancellationToken);

        var (token, hash) = InvitationToken.Create();
        var invitation = SpaceInvitation.Create(space, role, creator, hash, timeProvider.GetUtcNow().UtcDateTime);
        dbContext.SpaceInvitations.Add(invitation);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new CreateSpaceInvitationResponse(invitation.Id, token, InvitationToken.Link(token), role.Id, invitation.ExpiresAt);
    }
}
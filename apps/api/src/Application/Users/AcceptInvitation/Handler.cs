using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Users.AcceptInvitation;

/// <summary>
/// Accepts an invitation of the current user and makes them a member of the space.
/// </summary>
public sealed class AcceptInvitationHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>
    /// Joins the space with the invited role. Accepting is idempotent: a user who already belongs to the space gets
    /// it back, and the invitation stays as it is.
    /// </summary>
    /// <param name="invitationId">The invitation identifier.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The space, or 404 for an invitation of another person or one that can no longer be accepted.</returns>
    public async Task<Result<AcceptInvitationResponse>> HandleAsync(Guid invitationId, CancellationToken cancellationToken)
    {
        var authId = currentUser.AuthId;
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        // Parallel acceptances wait for each other, so exactly one creates the membership.
        var invitation = await dbContext.SpaceInvitations
            .FromSqlInterpolated($"SELECT * FROM space_invitations WHERE id = {invitationId} AND invitee_auth_id = {authId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);
        if (invitation is null)
        {
            return Error.NotFound("Invitation could not be found");
        }

        var response = new AcceptInvitationResponse(invitation.SpaceId);
        if (await dbContext.UserSpaces.AnyAsync(link => link.SpaceId == invitation.SpaceId && link.UserId == currentUser.Id, cancellationToken))
        {
            return response;
        }

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        if (!invitation.IsPending(utcNow))
        {
            return Error.NotFound("Invitation could not be found");
        }

        var user = await dbContext.Users.SingleAsync(item => item.Id == currentUser.Id, cancellationToken);
        var space = await dbContext.Spaces.SingleAsync(item => item.Id == invitation.SpaceId, cancellationToken);
        var role = await dbContext.Roles.SingleAsync(item => item.Id == invitation.RoleId, cancellationToken);
        dbContext.UserSpaces.Add(UserSpace.Create(user, space, role));
        invitation.Accept(user.Id, utcNow);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return response;
    }
}
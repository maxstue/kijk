using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Shared;

namespace Kijk.Application.Spaces.AcceptInvitation;

/// <summary>
/// Lets a user with a completed onboarding join a shared space through an invitation.
/// </summary>
public sealed class AcceptInvitationHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    /// <summary>
    /// Adds the current user to the invitation's space with the invited role and uses up the invitation.
    /// Members get a conflict and the invitation stays usable for someone else.
    /// </summary>
    /// <param name="request">The invitation token.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The joined space, or the same not-found error for every token that cannot be accepted.</returns>
    public async Task<Result<AcceptInvitationResponse>> HandleAsync(InvitationTokenRequest request, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var invitation = await dbContext.LockInvitationAsync(request.Token, cancellationToken);
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        if (invitation is null || !invitation.IsPending(utcNow))
        {
            return InvitationLookup.Invalid;
        }

        // Serializes joins of this user, so two invitations to the same space cannot both add a membership.
        var user = await dbContext.Users
            .FromSqlInterpolated($"SELECT * FROM users WHERE id = {currentUser.Id} FOR UPDATE")
            .SingleAsync(cancellationToken);
        if (await dbContext.UserSpaces.AnyAsync(link => link.UserId == user.Id && link.SpaceId == invitation.SpaceId, cancellationToken))
        {
            return Error.Conflict("You are already a member of this space");
        }

        dbContext.UserSpaces.Add(invitation.AcceptFor(user, utcNow));
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new AcceptInvitationResponse(invitation.SpaceId, invitation.Space.Name, invitation.RoleId);
    }
}
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Shared;

namespace Kijk.Application.Spaces.AcceptInvitation;

/// <summary>
/// Lets a user with a completed onboarding join a shared space through an invitation.
/// </summary>
public sealed class AcceptInvitationHandler(IAppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider)
{
    private static Error AlreadyMember => Error.Conflict("You are already a member of this space");

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

        if (await IsMemberAsync(invitation.SpaceId, cancellationToken))
        {
            return AlreadyMember;
        }

        var user = await dbContext.Users.SingleAsync(item => item.Id == currentUser.Id, cancellationToken);
        dbContext.UserSpaces.Add(invitation.AcceptFor(user, utcNow));
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // The membership key rejects a second join through another invitation to the same space at the same time.
            await transaction.RollbackAsync(cancellationToken);
            if (!await IsMemberAsync(invitation.SpaceId, cancellationToken))
            {
                throw;
            }

            return AlreadyMember;
        }

        return new AcceptInvitationResponse(invitation.SpaceId, invitation.Space.Name, invitation.RoleId);
    }

    private Task<bool> IsMemberAsync(Guid spaceId, CancellationToken cancellationToken) =>
        dbContext.UserSpaces.AsNoTracking().AnyAsync(link => link.UserId == currentUser.Id && link.SpaceId == spaceId, cancellationToken);
}
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Spaces.Shared;

/// <summary>
/// Finds invitations by their token for the people who received them.
/// </summary>
public static class InvitationLookup
{
    /// <summary>
    /// The answer for unknown, expired, revoked and used tokens alike, so their state cannot be guessed.
    /// </summary>
    public static Error Invalid => Error.NotFound("This invitation is invalid or has expired. Ask for a new link.");

    /// <summary>
    /// Loads the invitation of a token with its space and role and locks it until the transaction ends, so it is
    /// accepted at most once. Callers check <see cref="SpaceInvitation.IsPending" /> themselves.
    /// </summary>
    /// <param name="dbContext">The database context with an open transaction.</param>
    /// <param name="token">The token from the request body.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The invitation, or <see langword="null" /> when no invitation has this token.</returns>
    public static async Task<SpaceInvitation?> LockInvitationAsync(this IAppDbContext dbContext, string token, CancellationToken cancellationToken)
    {
        if (!InvitationToken.TryHash(token, out var hash))
        {
            return null;
        }

        var invitation = await dbContext.SpaceInvitations
            .FromSqlInterpolated($"SELECT * FROM space_invitations WHERE token_hash = {hash} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);
        if (invitation is null)
        {
            return null;
        }

        // Tracking the space and role fills the invitation's navigations.
        await dbContext.Spaces.Where(space => space.Id == invitation.SpaceId).LoadAsync(cancellationToken);
        await dbContext.Roles.Where(role => role.Id == invitation.RoleId).LoadAsync(cancellationToken);
        return invitation;
    }
}
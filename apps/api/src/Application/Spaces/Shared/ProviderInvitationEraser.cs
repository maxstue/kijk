using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;

namespace Kijk.Application.Spaces.Shared;

/// <summary>
/// Deletes the authentication provider's invitations, and with them the e-mail addresses they hold, and clears
/// <see cref="SpaceInvitation.ProviderInvitationId" />. Each invitation is cleared right after its deletion, so a
/// failure keeps the progress and a retry continues with the rest.
/// </summary>
public sealed class ProviderInvitationEraser(IAppDbContext dbContext, IIdentityInvitations identityInvitations)
{
    /// <summary>Deletes the provider invitations of the given invitations.</summary>
    /// <param name="invitations">The invitations whose provider invitations are no longer needed.</param>
    /// <param name="limit">The maximum number of provider invitations to delete in this call.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>The number of deleted provider invitations.</returns>
    public async Task<int> EraseAsync(IQueryable<SpaceInvitation> invitations, int limit, CancellationToken cancellationToken)
    {
        var pending = await invitations
            .Where(item => item.ProviderInvitationId != null)
            .OrderBy(item => item.CreatedAt)
            .Select(item => new { item.Id, ProviderInvitationId = item.ProviderInvitationId! })
            .Take(limit)
            .ToListAsync(cancellationToken);

        foreach (var invitation in pending)
        {
            await identityInvitations.DeleteInvitationAsync(invitation.ProviderInvitationId, cancellationToken);
            await dbContext.SpaceInvitations
                .Where(item => item.Id == invitation.Id)
                .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.ProviderInvitationId, (string?)null), cancellationToken);
        }

        return pending.Count;
    }
}
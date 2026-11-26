using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Spaces.CleanupInvitations;

/// <summary>
/// Deletes the authentication provider's invitations, and with them the invited e-mail addresses, as soon as they are
/// no longer needed: once the invitation is linked to a new account, accepted, declined, revoked or expired. Then it
/// deletes Kijk's invitations that were closed longer than <see cref="SpaceInvitation.Retention" /> ago.
/// </summary>
public sealed class CleanupInvitationsHandler(
    IAppDbContext dbContext,
    ProviderInvitationEraser providerInvitationEraser,
    TimeProvider timeProvider,
    ILogger<CleanupInvitationsHandler> logger)
{
    /// <summary>Runs the cleanup.</summary>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>The number of deleted invitations in Kijk.</returns>
    public async Task<int> CleanupAsync(CancellationToken cancellationToken)
    {
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var unneeded = dbContext.SpaceInvitations.Where(item =>
            item.InviteeAuthId != null || item.AcceptedAt != null || item.DeclinedAt != null || item.RevokedAt != null || item.ExpiresAt <= utcNow);
        var providerDeleted = await providerInvitationEraser.EraseAsync(unneeded, cancellationToken);

        // An invitation whose provider invitation could not be deleted yet stays, so the next run retries it.
        var cutoff = utcNow - SpaceInvitation.Retention;
        var deleted = await dbContext.SpaceInvitations
            .Where(item => item.ProviderInvitationId == null)
            .Where(item => item.ExpiresAt <= cutoff || item.RevokedAt <= cutoff || item.AcceptedAt <= cutoff || item.DeclinedAt <= cutoff)
            .ExecuteDeleteAsync(cancellationToken);

        if ((deleted > 0 || providerDeleted > 0) && logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation(
                "Invitation cleanup deleted {ProviderInvitations} provider invitations and {Invitations} closed invitations",
                providerDeleted,
                deleted);
        }

        return deleted;
    }
}
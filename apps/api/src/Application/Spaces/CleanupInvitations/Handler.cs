using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Spaces.CleanupInvitations;

/// <summary>
/// Deletes invitations that were expired, revoked or accepted longer than <see cref="SpaceInvitation.Retention" /> ago.
/// </summary>
public sealed class CleanupInvitationsHandler(IAppDbContext dbContext, TimeProvider timeProvider, ILogger<CleanupInvitationsHandler> logger)
{
    /// <summary>Runs the cleanup.</summary>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>The number of deleted invitations.</returns>
    public async Task<int> CleanupAsync(CancellationToken cancellationToken)
    {
        var cutoff = timeProvider.GetUtcNow().UtcDateTime - SpaceInvitation.Retention;
        var deleted = await dbContext.SpaceInvitations
            .Where(item => item.ExpiresAt <= cutoff || item.RevokedAt <= cutoff || item.AcceptedAt <= cutoff)
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted > 0 && logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Invitation cleanup deleted {Invitations} closed invitations", deleted);
        }

        return deleted;
    }
}
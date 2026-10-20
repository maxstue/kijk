using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Jobs;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Application.Users.Delete;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Users.RequestDeletion;

/// <summary>
/// Starts deleting the current user's account and all their data. The deletion itself runs as a durable background
/// job, so a restart neither loses nor repeats half of it.
/// </summary>
public sealed class RequestDeletionHandler(IAppDbContext dbContext, CurrentUser currentUser, IJobQueue queue, TimeProvider timeProvider)
{
    /// <summary>Queues the deletion. Asking again while it runs has no further effect.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" /> when queued, or a not-found error.</returns>
    public async Task<Result<bool>> HandleAsync(CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Id == currentUser.Id, cancellationToken);
        if (user is null)
        {
            return Error.NotFound("User not found");
        }

        if (user.DeletionRequestedAt is not null)
        {
            return true;
        }

        user.RequestDeletion(timeProvider.GetUtcNow().UtcDateTime);
        await queue.SaveChangesAndEnqueueAsync(new DeleteUserAccount(user.Id, user.AuthId), cancellationToken);
        return true;
    }
}
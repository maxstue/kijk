using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Jobs;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Spaces.Shared;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Users.Delete;

/// <summary>Deletes a user's account and all their data in the background.</summary>
/// <param name="UserId">The Kijk user.</param>
/// <param name="AuthId">The authentication provider's user id, kept so a retry can still delete the identity.</param>
public sealed record DeleteUserAccount(Guid UserId, string AuthId);

/// <summary>
/// Starts deleting the current user's account and all their data. The deletion itself runs as a durable background
/// job, so a restart neither loses nor repeats half of it.
/// </summary>
public sealed class RequestAccountDeletionHandler(IAppDbContext dbContext, CurrentUser currentUser, IJobQueue queue, TimeProvider timeProvider) : IHandler
{
    /// <summary>Queues the deletion. Asking again while it runs has no further effect.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" /> when queued, or a not-found error.</returns>
    public async Task<Result<bool>> RequestAsync(CancellationToken cancellationToken)
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

/// <summary>
/// Deletes a user and everything that belongs only to them: their personal space, shared spaces they are the only
/// member of, their private accounts, transactions, imports, budgets and rules, their unused units and their identity
/// at the authentication provider. Shared data they created stays in the space for the other members and is
/// attributed to another member; if no administrator would remain, that member becomes one.
/// </summary>
public sealed class AccountEraser(IAppDbContext dbContext, IIdentityProvider identityProvider, ILogger<AccountEraser> logger) : IHandler
{
    /// <summary>Runs the deletion. It can run again after a failure.</summary>
    /// <param name="message">The user to delete.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the account is gone.</returns>
    public async Task EraseAsync(DeleteUserAccount message, CancellationToken cancellationToken)
    {
        if (await dbContext.Users.AnyAsync(item => item.Id == message.UserId, cancellationToken))
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            await EraseDataAsync(message.UserId, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        // Last, so a failure here retries the job and only this step remains.
        await identityProvider.DeleteAsync(message.AuthId, cancellationToken);
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Deleted account {UserId}", message.UserId);
        }
    }

    private async Task EraseDataAsync(Guid userId, CancellationToken cancellationToken)
    {
        var memberships = await dbContext.UserSpaces
            .Where(link => link.UserId == userId)
            .Select(link => new { link.SpaceId, link.Space.IsPersonal, Members = link.Space.UserSpaces.Count })
            .ToListAsync(cancellationToken);

        foreach (var membership in memberships)
        {
            if (membership.IsPersonal || membership.Members == 1)
            {
                await SpaceDataEraser.EraseAsync(dbContext, membership.SpaceId, cancellationToken);
            }
            else
            {
                await LeaveSharedSpaceAsync(userId, membership.SpaceId, cancellationToken);
            }
        }

        // Units only this user could use; units shared with spaces or used by resources stay without an owner.
        await dbContext.Units
            .Where(unit => unit.OwnerUserId == userId
                           && !unit.Spaces.Any()
                           && !dbContext.Resources.Any(resource => resource.UnitId == unit.Id))
            .ExecuteDeleteAsync(cancellationToken);
        await dbContext.Users.Where(item => item.Id == userId).ExecuteDeleteAsync(cancellationToken);
    }

    private async Task LeaveSharedSpaceAsync(Guid userId, Guid spaceId, CancellationToken cancellationToken)
    {
        // Private data is the user's alone and goes with them.
        var privateAccounts = dbContext.Accounts.Where(item => item.SpaceId == spaceId && item.OwnerId == userId).Select(item => item.Id);
        var privateJobs = dbContext.ImportJobs.Where(item => privateAccounts.Contains(item.AccountId)).Select(item => item.Id);
        await dbContext.Transactions.Where(item => item.AccountId != null && privateAccounts.Contains(item.AccountId.Value)).ExecuteDeleteAsync(cancellationToken);
        await dbContext.ImportCandidates.Where(item => privateJobs.Contains(item.ImportJobId)).ExecuteDeleteAsync(cancellationToken);
        await dbContext.ImportFiles.Where(item => privateJobs.Contains(item.ImportJobId)).ExecuteDeleteAsync(cancellationToken);
        await dbContext.ImportJobs.Where(item => privateAccounts.Contains(item.AccountId)).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Accounts.Where(item => item.SpaceId == spaceId && item.OwnerId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Budgets.Where(item => item.SpaceId == spaceId && item.OwnerId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.CategoryRules.Where(item => item.SpaceId == spaceId && item.OwnerId == userId).ExecuteDeleteAsync(cancellationToken);

        // Shared data stays for the other members and is attributed to one of them, an administrator if possible.
        var others = await dbContext.UserSpaces
            .Where(link => link.SpaceId == spaceId && link.UserId != userId)
            .Select(link => new
            {
                Link = link,
                IsAdmin = link.Role.Permissions.Any(permission => permission.Name == SpacePermissions.Space.Delete)
            })
            .OrderByDescending(item => item.IsAdmin)
            .ThenBy(item => item.Link.CreatedAt)
            .ToListAsync(cancellationToken);
        var successor = others[0];
        if (!successor.IsAdmin)
        {
            var admin = await dbContext.Roles.FirstAsync(role => role.Id == SpaceRoles.Admin.Id, cancellationToken);
            successor.Link.ChangeRole(admin);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var successorId = successor.Link.UserId;
        await dbContext.Transactions.Where(item => item.SpaceId == spaceId && item.CreatedById == userId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.CreatedById, successorId), cancellationToken);
        await dbContext.Budgets.Where(item => item.SpaceId == spaceId && item.CreatedById == userId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.CreatedById, successorId), cancellationToken);
        await dbContext.Limits.Where(item => item.SpaceId == spaceId && item.CreatedById == userId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.CreatedById, successorId), cancellationToken);
        await dbContext.ImportJobs.Where(item => item.SpaceId == spaceId && item.CreatedById == userId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.CreatedById, successorId), cancellationToken);
        await dbContext.UnitSpaces.Where(item => item.SpaceId == spaceId && item.SharedByUserId == userId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.SharedByUserId, successorId), cancellationToken);
        await dbContext.UserSpaces.Where(link => link.SpaceId == spaceId && link.UserId == userId).ExecuteDeleteAsync(cancellationToken);
    }
}
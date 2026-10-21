using Kijk.Application.Shared.Persistence;

namespace Kijk.Application.Spaces.Shared;

/// <summary>
/// Deletes a space with all its data. Dependent rows are deleted explicitly in an order that no restricting foreign
/// key blocks, instead of relying on cascades across tables that restrict each other.
/// </summary>
public static class SpaceDataEraser
{
    /// <summary>Deletes the space and everything in it. Call it inside a transaction.</summary>
    /// <param name="dbContext">The database context.</param>
    /// <param name="spaceId">The space.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the space is deleted.</returns>
    public static async Task EraseAsync(IAppDbContext dbContext, Guid spaceId, CancellationToken cancellationToken)
    {
        await dbContext.Transactions.Where(item => item.SpaceId == spaceId).ExecuteDeleteAsync(cancellationToken);
        var jobIds = dbContext.ImportJobs.Where(item => item.SpaceId == spaceId).Select(item => item.Id);
        await dbContext.ImportCandidates.Where(item => jobIds.Contains(item.ImportJobId)).ExecuteDeleteAsync(cancellationToken);
        await dbContext.ImportFiles.Where(item => jobIds.Contains(item.ImportJobId)).ExecuteDeleteAsync(cancellationToken);
        await dbContext.ImportJobs.Where(item => item.SpaceId == spaceId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.ImportProfiles.Where(item => item.SpaceId == spaceId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Budgets.Where(item => item.SpaceId == spaceId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.CategoryRules.Where(item => item.SpaceId == spaceId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Accounts.Where(item => item.SpaceId == spaceId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Categories.Where(item => item.SpaceId == spaceId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Consumptions.Where(item => item.SpaceId == spaceId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Limits.Where(item => item.SpaceId == spaceId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Resources.Where(item => item.SpaceId == spaceId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UnitSpaces.Where(item => item.SpaceId == spaceId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UserSpaces.Where(item => item.SpaceId == spaceId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Spaces.Where(item => item.Id == spaceId).ExecuteDeleteAsync(cancellationToken);
    }
}
using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Budgets.Delete;

/// <summary>
/// Deletes budget versions of the active space.
/// </summary>
public sealed class DeleteBudgetHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Deletes a budget version. The previous version of the category applies again from its month on.</summary>
    /// <param name="id">The budget id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found error.</returns>
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var budget = await dbContext.GetVisibleBudgets(currentUser)
            .FirstOrDefaultAsync(item => item.Id == id && item.SpaceId == currentUser.ActiveSpaceId, cancellationToken);
        if (budget is null)
        {
            return Error.NotFound("Budget could not be found");
        }

        if (await dbContext.AuthorizeSharedChangeAsync(currentUser, budget.Visibility == Visibility.Shared, SpacePermissions.Budgets.Plan, cancellationToken) is { } error)
        {
            return error;
        }

        dbContext.Budgets.Remove(budget);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
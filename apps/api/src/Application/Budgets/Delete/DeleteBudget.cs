using Kijk.Application.Shared.Persistence;
using Kijk.Shared;

namespace Kijk.Application.Budgets.Delete;

/// <summary>
/// Deletes budget versions of the active household.
/// </summary>
public sealed class DeleteBudgetHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Deletes a budget version. The previous version of the category applies again from its month on.</summary>
    /// <param name="id">The budget id.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns><see langword="true" />, or a not-found error.</returns>
    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var budget = await dbContext.Budgets
            .FirstOrDefaultAsync(item => item.Id == id && item.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (budget is null)
        {
            return Error.NotFound("Budget could not be found");
        }

        dbContext.Budgets.Remove(budget);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
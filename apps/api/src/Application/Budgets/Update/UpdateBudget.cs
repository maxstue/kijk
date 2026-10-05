using Kijk.Application.Budgets.Shared;
using Kijk.Application.Shared.Authorization;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Budgets.Update;

/// <summary>
/// Updates budget versions of the active household.
/// </summary>
public sealed class UpdateBudgetHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Updates a budget version of the active household.</summary>
    /// <param name="id">The budget id.</param>
    /// <param name="request">The new budget data.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The updated budget, or a not-found error.</returns>
    public async Task<Result<BudgetResponse>> UpdateAsync(Guid id, UpdateBudgetRequest request, CancellationToken cancellationToken)
    {
        var budget = await dbContext.GetVisibleBudgets(currentUser)
            .Include(item => item.Category)
            .FirstOrDefaultAsync(item => item.Id == id && item.HouseholdId == currentUser.ActiveHouseholdId, cancellationToken);
        if (budget is null)
        {
            return Error.NotFound("Budget could not be found");
        }

        if (await dbContext.AuthorizeSharedChangeAsync(currentUser, budget.Visibility == Visibility.Shared, HouseholdPermissions.Budgets.Plan, cancellationToken) is { } error)
        {
            return error;
        }

        budget.Update(request.Amount, request.Active);
        await dbContext.SaveChangesAsync(cancellationToken);

        return budget.ToResponse();
    }
}
using Kijk.Application.Budgets.Shared;
using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Services;
using Kijk.Domain.ValueObjects;
using Kijk.Shared;

namespace Kijk.Application.Budgets.Get;

/// <summary>
/// Retrieves budgets and the monthly budget evaluation of the active household.
/// </summary>
public sealed class GetBudgetsHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>Gets all budget versions of the active household.</summary>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The budgets, ordered by category and newest version first.</returns>
    public async Task<Result<List<BudgetResponse>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var budgets = await dbContext.Budgets
            .Include(budget => budget.Category)
            .Where(budget => budget.HouseholdId == currentUser.ActiveHouseholdId)
            .OrderBy(budget => budget.Category.Name)
            .ThenByDescending(budget => budget.ValidFrom)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return budgets.Select(budget => budget.ToResponse()).ToList();
    }

    /// <summary>Evaluates the budgets of the active household for a calendar month.</summary>
    /// <param name="year">The year.</param>
    /// <param name="month">The month (1-12).</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The evaluation, or a validation error for an invalid month.</returns>
    public async Task<Result<BudgetOverviewResponse>> GetOverviewAsync(int year, int month, CancellationToken cancellationToken)
    {
        if (year is < 2000 or > 9999 || month is < 1 or > 12)
        {
            return Error.Validation("Year or month is invalid");
        }

        var monthYear = new MonthYear(new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc));
        var start = monthYear.ToDateTime();
        var end = start.AddMonths(1);

        var categories = await dbContext.GetAvailableCategories(currentUser).AsNoTracking().ToListAsync(cancellationToken);
        var budgets = await dbContext.Budgets
            .Where(budget => budget.HouseholdId == currentUser.ActiveHouseholdId && budget.ValidFrom <= start)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        var transactions = await dbContext.Transactions
            .Where(transaction => transaction.HouseholdId == currentUser.ActiveHouseholdId
                                  && transaction.BookingDate >= start
                                  && transaction.BookingDate < end)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return BudgetCalculator.Calculate(monthYear, categories, budgets, transactions).ToResponse();
    }
}
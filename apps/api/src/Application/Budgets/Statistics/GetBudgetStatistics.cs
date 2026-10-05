using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Services;
using Kijk.Domain.ValueObjects;
using Kijk.Shared;

namespace Kijk.Application.Budgets.Statistics;

/// <summary>Spending per expense category over several months.</summary>
/// <param name="Months">The first day of each month, oldest first.</param>
/// <param name="Categories">The expense categories with spending or a budget in at least one month.</param>
/// <param name="Uncategorized">Booked expenses without a category per month.</param>
/// <param name="TotalSpent">All booked expenses minus refunds per month, including uncategorized ones.</param>
/// <param name="TotalBudget">The sum of all active budgets per month.</param>
public sealed record BudgetStatisticsResponse(
    List<DateOnly> Months,
    List<CategoryTrendResponse> Categories,
    List<decimal> Uncategorized,
    List<decimal> TotalSpent,
    List<decimal> TotalBudget);

/// <summary>The spending of an expense category per month.</summary>
/// <param name="CategoryId">The category id.</param>
/// <param name="Name">The category name.</param>
/// <param name="Color">The category color.</param>
/// <param name="Spent">Booked expenses minus refunds per month, aligned with the months of the response.</param>
/// <param name="Budget">The active budget per month, or <see langword="null" /> where none applies.</param>
public sealed record CategoryTrendResponse(Guid CategoryId, string Name, string Color, List<decimal> Spent, List<decimal?> Budget);

/// <summary>
/// Evaluates the spending per category over several months with the same rules as the monthly budget overview.
/// </summary>
public sealed class GetBudgetStatisticsHandler(IAppDbContext dbContext, CurrentUser currentUser) : IHandler
{
    /// <summary>The maximum number of months per request.</summary>
    public const int MaximumMonths = 24;

    /// <summary>Gets the spending per category for the months that end with the given month.</summary>
    /// <param name="year">The year of the last month.</param>
    /// <param name="month">The last month (1-12).</param>
    /// <param name="months">The number of months, 1 to <see cref="MaximumMonths" />.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The statistics, or a validation error.</returns>
    public async Task<Result<BudgetStatisticsResponse>> GetAsync(int year, int month, int months, CancellationToken cancellationToken)
    {
        if (year is < 2000 or > 9999 || month is < 1 or > 12 || months is < 1 or > MaximumMonths)
        {
            return Error.Validation($"Year, month or number of months (1-{MaximumMonths}) is invalid");
        }

        var last = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var first = last.AddMonths(1 - months);
        var end = last.AddMonths(1);

        var categories = await dbContext.GetAvailableCategories(currentUser).AsNoTracking().ToListAsync(cancellationToken);
        var budgets = await dbContext.Budgets
            .Where(budget => budget.HouseholdId == currentUser.ActiveHouseholdId && budget.ValidFrom < end)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        var transactions = await dbContext.Transactions
            .Where(transaction => transaction.HouseholdId == currentUser.ActiveHouseholdId
                                  && transaction.BookingDate >= first
                                  && transaction.BookingDate < end)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var transactionsByMonth = transactions.ToLookup(transaction => new DateTime(transaction.BookingDate.Year, transaction.BookingDate.Month, 1, 0, 0, 0, DateTimeKind.Utc));
        var summaries = Enumerable.Range(0, months)
            .Select(offset => first.AddMonths(offset))
            .Select(start => BudgetCalculator.Calculate(new MonthYear(start), categories, budgets, transactionsByMonth[start]))
            .ToList();

        var trends = summaries
            .SelectMany(summary => summary.Categories)
            .Select(spending => spending.Category)
            .DistinctBy(category => category.Id)
            .OrderBy(category => category.Name, StringComparer.OrdinalIgnoreCase)
            .Select(category => new CategoryTrendResponse(
                category.Id,
                category.Name,
                category.Color,
                [.. summaries.Select(summary => summary.Categories.FirstOrDefault(item => item.Category.Id == category.Id)?.Spent ?? 0)],
                [.. summaries.Select(summary => summary.Categories.FirstOrDefault(item => item.Category.Id == category.Id)?.Budget?.Amount)]))
            .ToList();

        return new BudgetStatisticsResponse(
            [.. summaries.Select(summary => DateOnly.FromDateTime(summary.Month.ToDateTime()))],
            trends,
            [.. summaries.Select(summary => summary.UncategorizedExpenses)],
            [.. summaries.Select(summary => summary.TotalSpent)],
            [.. summaries.Select(summary => summary.TotalBudget)]);
    }
}
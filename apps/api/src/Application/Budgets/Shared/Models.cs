using Kijk.Domain.Entities;
using Kijk.Domain.Services;

namespace Kijk.Application.Budgets.Shared;

/// <summary>A budget version: a monthly amount for a category from a month on.</summary>
/// <param name="Id">The budget id.</param>
/// <param name="CategoryId">The category id.</param>
/// <param name="CategoryName">The category name.</param>
/// <param name="Amount">The monthly amount in EUR.</param>
/// <param name="ValidFrom">The first day of the first month the budget applies to.</param>
/// <param name="Active">Whether the budget is evaluated.</param>
public sealed record BudgetResponse(Guid Id, Guid CategoryId, string CategoryName, decimal Amount, DateOnly ValidFrom, bool Active);

/// <summary>The budget evaluation of a month.</summary>
/// <param name="Year">The evaluated year.</param>
/// <param name="Month">The evaluated month (1-12).</param>
/// <param name="TotalBudget">The sum of all active budgets.</param>
/// <param name="TotalSpent">All booked expenses minus refunds, including uncategorized expenses.</param>
/// <param name="Income">Booked transactions in income categories.</param>
/// <param name="UncategorizedExpenses">Booked expenses without a category.</param>
/// <param name="UncategorizedIncome">Booked incoming payments without a category.</param>
/// <param name="PendingExpenses">Expenses the bank has not booked yet; they do not count against budgets.</param>
/// <param name="Categories">The expense categories with an active budget or with transactions in the month.</param>
public sealed record BudgetOverviewResponse(
    int Year,
    int Month,
    decimal TotalBudget,
    decimal TotalSpent,
    decimal Income,
    decimal UncategorizedExpenses,
    decimal UncategorizedIncome,
    decimal PendingExpenses,
    List<BudgetCategoryResponse> Categories);

/// <summary>The spending of an expense category in the evaluated month.</summary>
/// <param name="CategoryId">The category id.</param>
/// <param name="Name">The category name.</param>
/// <param name="Icon">The category icon.</param>
/// <param name="Color">The category color.</param>
/// <param name="BudgetId">The applicable budget version, if any.</param>
/// <param name="Budget">The applicable monthly amount, if any.</param>
/// <param name="Spent">Booked expenses minus refunds.</param>
/// <param name="Pending">Pending expenses that do not count yet.</param>
/// <param name="Remaining">The amount left, if a budget applies.</param>
/// <param name="UtilizationPercentage">The used share of the budget in percent, if a budget applies.</param>
/// <param name="IsExceeded">Whether the spending is over the budget.</param>
public sealed record BudgetCategoryResponse(
    Guid CategoryId,
    string Name,
    string Icon,
    string Color,
    Guid? BudgetId,
    decimal? Budget,
    decimal Spent,
    decimal Pending,
    decimal? Remaining,
    decimal? UtilizationPercentage,
    bool IsExceeded);

/// <summary>
/// Maps budget entities and evaluations to API responses.
/// </summary>
public static class BudgetResponseMapper
{
    /// <summary>Maps a budget with its loaded category to a response.</summary>
    /// <param name="source">The budget.</param>
    /// <returns>The response.</returns>
    public static BudgetResponse ToResponse(this Budget source) =>
        new(source.Id, source.CategoryId, source.Category.Name, source.Amount, DateOnly.FromDateTime(source.ValidFrom), source.Active);

    /// <summary>Maps a month evaluation to a response.</summary>
    /// <param name="source">The evaluation.</param>
    /// <returns>The response.</returns>
    public static BudgetOverviewResponse ToResponse(this BudgetMonthSummary source) =>
        new(
            source.Month.Year,
            source.Month.Month,
            source.TotalBudget,
            source.TotalSpent,
            source.Income,
            source.UncategorizedExpenses,
            source.UncategorizedIncome,
            source.PendingExpenses,
            source.Categories.Select(item => new BudgetCategoryResponse(
                item.Category.Id,
                item.Category.Name,
                item.Category.Icon,
                item.Category.Color,
                item.Budget?.Id,
                item.Budget?.Amount,
                item.Spent,
                item.Pending,
                item.Remaining,
                item.UtilizationPercentage,
                item.IsExceeded)).ToList());
}
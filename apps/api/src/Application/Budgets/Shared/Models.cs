using Kijk.Domain.Entities;
using Kijk.Domain.Services;
using Kijk.Domain.ValueObjects;
using Kijk.Shared;
using Riok.Mapperly.Abstractions;

namespace Kijk.Application.Budgets.Shared;

/// <summary>A budget version: a monthly amount for a category from a month on.</summary>
/// <param name="Id">The budget id.</param>
/// <param name="CategoryId">The category id.</param>
/// <param name="CategoryName">The category name.</param>
/// <param name="Amount">The monthly amount in EUR.</param>
/// <param name="ValidFrom">The first day of the first month the budget applies to.</param>
/// <param name="Active">Whether the budget is evaluated.</param>
/// <param name="Visibility">Whether the budget belongs to the whole space or only to the current member.</param>
public sealed record BudgetResponse(Guid Id, Guid CategoryId, string CategoryName, decimal Amount, DateOnly ValidFrom, bool Active, Visibility Visibility);

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
/// <param name="BudgetVisibility">Whether the applicable budget is shared or the member's private one.</param>
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
    bool IsExceeded,
    Visibility? BudgetVisibility);

/// <summary>
/// Maps budget entities and evaluations to API responses.
/// </summary>
[Mapper]
public static partial class BudgetResponseMapper
{
    /// <summary>Maps a budget with its loaded category to a response.</summary>
    /// <param name="source">The budget.</param>
    /// <returns>The response.</returns>
    public static partial BudgetResponse ToResponse(this Budget source);

    /// <summary>Maps a month evaluation to a response.</summary>
    /// <param name="source">The month evaluation.</param>
    /// <returns>The response.</returns>
    [MapProperty(new[] { nameof(BudgetMonthSummary.Month), nameof(MonthYear.Year) }, nameof(BudgetOverviewResponse.Year))]
    [MapProperty(new[] { nameof(BudgetMonthSummary.Month), nameof(MonthYear.Month) }, nameof(BudgetOverviewResponse.Month))]
    public static partial BudgetOverviewResponse ToResponse(this BudgetMonthSummary source);

    [MapProperty(new[] { nameof(CategorySpending.Category), nameof(Category.Name) }, nameof(BudgetCategoryResponse.Name))]
    [MapProperty(new[] { nameof(CategorySpending.Category), nameof(Category.Icon) }, nameof(BudgetCategoryResponse.Icon))]
    [MapProperty(new[] { nameof(CategorySpending.Category), nameof(Category.Color) }, nameof(BudgetCategoryResponse.Color))]
    [MapProperty(new[] { nameof(CategorySpending.Budget), nameof(Budget.Amount) }, nameof(BudgetCategoryResponse.Budget))]
    private static partial BudgetCategoryResponse MapCategory(CategorySpending source);
}
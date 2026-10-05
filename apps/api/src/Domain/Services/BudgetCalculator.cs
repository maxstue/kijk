using Kijk.Domain.Entities;
using Kijk.Domain.ValueObjects;
using Kijk.Shared;

namespace Kijk.Domain.Services;

/// <summary>
/// Evaluates the budgets of a household for a calendar month.
/// </summary>
/// <remarks>
/// Rules: expenses use up the budget of their category and refunds lower it in their booking month; income is
/// evaluated separately; confirmed transfers between own accounts never count; pending transactions are reported
/// separately and only count once booked; uncategorized transactions are reported separately.
/// </remarks>
public static class BudgetCalculator
{
    /// <summary>
    /// Returns the budget version that applies to each category in the given month: the latest one that starts in or
    /// before that month. Private budgets replace the shared budget of their category, so pass only the budgets the
    /// viewing member may see.
    /// </summary>
    /// <param name="budgets">The budget versions visible to the viewing member.</param>
    /// <param name="month">The evaluated month.</param>
    /// <returns>The applicable budget per category id, including inactive ones.</returns>
    public static Dictionary<Guid, Budget> GetEffectiveBudgets(IEnumerable<Budget> budgets, MonthYear month) =>
        budgets
            .Where(budget => budget.ValidFrom <= month.ToDateTime())
            .GroupBy(budget => budget.CategoryId)
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderByDescending(budget => budget.OwnerId is not null)
                    .ThenByDescending(budget => budget.ValidFrom)
                    .First());

    /// <summary>Evaluates the budgets for a month.</summary>
    /// <param name="month">The evaluated month.</param>
    /// <param name="categories">All categories available to the household.</param>
    /// <param name="budgets">All budget versions of the household.</param>
    /// <param name="transactions">The household's transactions; transactions outside the month are ignored.</param>
    /// <returns>The evaluation of the month.</returns>
    public static BudgetMonthSummary Calculate(
        MonthYear month,
        IEnumerable<Category> categories,
        IEnumerable<Budget> budgets,
        IEnumerable<Transaction> transactions)
    {
        var start = month.ToDateTime();
        var end = start.AddMonths(1);
        var categoriesById = categories.ToDictionary(category => category.Id);
        var effectiveBudgets = GetEffectiveBudgets(budgets, month);

        var spent = new Dictionary<Guid, decimal>();
        var pending = new Dictionary<Guid, decimal>();
        decimal income = 0, uncategorizedExpenses = 0, uncategorizedIncome = 0, pendingExpenses = 0;

        foreach (var transaction in transactions.Where(item => !item.IsTransfer && item.BookingDate >= start && item.BookingDate < end))
        {
            var category = transaction.CategoryId is { } categoryId ? categoriesById.GetValueOrDefault(categoryId) : null;
            if (transaction.Status == TransactionStatus.Pending)
            {
                if (transaction.Amount < 0)
                {
                    pendingExpenses -= transaction.Amount;
                }

                if (category?.Kind == CategoryKind.Expense)
                {
                    pending[category.Id] = pending.GetValueOrDefault(category.Id) - transaction.Amount;
                }

                continue;
            }

            switch (category?.Kind)
            {
                case CategoryKind.Expense:
                    // Refunds are positive and therefore lower the spending of their category.
                    spent[category.Id] = spent.GetValueOrDefault(category.Id) - transaction.Amount;
                    break;
                case CategoryKind.Income:
                    income += transaction.Amount;
                    break;
                case null when transaction.Amount < 0:
                    uncategorizedExpenses -= transaction.Amount;
                    break;
                case null:
                    uncategorizedIncome += transaction.Amount;
                    break;
            }
        }

        var categorySpendings = categoriesById.Values
            .Where(category => category.Kind == CategoryKind.Expense)
            .Select(category =>
            {
                var budget = effectiveBudgets.GetValueOrDefault(category.Id);
                return new CategorySpending(
                    category,
                    budget is { Active: true } ? budget : null,
                    spent.GetValueOrDefault(category.Id),
                    pending.GetValueOrDefault(category.Id));
            })
            .Where(item => item.Budget is not null || item.Spent != 0 || item.Pending != 0)
            .OrderByDescending(item => item.Budget is not null)
            .ThenBy(item => item.Category.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new BudgetMonthSummary(
            month,
            categorySpendings,
            categorySpendings.Sum(item => item.Budget?.Amount ?? 0),
            spent.Values.Sum() + uncategorizedExpenses,
            income,
            uncategorizedExpenses,
            uncategorizedIncome,
            pendingExpenses);
    }
}

/// <summary>
/// The budget evaluation of a month.
/// </summary>
/// <param name="Month">The evaluated month.</param>
/// <param name="Categories">The expense categories with an active budget or with transactions in the month.</param>
/// <param name="TotalBudget">The sum of all active budgets.</param>
/// <param name="TotalSpent">All booked expenses minus refunds, including uncategorized expenses.</param>
/// <param name="Income">Booked transactions in income categories.</param>
/// <param name="UncategorizedExpenses">Booked expenses without a category.</param>
/// <param name="UncategorizedIncome">Booked incoming payments without a category.</param>
/// <param name="PendingExpenses">Expenses the bank has not booked yet.</param>
public sealed record BudgetMonthSummary(
    MonthYear Month,
    IReadOnlyList<CategorySpending> Categories,
    decimal TotalBudget,
    decimal TotalSpent,
    decimal Income,
    decimal UncategorizedExpenses,
    decimal UncategorizedIncome,
    decimal PendingExpenses);

/// <summary>
/// The spending of an expense category in a month.
/// </summary>
/// <param name="Category">The category.</param>
/// <param name="Budget">The active budget for the month, or <see langword="null" /> when none applies.</param>
/// <param name="Spent">Booked expenses minus refunds. Can be negative when refunds exceed expenses.</param>
/// <param name="Pending">Pending expenses that do not count yet.</param>
public sealed record CategorySpending(Category Category, Budget? Budget, decimal Spent, decimal Pending)
{
    /// <summary>Gets the amount left in the budget, or <see langword="null" /> without a budget.</summary>
    public decimal? Remaining => Budget is null ? null : Budget.Amount - Spent;

    /// <summary>Gets the used share of the budget in percent, or <see langword="null" /> without a budget.</summary>
    public decimal? UtilizationPercentage => Budget is null || Budget.Amount == 0
        ? null
        : Math.Round(Spent / Budget.Amount * 100, 1, MidpointRounding.AwayFromZero);

    /// <summary>Gets whether the booked spending is over the budget.</summary>
    public bool IsExceeded => Budget is not null && Spent > Budget.Amount;
}
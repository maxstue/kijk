namespace Kijk.Application.Budgets.Create;

/// <summary>
/// Request for creating a budget for a category from a month on.
/// </summary>
/// <param name="CategoryId">The expense category.</param>
/// <param name="Amount">The monthly amount in EUR.</param>
/// <param name="ValidFrom">Any day of the first month the budget applies to.</param>
/// <param name="Active">Whether the budget is evaluated.</param>
public sealed record CreateBudgetRequest(Guid CategoryId, decimal Amount, DateOnly ValidFrom, bool Active);
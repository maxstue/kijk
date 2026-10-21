namespace Kijk.Application.Budgets.UpdateVersion;

/// <summary>
/// Request for changing the amount or active state of a budget version.
/// </summary>
/// <param name="Amount">The monthly amount in EUR.</param>
/// <param name="Active">Whether the budget is evaluated.</param>
public sealed record UpdateBudgetRequest(decimal Amount, bool Active);
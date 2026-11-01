using Kijk.Application.Shared.Finances;
using Kijk.Application.Shared.Persistence;
using Kijk.Application.Limits.Shared;
using Kijk.Domain.Services;
using Kijk.Domain.ValueObjects;
using Kijk.Shared;

namespace Kijk.Application.Dashboard.Queries;

/// <summary>Reads aggregates shared by every member, without exposing transaction details.</summary>
public sealed class QueriesHandler(IAppDbContext dbContext, CurrentUser currentUser)
{
    /// <summary>Gets January through December finance totals, separately per currency.</summary>
    /// <param name="year">The calendar year.</param>
    /// <param name="cancellationToken">Request cancellation.</param>
    /// <returns>Monthly shared income, expenses and balance.</returns>
    public async Task<Result<List<FinanceMonth>>> FinancesAsync(int year, CancellationToken cancellationToken)
    {
        if (year is < 2000 or > 9998)
        {
            return Error.Validation("Year is invalid");
        }
        var start = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddYears(1);
        var transactions = await dbContext.GetSharedTransactions(currentUser)
            .Where(item => item.BookingDate >= start && item.BookingDate < end)
            .AsNoTracking().ToListAsync(cancellationToken);
        var categories = await dbContext.GetAvailableCategories(currentUser).AsNoTracking().ToListAsync(cancellationToken);
        return transactions.GroupBy(item => item.Currency).SelectMany(currency =>
            Enumerable.Range(1, 12).Select(month =>
            {
                var summary = BudgetCalculator.Calculate(new MonthYear(start.AddMonths(month - 1)), categories, [], currency);
                var income = summary.Income + summary.UncategorizedIncome;
                return new FinanceMonth(month, currency.Key, income, summary.TotalSpent, income - summary.TotalSpent,
                    currency.Any(item => item.BookingDate.Month == month && !item.IsTransfer && item.Status != TransactionStatus.Pending));
            })).ToList();
    }

    /// <summary>Gets the five shared monthly budgets closest to or beyond their limit.</summary>
    /// <param name="year">The selected year.</param>
    /// <param name="month">The selected month.</param>
    /// <param name="cancellationToken">Request cancellation.</param>
    /// <returns>Shared EUR budgets at or above 80 percent, ordered by urgency.</returns>
    public async Task<Result<List<DashboardBudget>>> BudgetsAsync(int year, int month, CancellationToken cancellationToken)
    {
        if (year is < 2000 or > 9998 || month is < 1 or > 12)
        {
            return Error.Validation("Year or month is invalid");
        }
        var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddMonths(1);
        var categories = await dbContext.GetAvailableCategories(currentUser).AsNoTracking().ToListAsync(cancellationToken);
        var budgets = await dbContext.GetVisibleBudgets(currentUser)
            .Where(item => item.OwnerId == null && item.ValidFrom <= start)
            .AsNoTracking().ToListAsync(cancellationToken);
        var transactions = await dbContext.GetSharedTransactions(currentUser)
            .Where(item => item.BookingDate >= start && item.BookingDate < end && item.Currency == "EUR")
            .AsNoTracking().ToListAsync(cancellationToken);
        var summary = BudgetCalculator.Calculate(new MonthYear(start), categories, budgets, transactions);
        return summary.Categories
            .Where(item => item.Budget != null && (item.UtilizationPercentage >= 80 || item.Spent >= item.Budget.Amount))
            .OrderByDescending(item => item.Budget!.Amount == 0 && item.Spent > 0 ? decimal.MaxValue : item.UtilizationPercentage ?? 0)
            .ThenBy(item => item.Category.Name, StringComparer.OrdinalIgnoreCase)
            .ThenBy(item => item.Budget!.Id)
            .Take(5)
            .Select(item => new DashboardBudget(item.Budget!.Id, item.Category.Name, "EUR", item.Budget.Amount,
                item.Spent, Math.Max(0, item.Remaining ?? 0), Math.Max(0, item.Spent - item.Budget.Amount), item.UtilizationPercentage))
            .ToList();
    }

    /// <summary>Gets monthly consumption aggregates by resource and unit for a calendar year.</summary>
    /// <param name="year">The calendar year.</param>
    /// <param name="cancellationToken">Request cancellation.</param>
    /// <returns>Recorded monthly consumption totals.</returns>
    public async Task<Result<List<ConsumptionMonth>>> ConsumptionsAsync(int year, CancellationToken cancellationToken)
    {
        if (year is < 2000 or > 9998)
        {
            return Error.Validation("Year is invalid");
        }
        var start = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddYears(1);
        return await dbContext.Consumptions.Where(item => item.SpaceId == currentUser.ActiveSpaceId && item.Date >= start && item.Date < end)
            .GroupBy(item => new { item.ResourceId, item.Resource.Name, item.Resource.Unit.Symbol, item.Date.Month })
            .Select(group => new ConsumptionMonth(group.Key.Month, group.Key.ResourceId, group.Key.Name, group.Key.Symbol,
                group.Sum(item => item.CalculatedConsumption))).ToListAsync(cancellationToken);
    }

    /// <summary>Evaluates today's active limit definitions for the period containing the selected month.</summary>
    /// <param name="year">The selected year.</param>
    /// <param name="month">The selected month.</param>
    /// <param name="cancellationToken">Request cancellation.</param>
    /// <returns>Limits evaluated against their full calendar period.</returns>
    public async Task<Result<List<DashboardLimit>>> LimitsAsync(int year, int month, CancellationToken cancellationToken)
    {
        if (year is < 2000 or > 9998 || month is < 1 or > 12)
        {
            return Error.Validation("Year or month is invalid");
        }
        var reference = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var start = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddYears(1);
        var limits = await dbContext.Limits.Include(item => item.Resource.Unit)
            .Where(item => item.SpaceId == currentUser.ActiveSpaceId && item.Active)
            .OrderBy(item => item.Name).AsNoTracking().ToListAsync(cancellationToken);
        var consumptions = await dbContext.Consumptions
            .Where(item => item.SpaceId == currentUser.ActiveSpaceId && item.Date >= start && item.Date < end)
            .AsNoTracking().ToListAsync(cancellationToken);
        return limits.Select(limit =>
        {
            var value = LimitEvaluation.ToResponse(limit, consumptions, reference);
            return new DashboardLimit(value.Id, value.Name, value.Resource.Unit, value.Limit, value.ActualValue,
                Math.Max(0, value.Limit - value.ActualValue), Math.Max(0, value.ActualValue - value.Limit),
                value.Limit == 0 ? null : value.UtilizationPercentage, value.PeriodStart, value.PeriodEnd);
        }).ToList();
    }
}

/// <summary>Monthly finance totals; HasData distinguishes a zero result from missing bookings.</summary>
public sealed record FinanceMonth(int Month, string Currency, decimal Income, decimal Expenses, decimal Balance, bool HasData);
/// <summary>Recorded consumption for one resource and calendar month.</summary>
public sealed record ConsumptionMonth(int Month, Guid ResourceId, string Name, string Unit, decimal Value);
/// <summary>A limit evaluated using its current definition; a zero threshold has no percentage.</summary>
public sealed record DashboardLimit(Guid Id, string Name, string Unit, decimal Threshold, decimal ActualValue,
    decimal Remaining, decimal Overrun, decimal? Percentage, DateTime PeriodStart, DateTime PeriodEnd);

/// <summary>A shared monthly EUR budget evaluated against shared booked transactions only.</summary>
public sealed record DashboardBudget(Guid Id, string Name, string Currency, decimal Amount, decimal Spent,
    decimal Remaining, decimal Overrun, decimal? Percentage);
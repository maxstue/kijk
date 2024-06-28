using Kijk.Api.Common.Models;

namespace Kijk.Api.Domain.Entities;

public class Budget : BaseEntity
{
    public required string Name { get; set; }

    public decimal Limit { get; set; }
    public decimal ActualSpending { get; set; }

    public DateOnly StartDate { get; set; }

    // If EndDate is null, the budget is infinite
    public DateOnly? EndDate { get; set; }
    public BudgetStatus Status { get; set; }
    public Visibility Visibility { get; set; }
    public Guid HouseholdId { get; set; }

    // Linking budgets to specific user
    public required Guid UserId { get; set; }

    // Linking budgets to specific categories for automatically adding transactions
    public Guid CategoryId { get; set; }
    public required Category Category { get; set; }

    public static Budget Create(
        string name,
        decimal limit,
        DateOnly startDate,
        Guid householdId,
        Guid userId,
        Category category,
        DateOnly? endDate = default)
    {
        return new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            Limit = limit,
            StartDate = startDate,
            EndDate = endDate,
            ActualSpending = 0,
            Status = BudgetStatus.Active,
            Visibility = Visibility.Public,
            HouseholdId = householdId,
            UserId = userId,
            Category = category
        };
    }
}

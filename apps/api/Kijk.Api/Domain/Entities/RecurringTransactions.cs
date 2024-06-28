using Kijk.Api.Common.Models;

namespace Kijk.Api.Domain.Entities;

public class RecurringTransactions : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }

    public decimal Amount { get; set; }

    public decimal TotalSpend { get; set; }
    // NOTE add TotalSpentThisYear( on this recurring payment for the current year)

    public DateOnly StartDate { get; set; }

    public DateOnly? NextPaymentDate { get; set; }

    // IF EndDate is null, the recurring payment is infinite
    public DateOnly? EndDate { get; set; }
    public Frequency Frequency { get; set; }

    public Guid HouseholdId { get; set; }

    public Guid? LastTransactionId { get; set; }
    // Link to the actual transaction if already processed
    public Transaction? LastTransaction { get; set; }

    // Link to the user who has the recurring payment
    public required User User { get; set; }

    public Guid AccountId { get; set; }

    // Last account used for the recurring payment
    public required Account Account { get; set; }

    public static RecurringTransactions Create(
        string name,
        decimal amount,
        DateOnly startDate,
        User user,
        Account account,
        Guid householdId,
        Frequency frequency,
        DateOnly? endDate = default)
    {
        return new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            User = user,
            Account = account,
            Amount = amount,
            TotalSpend = 0,
            StartDate = startDate,
            EndDate = endDate,
            Frequency = frequency,
            HouseholdId = householdId
        };
    }
}

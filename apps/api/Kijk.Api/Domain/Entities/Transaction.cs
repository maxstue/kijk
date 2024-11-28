using Kijk.Api.Common.Models;

namespace Kijk.Api.Domain.Entities;

public sealed class Transaction : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required decimal Amount { get; set; }
    public required TransactionStatus Status { get; set; }

    public Guid AccountId { get; set; }
    public required Account Account { get; set; }
    public TransactionType Type { get; set; }
    public DateTime ExecutedAt { get; set; }

    public Guid? RecurringTransactionId { get; set; }

    public Guid CategoryId { get; set; }
    public required Category Category { get; set; }

    public static Transaction Create(
        string name,
        decimal amount,
        TransactionType type,
        DateTime executedAt,
        Account account,
        Category category)
    {
        return new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            Amount = amount,
            Type = type,
            Status = TransactionStatus.Completed,
            ExecutedAt = executedAt,
            Account = account,
            Category = category
        };
    }
}
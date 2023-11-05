using NetEscapades.EnumGenerators;

namespace Kijk.Api.Domain.Entities;

[EnumExtensions]
public enum TransactionType
{
    Income,
    Expense
}

public sealed class Transaction : BaseEntity
{
    public required string Name { get; set; }

    public required decimal Amount { get; set; }

    public required User User { get; set; }

    public TransactionType Type { get; set; }

    public DateTime ExecutedAt { get; set; }

    public Category? Category { get; set; }

    public static Transaction Create(
        string name,
        decimal amount,
        TransactionType type,
        DateTime executedAt,
        User user,
        Category? category = default)
    {
        return new Transaction
        {
            Id = Guid.NewGuid(),
            Name = name,
            Amount = amount,
            Type = type,
            ExecutedAt = executedAt,
            User = user,
            Category = category
        };
    }
}

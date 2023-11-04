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
    private Transaction(Guid id, string name, decimal amount, TransactionType type, DateTime executedAt, User user, Category? category) : base(id)
    {
        Name = name;
        Amount = amount;
        Type = type;
        ExecutedAt = executedAt;
        User = user;
        Category = category;
    }

    public string Name { get; set; }

    public decimal Amount { get; set; }

    public User User { get; set; }

    public TransactionType Type { get; set; }

    public DateTime ExecutedAt { get; set; }

    public Category? Category { get; set; }

    public static Transaction Create(
        string name,
        decimal amount,
        TransactionType type,
        DateTime executedAt,
        User user,
        Category? category = default) =>
        new(Guid.NewGuid(), name, amount, type, executedAt, user, category);
}

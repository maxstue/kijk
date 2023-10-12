using NetEscapades.EnumGenerators;

namespace Kijk.Api.Domain.Entities;

[EnumExtensions]
public enum TransactionType
{
    Income,
    Expense
}

public class Transaction : BaseEntity
{
    public required string Name { get; set; }

    public decimal Amount { get; set; }

    public User User { get; set; }
    public TransactionType Type { get; set; }
    public DateTime ExecutedAt { get; set; }
    public List<Category> Categories { get; set; } = new();
}

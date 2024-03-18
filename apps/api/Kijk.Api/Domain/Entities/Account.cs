using Kijk.Api.Common.Models;

namespace Kijk.Api.Domain.Entities;

public sealed class Account : BaseEntity
{
    /// <summary>
    ///     The user who owns the account.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    ///     The household the account belongs to.
    /// </summary>
    public Guid HouseholdId { get; set; }

    public required string Name { get; set; }
    public decimal Balance { get; set; }
    public Visibility Visibility { get; set; }
    public AccountType Type { get; set; }

    public List<Transaction> Transactions { get; set; } = [];
    public List<RecurringTransactions> RecurringTransactions { get; set; } = [];

    public static Account Create(string name, Guid userId, Guid householdId, AccountType type, Visibility visibility = Visibility.Public) =>
        new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            Type = type,
            Visibility = visibility,
            Balance = 0,
            Transactions = [],
            RecurringTransactions = [],
            HouseholdId = householdId,
            UserId = userId
        };
}

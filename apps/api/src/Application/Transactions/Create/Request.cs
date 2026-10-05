using Kijk.Shared;

namespace Kijk.Application.Transactions.Create;

/// <summary>
/// Request for recording a transaction manually.
/// </summary>
/// <param name="BookingDate">The booking date.</param>
/// <param name="Amount">The signed amount in EUR; negative values are expenses.</param>
/// <param name="Counterparty">The counterparty, if known.</param>
/// <param name="Purpose">The purpose, if known.</param>
/// <param name="Status">Whether the transaction is booked or pending.</param>
/// <param name="IsTransfer">Whether it is a transfer between the space's own accounts.</param>
/// <param name="AccountId">The account, if any.</param>
/// <param name="CategoryId">The category, or <see langword="null" /> to leave it uncategorized.</param>
public sealed record CreateTransactionRequest(
    DateOnly BookingDate,
    decimal Amount,
    string? Counterparty,
    string? Purpose,
    TransactionStatus Status,
    bool IsTransfer,
    Guid? AccountId,
    Guid? CategoryId);
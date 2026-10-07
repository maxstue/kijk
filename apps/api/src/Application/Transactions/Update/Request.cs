using Kijk.Shared;

namespace Kijk.Application.Transactions.Update;

/// <summary>
/// Request for replacing the editable properties of a transaction.
/// </summary>
/// <param name="BookingDate">The booking date.</param>
/// <param name="Amount">The signed amount in EUR; negative values are expenses.</param>
/// <param name="Counterparty">The counterparty, if known.</param>
/// <param name="Purpose">The purpose, if known.</param>
/// <param name="Status">Whether the transaction is booked or pending.</param>
/// <param name="IsTransfer">Whether it is a transfer between the space's own accounts.</param>
/// <param name="AccountId">The account, if any.</param>
/// <param name="CategoryId">The category, or <see langword="null" /> to mark it as uncategorized. A changed category counts as set manually.</param>
public sealed record UpdateTransactionRequest(
    DateOnly BookingDate,
    decimal Amount,
    string? Counterparty,
    string? Purpose,
    TransactionStatus Status,
    bool IsTransfer,
    Guid? AccountId,
    Guid? CategoryId);
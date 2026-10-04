using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Transactions.Shared;

/// <summary>A transaction of the household.</summary>
/// <param name="Id">The transaction id.</param>
/// <param name="BookingDate">The booking date.</param>
/// <param name="Amount">The signed amount; negative values are expenses.</param>
/// <param name="Currency">The ISO 4217 currency code.</param>
/// <param name="Counterparty">The counterparty, if known.</param>
/// <param name="Purpose">The cleaned purpose, if known.</param>
/// <param name="Status">Whether the transaction is booked or pending.</param>
/// <param name="IsTransfer">Whether it is a transfer between the household's own accounts.</param>
/// <param name="AccountId">The account id, if assigned.</param>
/// <param name="AccountName">The account name, if assigned.</param>
/// <param name="CategoryId">The category id, if categorized.</param>
/// <param name="CategoryName">The category name, if categorized.</param>
/// <param name="CategorySource">How the category was assigned, if categorized.</param>
public sealed record TransactionResponse(
    Guid Id,
    DateOnly BookingDate,
    decimal Amount,
    string Currency,
    string? Counterparty,
    string? Purpose,
    TransactionStatus Status,
    bool IsTransfer,
    Guid? AccountId,
    string? AccountName,
    Guid? CategoryId,
    string? CategoryName,
    CategorySource? CategorySource);

/// <summary>
/// Maps transaction entities to API responses.
/// </summary>
public static class TransactionResponseMapper
{
    /// <summary>Maps a transaction with its loaded account and category to a response.</summary>
    /// <param name="source">The transaction.</param>
    /// <returns>The response.</returns>
    public static TransactionResponse ToResponse(this Transaction source) =>
        new(
            source.Id,
            DateOnly.FromDateTime(source.BookingDate),
            source.Amount,
            source.Currency,
            source.Counterparty,
            source.Purpose,
            source.Status,
            source.IsTransfer,
            source.AccountId,
            source.Account?.Name,
            source.CategoryId,
            source.Category?.Name,
            source.CategorySource);
}

/// <summary>
/// Defines validation constraints shared by transaction create and update requests.
/// </summary>
public static class TransactionValidationRules
{
    /// <summary>Maximum allowed counterparty length.</summary>
    public const int CounterpartyMaximumLength = 200;

    /// <summary>Maximum allowed purpose length.</summary>
    public const int PurposeMaximumLength = 500;
}
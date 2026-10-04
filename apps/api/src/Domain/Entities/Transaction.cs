using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>
/// A booking on a household account. Negative amounts are expenses, positive amounts are income or refunds.
/// </summary>
public sealed class Transaction : BaseEntity
{
    /// <summary>The only currency supported for now.</summary>
    public const string DefaultCurrency = "EUR";

    /// <summary>Gets or sets the booking date (UTC, without time).</summary>
    public required DateTime BookingDate { get; set; }

    /// <summary>Gets or sets the signed amount. Negative values are expenses.</summary>
    public required decimal Amount { get; set; }

    /// <summary>Gets or sets the ISO 4217 currency code.</summary>
    public required string Currency { get; set; }

    /// <summary>Gets or sets the counterparty, e.g. the merchant or employer.</summary>
    public string? Counterparty { get; set; }

    /// <summary>Gets or sets the cleaned purpose without IBANs, card or reference numbers.</summary>
    public string? Purpose { get; set; }

    /// <summary>Gets or sets whether the bank has booked the transaction or only reserved it.</summary>
    public required TransactionStatus Status { get; set; }

    /// <summary>Gets or sets whether this is a confirmed transfer between the household's own accounts.</summary>
    public required bool IsTransfer { get; set; }

    /// <summary>Gets the id of <see cref="Category" />, or <see langword="null" /> while uncategorized.</summary>
    public Guid? CategoryId { get; private set; }

    /// <summary>Gets the category, or <see langword="null" /> while uncategorized.</summary>
    public Category? Category { get; private set; }

    /// <summary>Gets how the category was assigned, or <see langword="null" /> while uncategorized.</summary>
    public CategorySource? CategorySource { get; private set; }

    /// <summary>Gets or sets the id of <see cref="Account" />.</summary>
    public Guid? AccountId { get; set; }

    /// <summary>Gets or sets the account the transaction was booked on.</summary>
    public Account? Account { get; set; }

    /// <summary>Gets or sets the id of <see cref="CreatedBy" />.</summary>
    public Guid CreatedById { get; set; }

    /// <summary>Gets or sets the user that recorded the transaction.</summary>
    public required User CreatedBy { get; set; }

    /// <summary>Gets or sets the id of <see cref="Household" />.</summary>
    public Guid HouseholdId { get; set; }

    /// <summary>Gets or sets the household the transaction belongs to.</summary>
    public required Household Household { get; set; }

    /// <summary>Creates a transaction recorded by a user.</summary>
    /// <param name="details">The booking details.</param>
    /// <param name="account">The account, if known.</param>
    /// <param name="createdBy">The recording user.</param>
    /// <param name="household">The owning household.</param>
    /// <returns>The new transaction.</returns>
    public static Transaction Create(TransactionDetails details, Account? account, User createdBy, Household household) =>
        new()
        {
            BookingDate = details.BookingDate.Date,
            Amount = details.Amount,
            Currency = DefaultCurrency,
            Counterparty = details.Counterparty,
            Purpose = details.Purpose,
            Status = details.Status,
            IsTransfer = details.IsTransfer,
            Account = account,
            CreatedBy = createdBy,
            Household = household
        };

    /// <summary>Updates the booking details.</summary>
    /// <param name="details">The booking details.</param>
    /// <param name="account">The account, if known.</param>
    public void Update(TransactionDetails details, Account? account)
    {
        BookingDate = details.BookingDate.Date;
        Amount = details.Amount;
        Counterparty = details.Counterparty;
        Purpose = details.Purpose;
        Status = details.Status;
        IsTransfer = details.IsTransfer;
        Account = account;
        AccountId = account?.Id;
    }

    /// <summary>Sets or clears the category as chosen by a user.</summary>
    /// <param name="category">The category, or <see langword="null" /> to mark the transaction as uncategorized.</param>
    public void AssignCategoryManually(Category? category)
    {
        Category = category;
        CategoryId = category?.Id;
        CategorySource = category is null ? null : Shared.CategorySource.Manual;
    }

    /// <summary>
    /// Sets a category suggested by automatic categorization. Manually assigned categories are never overwritten.
    /// </summary>
    /// <param name="category">The suggested category.</param>
    /// <param name="source">The automatic source of the suggestion.</param>
    /// <returns><see langword="true" /> if the category was applied.</returns>
    /// <exception cref="ArgumentException"><paramref name="source" /> is <see cref="Shared.CategorySource.Manual" />.</exception>
    public bool AssignCategoryAutomatically(Category category, CategorySource source)
    {
        if (source == Shared.CategorySource.Manual)
        {
            throw new ArgumentException("Use AssignCategoryManually for manual categories.", nameof(source));
        }

        if (CategorySource == Shared.CategorySource.Manual)
        {
            return false;
        }

        Category = category;
        CategoryId = category.Id;
        CategorySource = source;
        return true;
    }
}

/// <summary>
/// Defines the editable booking details of a transaction.
/// </summary>
public sealed record TransactionDetails(
    DateTime BookingDate,
    decimal Amount,
    string? Counterparty,
    string? Purpose,
    TransactionStatus Status,
    bool IsTransfer);
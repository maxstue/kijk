using Kijk.Shared;

namespace Kijk.Domain.Entities;

/// <summary>
/// A row of an import before it is committed. Candidates are deleted when the import is committed, cancelled or
/// expires; committed transactions stay.
/// </summary>
public sealed class ImportCandidate : BaseEntity
{
    /// <summary>Gets the 1-based line number in the file.</summary>
    public required int RowNumber { get; init; }

    /// <summary>Gets the booking date, if it could be parsed.</summary>
    public DateTime? BookingDate { get; init; }

    /// <summary>Gets the signed amount, if it could be parsed.</summary>
    public decimal? Amount { get; init; }

    /// <summary>Gets the counterparty.</summary>
    public string? Counterparty { get; init; }

    /// <summary>Gets the cleaned purpose.</summary>
    public string? Purpose { get; init; }

    /// <summary>Gets whether the bank has booked the transaction or only reserved it.</summary>
    public TransactionStatus Status { get; init; }

    /// <summary>Gets whether the export marks the booking as card payment or direct debit.</summary>
    public bool IsMerchantPayment { get; init; }

    /// <summary>Gets the pseudonymous key of the booking.</summary>
    public string? BookingKey { get; init; }

    /// <summary>Gets the pseudonymous key of the counterparty IBAN.</summary>
    public string? CounterpartyKey { get; init; }

    /// <summary>Gets whether the row looks like a credit card statement that settles single purchases.</summary>
    public bool IsCardSettlement { get; init; }

    /// <summary>
    /// Gets whether the user confirmed that the single purchases of this card statement are imported separately, so
    /// the statement only offsets them and does not count against a budget.
    /// </summary>
    public bool CountsAsOffset { get; private set; }

    /// <summary>Gets whether the user chose not to send this row to the AI.</summary>
    public bool AiExcluded { get; private set; }

    /// <summary>Gets the proposed or chosen category.</summary>
    public Guid? CategoryId { get; private set; }

    /// <summary>Gets how the category was assigned.</summary>
    public CategorySource? CategorySource { get; private set; }

    /// <summary>Gets why the row could not be parsed, or <see langword="null" /> for a valid row.</summary>
    public string? Errors { get; init; }

    /// <summary>Gets whether the row will not be imported. Rows with errors are always excluded.</summary>
    public bool Excluded { get; private set; }

    /// <summary>Gets or sets the id of <see cref="ImportJob" />.</summary>
    public Guid ImportJobId { get; set; }

    /// <summary>Gets or sets the import the row belongs to.</summary>
    public ImportJob? ImportJob { get; set; }

    /// <summary>Gets whether the row can be committed.</summary>
    public bool IsValid => Errors is null && BookingDate is not null && Amount is not null;

    /// <summary>Creates a valid candidate.</summary>
    /// <param name="importJobId">The import.</param>
    /// <param name="rowNumber">The 1-based line number.</param>
    /// <param name="values">The parsed values.</param>
    /// <returns>The new candidate.</returns>
    public static ImportCandidate CreateValid(Guid importJobId, int rowNumber, ImportCandidateValues values) =>
        new()
        {
            ImportJobId = importJobId,
            RowNumber = rowNumber,
            BookingDate = values.BookingDate,
            Amount = values.Amount,
            Counterparty = values.Counterparty,
            Purpose = values.Purpose,
            Status = values.Status,
            IsMerchantPayment = values.IsMerchantPayment,
            BookingKey = values.BookingKey,
            CounterpartyKey = values.CounterpartyKey,
            IsCardSettlement = values.IsCardSettlement
        };

    /// <summary>Creates a candidate for a row that could not be parsed. It is excluded and shown in the review.</summary>
    /// <param name="importJobId">The import.</param>
    /// <param name="rowNumber">The 1-based line number.</param>
    /// <param name="errors">Why the row failed, without its content.</param>
    /// <returns>The new candidate.</returns>
    public static ImportCandidate CreateInvalid(Guid importJobId, int rowNumber, string errors) =>
        new()
        {
            ImportJobId = importJobId,
            RowNumber = rowNumber,
            Errors = errors,
            Excluded = true
        };

    /// <summary>Assigns a category taken over from an earlier correction or from a rule.</summary>
    /// <param name="categoryId">The category.</param>
    /// <param name="source">How the category was found.</param>
    public void ProposeCategory(Guid categoryId, CategorySource source)
    {
        CategoryId = categoryId;
        CategorySource = source;
    }

    /// <summary>Sets or clears the category as chosen by the user during the review.</summary>
    /// <param name="categoryId">The category, or <see langword="null" />.</param>
    public void ChooseCategory(Guid? categoryId)
    {
        CategoryId = categoryId;
        CategorySource = categoryId is null ? null : Shared.CategorySource.Manual;
    }

    /// <summary>Lets a card statement offset its separately imported purchases, or count as an expense again.</summary>
    /// <param name="countsAsOffset">Whether the statement only offsets other bookings.</param>
    public void SetCountsAsOffset(bool countsAsOffset) => CountsAsOffset = countsAsOffset && IsCardSettlement;

    /// <summary>Keeps the row from being sent to the AI, or allows it again.</summary>
    /// <param name="excluded">Whether the row stays on the server.</param>
    public void SetAiExcluded(bool excluded) => AiExcluded = excluded;

    /// <summary>Includes or excludes the row. Rows with errors stay excluded.</summary>
    /// <param name="excluded">Whether the row is excluded.</param>
    public void SetExcluded(bool excluded) => Excluded = excluded || !IsValid;
}

/// <summary>
/// The parsed values of a valid import row.
/// </summary>
public sealed record ImportCandidateValues(
    DateTime BookingDate,
    decimal Amount,
    string? Counterparty,
    string? Purpose,
    TransactionStatus Status,
    bool IsMerchantPayment,
    string BookingKey,
    string? CounterpartyKey,
    bool IsCardSettlement = false);
namespace Kijk.Application.Imports.Csv;

/// <summary>
/// Describes how the columns of a bank export map to transaction fields. Only declarative options, never code.
/// Column indexes are 0-based.
/// </summary>
/// <param name="Delimiter">The field delimiter, one character.</param>
/// <param name="Encoding">The text encoding: <c>utf-8</c> or <c>windows-1252</c>.</param>
/// <param name="HeaderRowIndex">The 0-based index of the header among the non-empty records; records above it are metadata and ignored.</param>
/// <param name="DateColumn">The booking date column.</param>
/// <param name="DateFormat">The date format, one of <see cref="CsvImportMapping.DateFormats" />.</param>
/// <param name="AmountColumn">The signed amount column; alternatively use debit and credit columns.</param>
/// <param name="DebitColumn">The column with outgoing amounts, if the export splits them.</param>
/// <param name="CreditColumn">The column with incoming amounts, if the export splits them.</param>
/// <param name="DecimalSeparator">The decimal separator: <c>,</c> or <c>.</c>.</param>
/// <param name="CounterpartyColumn">The payee, or the counterparty of all bookings.</param>
/// <param name="PayerColumn">The payer, used for incoming payments when the export has separate columns.</param>
/// <param name="PurposeColumn">The purpose column.</param>
/// <param name="CounterpartyIbanColumn">The counterparty IBAN column.</param>
/// <param name="CreditorIdColumn">The SEPA creditor id column.</param>
/// <param name="BankReferenceColumn">A unique booking id of the bank, if the export has one.</param>
/// <param name="StatusColumn">A column that marks pending bookings.</param>
/// <param name="BookingTypeColumn">The booking type, e.g. "Lastschrift" or "Überweisung"; marks card payments and direct debits.</param>
public sealed record CsvImportMapping(
    string Delimiter,
    string Encoding,
    int HeaderRowIndex,
    int DateColumn,
    string DateFormat,
    int? AmountColumn,
    int? DebitColumn,
    int? CreditColumn,
    string DecimalSeparator,
    int? CounterpartyColumn,
    int? PayerColumn,
    int? PurposeColumn,
    int? CounterpartyIbanColumn,
    int? CreditorIdColumn,
    int? BankReferenceColumn,
    int? StatusColumn,
    int? BookingTypeColumn = null)
{
    /// <summary>The supported date formats.</summary>
    public static readonly IReadOnlyList<string> DateFormats = ["dd.MM.yyyy", "dd.MM.yy", "yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "d.M.yyyy"];

    /// <summary>The supported encodings.</summary>
    public static readonly IReadOnlyList<string> Encodings = [CsvDecoder.Utf8, CsvDecoder.Windows1252];

    /// <summary>The supported delimiters.</summary>
    public static readonly IReadOnlyList<string> Delimiters = [";", ",", "\t", "|"];

    /// <summary>Gets all mapped column indexes.</summary>
    public IEnumerable<int> MappedColumns =>
        new int?[]
        {
            DateColumn, AmountColumn, DebitColumn, CreditColumn, CounterpartyColumn, PayerColumn, PurposeColumn,
            CounterpartyIbanColumn, CreditorIdColumn, BankReferenceColumn, StatusColumn, BookingTypeColumn
        }.OfType<int>();
}
using System.Text.RegularExpressions;

namespace Kijk.Application.Imports.Csv;

/// <summary>
/// Turns the first rows of a bank export into value patterns for the AI format detection, e.g. <c>-9.999,99</c>,
/// <c>99.99.9999</c>, <c>&lt;IBAN&gt;</c> or <c>&lt;TEXT:23&gt;</c>. Records above the header (account, owner,
/// balance) are never included, and header names are only kept when they look like plain column names.
/// </summary>
public static partial class CsvMasker
{
    /// <summary>The number of rows masked per column.</summary>
    public const int SampleRows = 15;

    private const int MaximumHeaderLength = 40;

    // Booking vocabulary that tells a column's meaning without saying anything about a person.
    private static readonly HashSet<string> Vocabulary = new(StringComparer.OrdinalIgnoreCase)
    {
        "gebucht", "vorgemerkt", "booked", "pending", "lastschrift", "überweisung", "echtzeitüberweisung", "gutschrift",
        "gutschrift echtzeitüberweisung", "kartenzahlung", "dauerauftrag", "gehalt/rente", "abschluss", "entgelt",
        "eingang", "ausgang", "soll", "haben", "s", "h", "debit", "credit", "eur", "usd", "chf", "gbp"
    };

    /// <summary>Masks the header and the first data rows of a table, column by column.</summary>
    /// <param name="table">All records of the file.</param>
    /// <param name="headerRowIndex">The index of the header record.</param>
    /// <returns>One entry per column with its checked header and masked sample values.</returns>
    public static IReadOnlyList<MaskedColumn> Mask(CsvTable table, int headerRowIndex)
    {
        var header = table.Records[headerRowIndex].Fields;
        var rows = table.Records.Skip(headerRowIndex + 1).Take(SampleRows).ToList();
        return header
            .Select((name, column) => new MaskedColumn(
                column,
                MaskHeader(name),
                rows.Select(row => MaskValue(column < row.Fields.Length ? row.Fields[column] : string.Empty)).ToList()))
            .ToList();
    }

    /// <summary>Keeps a header name only if it looks like a plain column name.</summary>
    /// <param name="header">The header field.</param>
    /// <returns>The header, or <c>&lt;TEXT:n&gt;</c>.</returns>
    public static string MaskHeader(string header)
    {
        var value = header.Trim();
        return value.Length <= MaximumHeaderLength && ColumnName().IsMatch(value) && !Iban().IsMatch(value)
            ? value
            : $"<TEXT:{value.Length}>";
    }

    /// <summary>Replaces a value by its pattern.</summary>
    /// <param name="value">The field value.</param>
    /// <returns>The pattern.</returns>
    public static string MaskValue(string value)
    {
        var trimmed = value.Trim();
        if (trimmed.Length == 0)
        {
            return string.Empty;
        }

        if (CreditorId().IsMatch(trimmed))
        {
            return "<CREDITOR-ID>";
        }

        if (Iban().IsMatch(trimmed))
        {
            return "<IBAN>";
        }

        if (Vocabulary.Contains(trimmed))
        {
            return trimmed;
        }

        if (!trimmed.Any(char.IsLetter))
        {
            // Numbers, dates and amounts keep their separators, signs and currency symbols.
            return Digits().Replace(trimmed, "9");
        }

        if (!trimmed.Contains(' ', StringComparison.Ordinal) && trimmed.Any(char.IsDigit))
        {
            // Codes such as creditor ids or references keep their shape, e.g. AA99AAA99999999999.
            return Digits().Replace(Letters().Replace(trimmed, "A"), "9");
        }

        return $"<TEXT:{trimmed.Length}>";
    }

    [GeneratedRegex(@"^\p{L}[\p{L}\p{M} ./()*\-–€%#&+]*$")]
    private static partial Regex ColumnName();

    [GeneratedRegex(@"^[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?$", RegexOptions.IgnoreCase)]
    private static partial Regex Iban();

    // SEPA creditor ids: country, check digits, a three-letter business code such as ZZZ and the national id.
    [GeneratedRegex(@"^[A-Z]{2}\d{2}[A-Z]{3}[A-Z0-9]{3,28}$", RegexOptions.IgnoreCase)]
    private static partial Regex CreditorId();

    [GeneratedRegex(@"\d")]
    private static partial Regex Digits();

    [GeneratedRegex(@"\p{L}")]
    private static partial Regex Letters();
}

/// <summary>
/// A column of a bank export with its checked header and masked sample values.
/// </summary>
/// <param name="Index">The 0-based column index.</param>
/// <param name="Header">The header name, or a placeholder when it did not look like a column name.</param>
/// <param name="Samples">The masked values of the first rows.</param>
public sealed record MaskedColumn(int Index, string Header, IReadOnlyList<string> Samples);
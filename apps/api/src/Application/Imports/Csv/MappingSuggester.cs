using System.Globalization;

namespace Kijk.Application.Imports.Csv;

/// <summary>
/// Suggests a mapping from the column names and the first rows. It only proposes; the user confirms.
/// </summary>
public static class MappingSuggester
{
    private static readonly string[] DateNames = ["buchungsdatum", "buchungstag", "buchung", "datum", "booking date", "transaction date", "date"];
    private static readonly string[] DateExcluded = ["valuta", "wertstellung", "value date"];
    private static readonly string[] AmountNames = ["betrag", "umsatz", "amount"];
    private static readonly string[] AmountExcluded = ["saldo", "balance", "kontostand", "fremdwahrung", "ursprung"];
    private static readonly string[] DebitNames = ["soll", "debit", "ausgang", "lastschrift"];
    private static readonly string[] CreditNames = ["haben", "credit", "eingang", "gutschrift"];
    private static readonly string[] PayeeNames = ["zahlungsempfanger", "empfanger", "begunstigter", "auftraggeber", "payee", "counterparty", "gegenpartei", "name"];
    private static readonly string[] PayerNames = ["zahlungspflichtige", "payer"];
    private static readonly string[] PurposeNames = ["verwendungszweck", "purpose", "beschreibung", "description", "buchungstext", "text"];
    private static readonly string[] IbanNames = ["iban", "kontonummer"];
    private static readonly string[] IbanExcluded = ["auftragskonto", "eigene", "own"];
    private static readonly string[] CreditorNames = ["glaubiger", "creditor"];
    private static readonly string[] ReferenceNames = ["transaktions-id", "transaction id", "buchungs-id"];
    private static readonly string[] StatusNames = ["status"];
    private static readonly string[] BookingTypeNames = ["buchungstext", "buchungsart", "transaction type", "booking type"];

    /// <summary>Suggests a mapping.</summary>
    /// <param name="table">All records of the file.</param>
    /// <param name="delimiter">The detected delimiter.</param>
    /// <param name="encoding">The detected encoding.</param>
    /// <param name="headerRowIndex">The detected header row.</param>
    /// <returns>The suggestion, or <see langword="null" /> when no date or amount column was recognized.</returns>
    public static CsvImportMapping? Suggest(CsvTable table, char delimiter, string encoding, int headerRowIndex)
    {
        if (headerRowIndex < 0 || headerRowIndex >= table.Records.Count)
        {
            return null;
        }

        var headers = table.Records[headerRowIndex].Fields.Select(Normalize).ToList();
        var samples = table.Records.Skip(headerRowIndex + 1).Take(50).ToList();
        var used = new HashSet<int>();

        var date = Find(headers, DateNames, DateExcluded, used);
        var amount = Find(headers, AmountNames, AmountExcluded, used);
        var debit = amount is null ? Find(headers, DebitNames, AmountExcluded, used) : null;
        var credit = amount is null ? Find(headers, CreditNames, AmountExcluded, used) : null;
        if (date is null || amount is null && debit is null && credit is null)
        {
            return null;
        }

        var payer = Find(headers, PayerNames, [], used);
        var payee = Find(headers, PayeeNames, [], used);
        var iban = Find(headers, IbanNames, IbanExcluded, used);
        var creditor = Find(headers, CreditorNames, [], used);
        var reference = Find(headers, ReferenceNames, [], used);
        var status = Find(headers, StatusNames, [], used);
        var purpose = FindPurpose(headers, used);
        var bookingType = Find(headers, BookingTypeNames, [], used);

        var amountValues = samples.Select(record => record.Get(amount ?? debit ?? credit)).OfType<string>().ToList();
        return new CsvImportMapping(
            delimiter.ToString(),
            encoding,
            headerRowIndex,
            date.Value,
            DetectDateFormat(samples.Select(record => record.Get(date)).OfType<string>().ToList()),
            amount,
            debit,
            credit,
            DetectDecimalSeparator(amountValues),
            payee,
            payer,
            purpose,
            iban,
            creditor,
            reference,
            status,
            bookingType);
    }

    /// <summary>Picks the first date format that parses every sample value.</summary>
    /// <param name="values">Sample date values.</param>
    /// <returns>The format.</returns>
    public static string DetectDateFormat(IReadOnlyCollection<string> values) =>
        CsvImportMapping.DateFormats.FirstOrDefault(format =>
            values.Count > 0 && values.All(value => CsvRowParser.ParseDate(value, format) is not null))
        ?? CsvImportMapping.DateFormats[0];

    /// <summary>Detects the decimal separator from sample amounts such as <c>-12,50</c>.</summary>
    /// <param name="values">Sample amount values.</param>
    /// <returns><c>,</c> or <c>.</c>.</returns>
    public static string DetectDecimalSeparator(IEnumerable<string> values)
    {
        var commaDecimals = 0;
        var pointDecimals = 0;
        foreach (var value in values.Select(value => value.Trim().TrimEnd('€', ' ', '-')))
        {
            var lastComma = value.LastIndexOf(',');
            var lastPoint = value.LastIndexOf('.');
            if (lastComma > lastPoint && value.Length - lastComma <= 3)
            {
                commaDecimals++;
            }
            else if (lastPoint > lastComma && value.Length - lastPoint <= 3)
            {
                pointDecimals++;
            }
        }

        return pointDecimals > commaDecimals ? "." : ",";
    }

    private static int? Find(List<string> headers, string[] names, string[] excluded, HashSet<int> used)
    {
        foreach (var name in names)
        {
            for (var index = 0; index < headers.Count; index++)
            {
                var header = headers[index];
                if (!used.Contains(index) && header.Contains(name, StringComparison.Ordinal) && !excluded.Any(header.Contains))
                {
                    used.Add(index);
                    return index;
                }
            }
        }

        return null;
    }

    private static int? FindPurpose(List<string> headers, HashSet<int> used)
    {
        // ING has both "Buchungstext" (the booking type) and "Verwendungszweck"; the latter is the purpose.
        var purpose = Find(headers, ["verwendungszweck", "purpose"], [], used);
        return purpose ?? Find(headers, PurposeNames, [], used);
    }

    private static string Normalize(string header) =>
        header.Trim().ToLower(CultureInfo.InvariantCulture)
            .Replace("ä", "a", StringComparison.Ordinal)
            .Replace("ö", "o", StringComparison.Ordinal)
            .Replace("ü", "u", StringComparison.Ordinal)
            .Replace("ß", "ss", StringComparison.Ordinal);
}
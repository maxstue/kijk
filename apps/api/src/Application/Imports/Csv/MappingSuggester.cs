using System.Globalization;
using System.Text.RegularExpressions;

namespace Kijk.Application.Imports.Csv;

/// <summary>
/// Suggests a mapping from the column names and the first rows. Columns whose names are unknown are recognized by
/// their values: dates, amounts (telling them apart from a running balance), IBANs and free text. It only proposes;
/// the user confirms.
/// </summary>
public static partial class MappingSuggester
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
        var profiles = Enumerable.Range(0, headers.Count).Select(column => ColumnProfile.Of(samples, column)).ToList();

        var date = Find(headers, DateNames, DateExcluded, used) ?? FindByValues(profiles, used, profile => profile.IsDate, headers, DateExcluded);
        var amount = Find(headers, AmountNames, AmountExcluded, used);
        var debit = amount is null ? Find(headers, DebitNames, AmountExcluded, used) : null;
        var credit = amount is null ? Find(headers, CreditNames, AmountExcluded, used) : null;
        if (amount is null && debit is null && credit is null)
        {
            amount = FindAmountByValues(profiles, samples, headers, used);
        }

        if (date is null || amount is null && debit is null && credit is null)
        {
            return null;
        }

        var payer = Find(headers, PayerNames, [], used);
        var payee = Find(headers, PayeeNames, [], used);
        var iban = Find(headers, IbanNames, IbanExcluded, used) ?? FindByValues(profiles, used, profile => profile.IsIban, headers, IbanExcluded);
        var creditor = Find(headers, CreditorNames, [], used);
        var reference = Find(headers, ReferenceNames, [], used);
        var status = Find(headers, StatusNames, [], used);
        var purpose = FindPurpose(headers, used);
        var bookingType = Find(headers, BookingTypeNames, [], used);

        // Free-text columns with unknown names: the longest texts are the purpose, the next varied one the counterparty.
        var texts = profiles
            .Where(profile => !used.Contains(profile.Column) && profile.IsFreeText)
            .OrderByDescending(profile => profile.AverageLength)
            .ToList();
        if (purpose is null && texts.Count > 0)
        {
            purpose = texts[0].Column;
            used.Add(texts[0].Column);
            texts.RemoveAt(0);
        }

        if (payee is null && texts.Count > 0)
        {
            payee = texts[0].Column;
            used.Add(texts[0].Column);
        }

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

    private static int? FindByValues(List<ColumnProfile> profiles, HashSet<int> used, Func<ColumnProfile, bool> matches, List<string> headers, string[] excluded)
    {
        var profile = profiles.FirstOrDefault(item => !used.Contains(item.Column) && matches(item) && !excluded.Any(headers[item.Column].Contains));
        if (profile is null)
        {
            return null;
        }

        used.Add(profile.Column);
        return profile.Column;
    }

    /// <summary>
    /// Picks the signed amount among the numeric columns. A running balance changes from row to row by exactly the
    /// amount, so the column that explains another one's differences is the amount and the other one the balance.
    /// </summary>
    private static int? FindAmountByValues(List<ColumnProfile> profiles, List<CsvRecord> samples, List<string> headers, HashSet<int> used)
    {
        var candidates = profiles
            .Where(profile => !used.Contains(profile.Column) && profile.IsAmount && !AmountExcluded.Any(headers[profile.Column].Contains))
            .ToList();
        if (candidates.Count == 0)
        {
            return null;
        }

        var balances = candidates
            .Where(balance => candidates.Any(amount => amount.Column != balance.Column && IsRunningBalance(samples, balance.Column, amount.Column)))
            .Select(balance => balance.Column)
            .ToHashSet();
        var amount = candidates
            .Where(candidate => !balances.Contains(candidate.Column))
            .OrderByDescending(candidate => candidate.HasNegative)
            .FirstOrDefault();
        if (amount is null)
        {
            return null;
        }

        used.Add(amount.Column);
        return amount.Column;
    }

    private static bool IsRunningBalance(List<CsvRecord> samples, int balanceColumn, int amountColumn)
    {
        var separator = DetectDecimalSeparator(samples.Select(record => record.Get(balanceColumn)).OfType<string>());
        var rows = samples
            .Select(record => (Balance: CsvRowParser.ParseAmount(record.Get(balanceColumn), separator), Amount: CsvRowParser.ParseAmount(record.Get(amountColumn), separator)))
            .Where(row => row.Balance is not null && row.Amount is not null)
            .ToList();
        if (rows.Count < 3)
        {
            return false;
        }

        // Exports list the newest or the oldest booking first; the difference matches the amount of one of the rows.
        var pairs = rows.Zip(rows.Skip(1)).ToList();
        var matches = pairs.Count(pair =>
            pair.First.Balance - pair.Second.Balance == pair.First.Amount
            || pair.Second.Balance - pair.First.Balance == pair.Second.Amount);
        return matches >= pairs.Count * 0.8;
    }

    private static string Normalize(string header) =>
        header.Trim().ToLower(CultureInfo.InvariantCulture)
            .Replace("ä", "a", StringComparison.Ordinal)
            .Replace("ö", "o", StringComparison.Ordinal)
            .Replace("ü", "u", StringComparison.Ordinal)
            .Replace("ß", "ss", StringComparison.Ordinal);

    [GeneratedRegex(@"^[+-]?\d+(?:[.,' ]\d{3})*(?:[.,]\d{1,2})?-?(?:\s?(?:€|EUR))?$", RegexOptions.IgnoreCase, matchTimeoutMilliseconds: 1000)]
    private static partial Regex AmountPattern();

    [GeneratedRegex(@"^[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?$", RegexOptions.IgnoreCase, matchTimeoutMilliseconds: 1000)]
    private static partial Regex IbanPattern();

    /// <summary>What the sample values of a column look like.</summary>
    private sealed record ColumnProfile(int Column, bool IsDate, bool IsAmount, bool HasNegative, bool IsIban, bool IsFreeText, double AverageLength)
    {
        private const double Share = 0.9;

        public static ColumnProfile Of(List<CsvRecord> samples, int column)
        {
            var values = samples.Select(record => record.Get(column)?.Trim()).OfType<string>().Where(value => value.Length > 0).ToList();
            if (values.Count == 0)
            {
                return new ColumnProfile(column, false, false, false, false, false, 0);
            }

            bool Most(Func<string, bool> predicate) => values.Count(predicate) >= values.Count * Share;

            var isDate = CsvImportMapping.DateFormats.Any(format => Most(value => CsvRowParser.ParseDate(value, format) is not null));
            var amounts = values.Where(value => AmountPattern().IsMatch(value)).ToList();
            // Plain integers such as reference numbers are no amounts; amounts have cents or signs somewhere.
            var isAmount = !isDate
                           && amounts.Count >= values.Count * Share
                           && amounts.Any(value => value.Contains('-', StringComparison.Ordinal) || Regex.IsMatch(value, @"[.,]\d{1,2}(?:\D*)$", RegexOptions.None, TimeSpan.FromSeconds(1)));
            var hasNegative = amounts.Any(value => value.StartsWith('-') || value.EndsWith('-'));
            var distinct = values.Distinct(StringComparer.OrdinalIgnoreCase).Count();
            // The own account's IBAN repeats in every row and is no counterparty.
            var isIban = Most(value => IbanPattern().IsMatch(value)) && distinct > 1;
            var hasLetters = Most(value => value.Any(char.IsLetter));
            // Booking types, states and currencies repeat a few values; counterparties and purposes vary.
            var isFreeText = !isDate && !isAmount && !isIban && hasLetters && distinct >= Math.Min(3, values.Count) && distinct >= values.Count * 0.3;
            return new ColumnProfile(column, isDate, isAmount, hasNegative, isIban, isFreeText, values.Average(value => value.Length));
        }
    }
}
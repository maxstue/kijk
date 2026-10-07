using System.Globalization;
using Kijk.Shared;

namespace Kijk.Application.Imports.Csv;

/// <summary>
/// Turns a record of a bank export into transaction values. Errors describe the column, never the content.
/// </summary>
public static class CsvRowParser
{
    private const decimal MaximumAmount = 1_000_000_000m;
    private static readonly string[] PendingMarkers = ["vorgemerkt", "pending", "reserviert", "offen", "nicht gebucht"];
    private static readonly string[] MerchantPaymentMarkers = ["lastschrift", "kartenzahlung", "karte", "card", "debit", "abbuchung", "einzug"];

    /// <summary>Parses a record.</summary>
    /// <param name="record">The record.</param>
    /// <param name="mapping">The confirmed mapping.</param>
    /// <returns>The parsed values and errors.</returns>
    public static ParsedRow Parse(CsvRecord record, CsvImportMapping mapping)
    {
        var errors = new List<string>();
        var date = ParseDate(record.Get(mapping.DateColumn), mapping.DateFormat);
        if (date is null)
        {
            errors.Add($"Invalid or missing date in column {mapping.DateColumn + 1}");
        }

        var amount = ParseAmount(record, mapping, errors);
        var payee = record.Get(mapping.CounterpartyColumn);
        var payer = record.Get(mapping.PayerColumn);
        var counterparty = amount > 0 && payer is not null ? payer : payee ?? payer;
        var creditorId = record.Get(mapping.CreditorIdColumn);

        return new ParsedRow(
            date,
            amount,
            counterparty,
            record.Get(mapping.PurposeColumn),
            record.Get(mapping.CounterpartyIbanColumn),
            creditorId,
            record.Get(mapping.BankReferenceColumn),
            IsPending(record.Get(mapping.StatusColumn)) ? TransactionStatus.Pending : TransactionStatus.Booked,
            // A SEPA creditor id means a direct debit, which people practically never collect.
            creditorId is not null || IsMerchantPayment(record.Get(mapping.BookingTypeColumn)),
            errors);
    }

    /// <summary>Parses a date in the given format.</summary>
    /// <param name="value">The raw value.</param>
    /// <param name="format">One of <see cref="CsvImportMapping.DateFormats" />.</param>
    /// <returns>The date (UTC, midnight), or <see langword="null" />.</returns>
    public static DateTime? ParseDate(string? value, string format) =>
        value is not null && DateTime.TryParseExact(value, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
            ? DateTime.SpecifyKind(date.Date, DateTimeKind.Utc)
            : null;

    /// <summary>Parses an amount such as <c>-1.234,56 €</c> or <c>1234.56-</c>.</summary>
    /// <param name="value">The raw value.</param>
    /// <param name="decimalSeparator"><c>,</c> or <c>.</c>.</param>
    /// <returns>The amount, or <see langword="null" />.</returns>
    public static decimal? ParseAmount(string? value, string decimalSeparator)
    {
        if (value is null)
        {
            return null;
        }

        var cleaned = new string(value.Where(character => char.IsDigit(character) || character is ',' or '.' or '-' or '+').ToArray());
        var negative = cleaned.StartsWith('-') || cleaned.EndsWith('-');
        cleaned = cleaned.Trim('-', '+');
        cleaned = decimalSeparator == ","
            ? cleaned.Replace(".", "", StringComparison.Ordinal).Replace(',', '.')
            : cleaned.Replace(",", "", StringComparison.Ordinal);

        if (cleaned.Length == 0
            || cleaned.Count(character => character == '.') > 1
            || !decimal.TryParse(cleaned, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var amount)
            || amount >= MaximumAmount)
        {
            return null;
        }

        return negative ? -amount : amount;
    }

    private static decimal? ParseAmount(CsvRecord record, CsvImportMapping mapping, List<string> errors)
    {
        if (mapping.AmountColumn is { } amountColumn)
        {
            var amount = ParseAmount(record.Get(amountColumn), mapping.DecimalSeparator);
            if (amount is null)
            {
                errors.Add($"Invalid or missing amount in column {amountColumn + 1}");
            }

            return amount;
        }

        var debit = ParseAmount(record.Get(mapping.DebitColumn), mapping.DecimalSeparator);
        var credit = ParseAmount(record.Get(mapping.CreditColumn), mapping.DecimalSeparator);
        if (debit is null && credit is null)
        {
            errors.Add("Invalid or missing amount in the debit and credit columns");
            return null;
        }

        return Math.Abs(credit ?? 0) - Math.Abs(debit ?? 0);
    }

    private static bool IsMerchantPayment(string? bookingType) =>
        bookingType is not null && MerchantPaymentMarkers.Any(marker => bookingType.Contains(marker, StringComparison.OrdinalIgnoreCase));

    private static bool IsPending(string? status) =>
        status is not null && PendingMarkers.Any(marker => status.Contains(marker, StringComparison.OrdinalIgnoreCase));
}

/// <summary>
/// The values of a parsed record. Fields with identifiers are only used to compute pseudonymous keys.
/// </summary>
public sealed record ParsedRow(
    DateTime? Date,
    decimal? Amount,
    string? Counterparty,
    string? Purpose,
    string? CounterpartyIban,
    string? CreditorId,
    string? BankReference,
    TransactionStatus Status,
    bool IsMerchantPayment,
    IReadOnlyList<string> Errors)
{
    /// <summary>Gets whether the record can become a transaction.</summary>
    public bool IsValid => Errors.Count == 0 && Date is not null && Amount is not null;
}
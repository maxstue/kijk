using System.Globalization;
using Kijk.Application.Imports.Csv;
using Kijk.Application.Shared.Security;
using Kijk.Domain.Services;

namespace Kijk.Application.Imports.Shared;

/// <summary>
/// Computes the pseudonymous keys of the rows of one import. Identical rows are numbered so that legitimate repeated
/// payments keep distinct keys.
/// </summary>
/// <param name="pseudonymizer">The key service.</param>
/// <param name="spaceId">The space.</param>
/// <param name="accountId">The bank account.</param>
public sealed class ImportKeyBuilder(IPseudonymizer pseudonymizer, Guid spaceId, Guid accountId)
{
    private readonly Dictionary<string, int> _occurrences = new(StringComparer.Ordinal);

    /// <summary>Gets the version of the secret key in use.</summary>
    public int KeyVersion => pseudonymizer.KeyVersion;

    /// <summary>Computes the keys of a valid row.</summary>
    /// <param name="row">The parsed row.</param>
    /// <returns>The booking key and the counterparty key, if the row has an IBAN.</returns>
    public (string BookingKey, string? CounterpartyKey) Build(ParsedRow row)
    {
        var iban = NormalizeIban(row.CounterpartyIban);
        var counterpartyKey = iban is null ? null : pseudonymizer.Compute(spaceId, "iban", iban);

        string identity;
        if (row.BankReference is { } reference)
        {
            identity = $"ref|{accountId}|{reference.Trim()}";
        }
        else
        {
            identity = string.Join('|',
                accountId.ToString(),
                row.Date!.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                row.Amount!.Value.ToString("0.00", CultureInfo.InvariantCulture),
                iban ?? MerchantNameNormalizer.Normalize(row.Counterparty) ?? string.Empty,
                Collapse(row.Purpose));
            var occurrence = _occurrences.GetValueOrDefault(identity);
            _occurrences[identity] = occurrence + 1;
            identity = $"{identity}|{occurrence}";
        }

        return (pseudonymizer.Compute(spaceId, "booking", identity), counterpartyKey);
    }

    private static string? NormalizeIban(string? iban)
    {
        var normalized = iban is null ? null : new string(iban.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
        return string.IsNullOrEmpty(normalized) ? null : normalized;
    }

    private static string Collapse(string? value) =>
        value is null ? string.Empty : string.Join(' ', value.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)).ToUpperInvariant();
}
using System.Text.RegularExpressions;

namespace Kijk.Domain.Services;

/// <summary>
/// Removes IBANs, card numbers, reference numbers and e-mail addresses from purpose texts before they are stored.
/// Names are not detected here.
/// </summary>
public static partial class PurposeScrubber
{
    /// <summary>The number of characters kept when a space truncates purposes.</summary>
    public const int TruncatedLength = 40;

    /// <summary>Removes identifiers from a purpose text.</summary>
    /// <param name="purpose">The purpose from the bank export.</param>
    /// <returns>The cleaned purpose, or <see langword="null" /> when nothing remains.</returns>
    public static string? Scrub(string? purpose)
    {
        if (string.IsNullOrWhiteSpace(purpose))
        {
            return null;
        }

        var result = Iban().Replace(purpose, "[IBAN]");
        result = Email().Replace(result, "[EMAIL]");
        result = Reference().Replace(result, "[REF]");
        result = LongNumber().Replace(result, "[NR]");
        result = Whitespace().Replace(result, " ").Trim();
        return result.Length == 0 ? null : result;
    }

    /// <summary>Applies a space's retention to a cleaned purpose.</summary>
    /// <param name="purpose">The cleaned purpose.</param>
    /// <param name="retention">The space's retention.</param>
    /// <returns>The purpose to store.</returns>
    public static string? ApplyRetention(string? purpose, Shared.PurposeRetention retention) => retention switch
    {
        Shared.PurposeRetention.Remove => null,
        Shared.PurposeRetention.Truncate when purpose is { Length: > TruncatedLength } => purpose[..TruncatedLength].TrimEnd() + "…",
        _ => purpose
    };

    // Two letters, two check digits and 11-30 alphanumerics, optionally grouped by spaces.
    [GeneratedRegex(@"\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?\b", RegexOptions.IgnoreCase)]
    private static partial Regex Iban();

    [GeneratedRegex(@"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", RegexOptions.IgnoreCase)]
    private static partial Regex Email();

    // SEPA references such as "EREF: ABC123", "MREF+XYZ", "CRED: DE98ZZZ...".
    [GeneratedRegex(@"\b(?:EREF|MREF|CRED|KREF|PREF|SVWZ|ABWA|ABWE)\s*[:+]\s*\S+", RegexOptions.IgnoreCase)]
    private static partial Regex Reference();

    // Card numbers, phone numbers and other sequences of at least six digits, optionally grouped.
    [GeneratedRegex(@"\d(?:[ \-/]?\d){5,}")]
    private static partial Regex LongNumber();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();
}
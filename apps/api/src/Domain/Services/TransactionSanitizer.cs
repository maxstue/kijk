using System.Text.RegularExpressions;

namespace Kijk.Domain.Services;

/// <summary>
/// Prepares a transaction for the AI categorization in the strict data-sharing mode. Identifiers and the names of
/// private persons are replaced by placeholders; when in doubt, text is replaced instead of sent. The placeholder
/// <see cref="Person" /> exists only for the AI call and is never used as a key for rules.
/// </summary>
public static partial class TransactionSanitizer
{
    /// <summary>The placeholder for the name of a private person.</summary>
    public const string Person = "[PERSON]";

    private static readonly string[] CompanyMarkers =
    [
        "gmbh", "ag", "kg", "ohg", "ug", "se", "ev", "mbh", "co", "inc", "ltd", "llc", "bv", "nv", "sarl", "sa", "eu",
        "stadtwerke", "versicherung", "bank", "sparkasse", "kasse", "verein", "amt", "finanzamt", "gesellschaft", "stiftung"
    ];

    /// <summary>Removes identifiers and names from a transaction.</summary>
    /// <param name="counterparty">The counterparty from the bank export.</param>
    /// <param name="purpose">The cleaned purpose.</param>
    /// <param name="isMerchantPayment">Whether the booking is a card payment or direct debit.</param>
    /// <param name="memberNames">The display names of the space members.</param>
    /// <returns>The text to send, or <see langword="null" /> when nothing useful remains.</returns>
    public static SanitizedTransaction? Sanitize(
        string? counterparty,
        string? purpose,
        bool isMerchantPayment,
        IReadOnlyCollection<string> memberNames)
    {
        var scrubbedPurpose = PurposeScrubber.Scrub(purpose);
        if (scrubbedPurpose is not null)
        {
            scrubbedPurpose = CreditorId().Replace(scrubbedPurpose, "[REF]");
            scrubbedPurpose = Bic().Replace(scrubbedPurpose, "[BIC]");
        }

        var (sanitizedCounterparty, sanitizedPurpose) = ReplacePersons(counterparty, scrubbedPurpose, isMerchantPayment, memberNames);

        // A person alone says nothing about the category.
        if (sanitizedCounterparty is Person && sanitizedPurpose is null)
        {
            return null;
        }

        return sanitizedCounterparty is null && sanitizedPurpose is null ? null : new SanitizedTransaction(sanitizedCounterparty, sanitizedPurpose);
    }

    /// <summary>
    /// Replaces the names of private persons and space members by <see cref="Person" />. The counterparty of a
    /// transfer counts as a private person unless it looks like a company; its name is replaced in the purpose too.
    /// </summary>
    /// <param name="counterparty">The counterparty.</param>
    /// <param name="purpose">The purpose.</param>
    /// <param name="isMerchantPayment">Whether the booking is a card payment or direct debit.</param>
    /// <param name="memberNames">The display names of the space members.</param>
    /// <returns>Counterparty and purpose without names; empty texts become <see langword="null" />.</returns>
    public static (string? Counterparty, string? Purpose) ReplacePersons(
        string? counterparty,
        string? purpose,
        bool isMerchantPayment,
        IReadOnlyCollection<string> memberNames)
    {
        var originalCounterparty = counterparty?.Trim();
        var resultCounterparty = originalCounterparty;
        var resultPurpose = purpose;
        if (!string.IsNullOrEmpty(originalCounterparty) && originalCounterparty != Person && !isMerchantPayment && !LooksLikeCompany(originalCounterparty))
        {
            resultCounterparty = Person;
            if (resultPurpose is not null)
            {
                // The name of the person often repeats in the purpose.
                resultPurpose = Regex.Replace(resultPurpose, Regex.Escape(originalCounterparty), Person, RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1));
            }
        }

        return (Clean(ReplaceNames(resultCounterparty, memberNames)), Clean(ReplaceNames(resultPurpose, memberNames)));
    }

    private static bool LooksLikeCompany(string name)
    {
        // Dots are dropped so that "e.V." or "S.a.r.l." match their marker.
        var words = Words().Matches(name.ToLowerInvariant()).Select(match => match.Value.Replace(".", string.Empty, StringComparison.Ordinal)).ToArray();
        return words.Any(word => Array.IndexOf(CompanyMarkers, word) >= 0)
               || name.Any(char.IsDigit)
               || name.Contains('&', StringComparison.Ordinal);
    }

    private static string? ReplaceNames(string? text, IReadOnlyCollection<string> names)
    {
        if (text is null)
        {
            return null;
        }

        var result = text;
        foreach (var name in names.Select(item => item.Trim()).Where(item => item.Length > 0))
        {
            // The full name as well as each part of it with at least three letters.
            foreach (var part in new[] { name }.Concat(name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Where(item => item.Length >= 3)))
            {
                result = Regex.Replace(result, $@"\b{Regex.Escape(part)}\b", Person, RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1));
            }
        }

        return result;
    }

    private static string? Clean(string? text)
    {
        if (text is null)
        {
            return null;
        }

        var result = Whitespace().Replace(text, " ").Trim();
        return result.Length == 0 ? null : result;
    }

    // SEPA creditor ids such as DE98ZZZ09999999999.
    [GeneratedRegex(@"\b[A-Z]{2}\d{2}[A-Z0-9]{3}[A-Z0-9]{8,}\b", RegexOptions.IgnoreCase)]
    private static partial Regex CreditorId();

    // A BIC only after the keyword, because eight capital letters are often an ordinary word.
    [GeneratedRegex(@"\bBIC\s*[:+]?\s*[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b", RegexOptions.IgnoreCase)]
    private static partial Regex Bic();

    [GeneratedRegex(@"[\p{L}\.]+")]
    private static partial Regex Words();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();
}

/// <summary>The text of a transaction that may be sent to the AI.</summary>
/// <param name="Counterparty">The counterparty, or <see cref="TransactionSanitizer.Person" /> for a private person.</param>
/// <param name="Purpose">The purpose without identifiers and names.</param>
public sealed record SanitizedTransaction(string? Counterparty, string? Purpose);
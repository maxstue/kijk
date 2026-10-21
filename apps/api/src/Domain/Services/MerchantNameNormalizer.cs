using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Kijk.Domain.Services;

/// <summary>
/// Turns merchant names into a stable key for category rules, e.g. "REWE Markt GmbH Filiale 1234" into "rewe".
/// </summary>
public static partial class MerchantNameNormalizer
{
    private static readonly HashSet<string> IgnoredWords = new(StringComparer.Ordinal)
    {
        "gmbh", "mbh", "ag", "se", "kg", "kgaa", "ohg", "ek", "ev", "ug", "co", "und", "inc", "ltd", "llc", "sarl", "bv",
        "markt", "filiale", "fil", "sagt", "danke", "dankt", "store", "shop", "online", "de", "gmbhco", "haftungsbeschraenkt"
    };

    /// <summary>Normalizes a merchant name.</summary>
    /// <param name="name">The counterparty name from the bank export.</param>
    /// <returns>The normalized name, or <see langword="null" /> when nothing meaningful remains.</returns>
    public static string? Normalize(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return null;
        }

        var folded = RemoveDiacritics(name.ToLowerInvariant().Replace("ß", "ss", StringComparison.Ordinal));
        var words = NonLetters().Split(folded)
            .Where(word => word.Length > 1 && !IgnoredWords.Contains(word))
            .ToList();

        return words.Count == 0 ? null : string.Join(' ', words);
    }

    private static string RemoveDiacritics(string value)
    {
        var builder = new StringBuilder(value.Length);
        foreach (var character in value.Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC)
            .Replace("ae", "a", StringComparison.Ordinal)
            .Replace("oe", "o", StringComparison.Ordinal)
            .Replace("ue", "u", StringComparison.Ordinal);
    }

    [GeneratedRegex("[^a-z]+")]
    private static partial Regex NonLetters();
}
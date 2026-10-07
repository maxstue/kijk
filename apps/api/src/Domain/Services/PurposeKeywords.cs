using System.Text.RegularExpressions;

namespace Kijk.Domain.Services;

/// <summary>
/// Extracts the words of a purpose text that can serve as keyword for a category rule, e.g. "miete" from
/// "Miete Oktober 2026". Keyword rules contain nothing about the counterparty.
/// </summary>
public static partial class PurposeKeywords
{
    /// <summary>The minimum keyword length.</summary>
    public const int MinimumLength = 3;

    /// <summary>The maximum keyword length.</summary>
    public const int MaximumLength = 40;

    /// <summary>Normalizes a word: lower case, umlauts folded, letters only.</summary>
    /// <param name="word">The word.</param>
    /// <returns>The keyword, or <see langword="null" /> when the word is too short, too long or not only letters.</returns>
    public static string? Normalize(string? word)
    {
        if (string.IsNullOrWhiteSpace(word))
        {
            return null;
        }

        var folded = word.Trim().ToLowerInvariant()
            .Replace("ä", "a", StringComparison.Ordinal)
            .Replace("ö", "o", StringComparison.Ordinal)
            .Replace("ü", "u", StringComparison.Ordinal)
            .Replace("ß", "ss", StringComparison.Ordinal);
        return Letters().IsMatch(folded) && folded.Length is >= MinimumLength and <= MaximumLength ? folded : null;
    }

    /// <summary>Returns the distinct keywords of a purpose text, skipping numbers and placeholders such as <c>[IBAN]</c>.</summary>
    /// <param name="purpose">The cleaned purpose.</param>
    /// <returns>The keywords in order of appearance.</returns>
    public static IReadOnlyList<string> Words(string? purpose)
    {
        if (string.IsNullOrWhiteSpace(purpose))
        {
            return [];
        }

        var withoutPlaceholders = Placeholder().Replace(purpose, " ");
        return Separators().Split(withoutPlaceholders)
            .Select(Normalize)
            .OfType<string>()
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }

    /// <summary>Returns whether a purpose text contains the keyword as a whole word.</summary>
    /// <param name="purpose">The cleaned purpose.</param>
    /// <param name="keyword">The normalized keyword.</param>
    /// <returns><see langword="true" /> if it does.</returns>
    public static bool Contains(string? purpose, string keyword) => Words(purpose).Contains(keyword, StringComparer.Ordinal);

    [GeneratedRegex(@"\[[A-Z]+\]")]
    private static partial Regex Placeholder();

    [GeneratedRegex(@"[^\p{L}\p{N}]+")]
    private static partial Regex Separators();

    [GeneratedRegex("^[a-z]+$")]
    private static partial Regex Letters();
}
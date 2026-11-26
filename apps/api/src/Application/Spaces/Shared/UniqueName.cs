using System.Globalization;
using Kijk.Domain.Entities;

namespace Kijk.Application.Spaces.Shared;

/// <summary>Parses unique names such as <c>Max#4821</c>, see <see cref="User.UniqueName" />.</summary>
public static class UniqueName
{
    private const int TagDigits = 4;

    /// <summary>Splits a unique name into the name and its number.</summary>
    /// <param name="value">The unique name.</param>
    /// <param name="name">The trimmed name.</param>
    /// <param name="tag">The number.</param>
    /// <returns>Whether the value is a unique name.</returns>
    public static bool TryParse(string? value, out string name, out int tag)
    {
        name = string.Empty;
        tag = 0;
        var trimmed = value?.Trim();
        var separator = trimmed?.LastIndexOf('#') ?? -1;
        if (trimmed is null || separator <= 0 || trimmed.Length - separator - 1 != TagDigits)
        {
            return false;
        }

        var digits = trimmed[(separator + 1)..];
        if (!digits.All(char.IsAsciiDigit) ||
            !int.TryParse(digits, NumberStyles.None, CultureInfo.InvariantCulture, out tag) ||
            tag < User.MinTag)
        {
            return false;
        }

        name = trimmed[..separator].Trim();
        return name.Length > 0;
    }
}
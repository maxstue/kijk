using Kijk.Application.Consumptions.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Consumptions.Import;

/// <summary>
/// Finds the resource of an imported row by name and, when names are ambiguous, by unit symbol.
/// </summary>
public static class ResourceMatcher
{
    /// <summary>Matches a resource case-insensitively.</summary>
    /// <param name="resources">The resources available in the active space, with their units.</param>
    /// <param name="name">The resource name of the row.</param>
    /// <param name="unit">The unit symbol of the row, or <see langword="null" /> when the file has none.</param>
    /// <returns>The single matching resource, or a validation error that explains why there is none.</returns>
    public static Result<Resource> Match(IEnumerable<Resource> resources, string name, string? unit)
    {
        var matches = resources
            .Where(item => string.Equals(item.Name, name, StringComparison.OrdinalIgnoreCase))
            .Where(item => unit is null || string.Equals(item.Unit.Symbol, unit, StringComparison.OrdinalIgnoreCase))
            .Take(2)
            .ToList();

        return matches.Count switch
        {
            1 => matches[0],
            0 when unit is null => Error.Validation($"Resource '{name}' is not available in this space"),
            0 => Error.Validation($"Resource '{name}' with unit '{unit}' is not available in this space"),
            _ => Error.Validation($"Resource '{name}' exists with several units; add the {ConsumptionCsvColumns.Unit} column")
        };
    }
}
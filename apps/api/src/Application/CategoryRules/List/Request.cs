namespace Kijk.Application.CategoryRules.List;

/// <summary>
/// The columns the category rule list can be sorted by.
/// </summary>
public enum CategoryRuleSort
{
    /// <summary>By the remembered label.</summary>
    Label,
    /// <summary>By category name, then by label.</summary>
    Category
}
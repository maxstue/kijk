using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Categories.Shared;

/// <summary>A category that transactions and budgets can be assigned to.</summary>
/// <param name="Id">The category id.</param>
/// <param name="Name">The display name.</param>
/// <param name="Icon">The Lucide icon name.</param>
/// <param name="Color">The hex color.</param>
/// <param name="Kind">Whether the category groups expenses or income.</param>
/// <param name="CreatorType">Whether it is a system or a custom category.</param>
public sealed record CategoryResponse(Guid Id, string Name, string Icon, string Color, CategoryKind Kind, CreatorType CreatorType);

/// <summary>
/// Defines validation constraints shared by category create and update requests.
/// </summary>
public static class CategoryValidationRules
{
    /// <summary>Minimum allowed category name length.</summary>
    public const int NameMinimumLength = 2;

    /// <summary>Maximum allowed category name length.</summary>
    public const int NameMaximumLength = 50;

    /// <summary>Maximum allowed Lucide icon name length.</summary>
    public const int IconMaximumLength = 50;

    /// <summary>Pattern accepted for Lucide icon names.</summary>
    public const string IconPattern = "^[a-z0-9]+(?:-[a-z0-9]+)*$";

    /// <summary>Pattern accepted for category colors.</summary>
    public const string HexColorPattern = "^#[0-9a-fA-F]{6}$";
}

/// <summary>
/// Maps category entities to API responses and provides category checks used by the Categories feature.
/// </summary>
public static class CategoryHelpers
{
    /// <summary>Maps a category to a response.</summary>
    /// <param name="source">The category.</param>
    /// <returns>The response.</returns>
    public static CategoryResponse ToResponse(this Category source) =>
        new(source.Id, source.Name, source.Icon, source.Color, source.Kind, source.CreatorType);

    /// <summary>
    /// Determines whether a category with the same normalized name exists in the active household or the system catalog.
    /// </summary>
    /// <param name="categories">The categories available to the active household.</param>
    /// <param name="name">The category name.</param>
    /// <param name="excludedCategoryId">An optional category id to exclude.</param>
    /// <param name="cancellationToken">A token used to cancel the operation.</param>
    /// <returns><see langword="true" /> when a conflicting category exists.</returns>
    internal static Task<bool> HasNameConflictAsync(
        IQueryable<Category> categories,
        string name,
        Guid? excludedCategoryId,
        CancellationToken cancellationToken)
    {
        var normalizedName = name.Trim().ToLowerInvariant();
        return categories.AnyAsync(
            category => category.Name.Trim().ToLower() == normalizedName && category.Id != excludedCategoryId,
            cancellationToken);
    }
}
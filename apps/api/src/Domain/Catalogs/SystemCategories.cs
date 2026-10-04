using Kijk.Shared;

namespace Kijk.Domain.Catalogs;

/// <summary>
/// Defines a system category with the fixed identifier used for seeding.
/// </summary>
/// <param name="Id">The stable database identifier.</param>
/// <param name="Name">The display name.</param>
/// <param name="Icon">The Lucide icon name.</param>
/// <param name="Color">The hex color.</param>
/// <param name="Kind">Whether the category groups expenses or income.</param>
public sealed record CategoryDefinition(Guid Id, string Name, string Icon, string Color, CategoryKind Kind);

/// <summary>
/// The default categories every household can use. Households can add their own categories on top.
/// </summary>
public static class SystemCategories
{
    /// <summary>
    /// Gets all system categories with their fixed identifiers.
    /// </summary>
    public static IReadOnlyList<CategoryDefinition> All { get; } =
    [
        new(new("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f01"), "Groceries", "shopping-basket", "#16a34a", CategoryKind.Expense),
        new(new("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f02"), "Housing", "house", "#2563eb", CategoryKind.Expense),
        new(new("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f03"), "Utilities", "zap", "#f59e0b", CategoryKind.Expense),
        new(new("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f04"), "Mobility", "car", "#0891b2", CategoryKind.Expense),
        new(new("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f05"), "Leisure", "party-popper", "#db2777", CategoryKind.Expense),
        new(new("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f06"), "Health", "heart-pulse", "#dc2626", CategoryKind.Expense),
        new(new("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f07"), "Shopping", "shopping-bag", "#9333ea", CategoryKind.Expense),
        new(new("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f08"), "Insurance", "shield", "#475569", CategoryKind.Expense),
        new(new("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f09"), "Other", "circle-ellipsis", "#71717a", CategoryKind.Expense),
        new(new("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f10"), "Income", "wallet", "#059669", CategoryKind.Income)
    ];
}
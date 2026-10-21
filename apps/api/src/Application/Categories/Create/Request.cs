using Kijk.Shared;

namespace Kijk.Application.Categories.Create;

/// <summary>
/// Request for creating a custom category.
/// </summary>
public sealed record CreateCategoryRequest(string Name, string Icon, string Color, CategoryKind Kind);
using Kijk.Shared;

namespace Kijk.Application.Categories.Update;

/// <summary>
/// Request for replacing the editable properties of a custom category.
/// </summary>
public sealed record UpdateCategoryRequest(string Name, string Icon, string Color, CategoryKind Kind);
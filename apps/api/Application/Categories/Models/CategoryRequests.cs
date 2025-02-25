namespace Kijk.Application.Categories.Models;

public record CreateCategoryRequest(string Name, string Color, string Type);

public record UpdateCategoryRequest(string? Name, string? Color, string Type);

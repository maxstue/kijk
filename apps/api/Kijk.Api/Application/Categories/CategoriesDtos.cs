namespace Kijk.Api.Application.Categories;

public record CreateCategoryRequest(string Name, string Color);
public record UpdateCategoryRequest(string? Name, string? Color);

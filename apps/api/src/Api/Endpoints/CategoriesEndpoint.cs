using Kijk.Application.Categories.Endpoints;
using Kijk.Domain.Entities;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoint for categories.
/// </summary>
public static class CategoriesEndpoint
{
    /// <summary>
    /// Maps the endpoints for logic related to entity <see cref="Category"/>.
    /// </summary>
    /// <param name="endpointRouteBuilder"></param>
    /// <returns></returns>
    public static IEndpointRouteBuilder MapCategoriesApi(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/categories")
            .WithTags("Categories");

        group.MapGet("", GetAllCategories.HandleAsync)
            .WithSummary("Retrieves all categories for the current user.");

        group.MapPost("", CreateCategory.HandleAsync)
            .WithSummary("Creates a new category.");

        group.MapPut("/{id:guid}", UpdateCategory.HandleAsync)
            .WithSummary("Updates a category.");

        group.MapDelete("/{id:guid}", DeleteCategory.HandleAsync)
            .WithSummary("Deletes a category.");

        return endpointRouteBuilder;
    }
}
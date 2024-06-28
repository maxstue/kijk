using Kijk.Api.Domain.Entities;
using Kijk.Api.Modules.Categories;

namespace Kijk.Api.Endpoints;

public static class CategoriesEndpoint
{
    /// <summary>
    ///     Maps the endpoints for logic related to entity <see cref="Category"/>.
    /// </summary>
    /// <param name="endpointRouteBuilder"></param>
    /// <returns></returns>
    public static IEndpointRouteBuilder MapCategoriesApi(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/categories")
            .WithTags("Categories");

        group.MapGetAllCategories()
            .MapCreateCategory()
            .MapUpdateCategory()
            .MapDeleteCategory();

        return endpointRouteBuilder;
    }
}

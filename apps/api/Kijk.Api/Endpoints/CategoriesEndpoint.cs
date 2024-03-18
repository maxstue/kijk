using Kijk.Api.Application.Categories;
using Kijk.Api.Common.Filters;
using Kijk.Api.Common.Models;

using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

public static class CategoriesEndpoint
{
    /// <summary>
    ///     Maps the endpoints for the categories.
    /// </summary>
    /// <param name="endpointRouteBuilder"></param>
    /// <returns></returns>
    public static IEndpointRouteBuilder MapCategoriesEndpoints(this IEndpointRouteBuilder endpointRouteBuilder)
    {
        var group = endpointRouteBuilder.MapGroup("/categories")
            .WithGroupName("Categories")
            .WithTags("Categories")
            .WithOpenApi();

        group.MapGet("/", GetAll);
        group.MapPost("", Create).AddEndpointFilter<ValidationFilter<CreateCategoryRequest>>();
        group.MapPut("/{id:guid}", Update);
        group.MapDelete("/{id:guid}", DeleteById);

        return endpointRouteBuilder;
    }

    private static async Task<IResult> GetAll(CategoriesService service, CancellationToken token)
    {
        var result = await service.GetAllAsync(token);
        return result.ToResponse("Successfully loaded");
    }

    private static async Task<IResult> Create(
        CategoriesService service,
        [FromBody] CreateCategoryRequest createCategoryRequest,
        CancellationToken token)
    {
        var result = await service.CreateAsync(createCategoryRequest, token);
        return result.ToResponse("Successfully created", SuccessType.Created);
    }

    private static async Task<IResult> Update(
        CategoriesService service,
        Guid id,
        [FromBody] UpdateCategoryRequest updateCategoryRequest,
        CancellationToken token)
    {
        var result = await service.UpdateAsync(id, updateCategoryRequest, token);
        return result.ToResponse("Successfully updated");
    }

    private static async Task<IResult> DeleteById(CategoriesService service, Guid id, CancellationToken token)
    {
        var result = await service.DeleteAsync(id, token);
        return result.ToResponse("Successfully deleted");
    }
}

using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Categories.Create;
using Kijk.Application.Categories.Delete;
using Kijk.Application.Categories.List;
using Kijk.Application.Categories.Shared;
using Kijk.Application.Categories.Update;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for transaction categories.
/// </summary>
public sealed class CategoriesEndpoints : IEndpointGroup
{
    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapSpaceGroup("categories")
            .WithTags("Categories")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", List).WithName("Categories.List").RequireSpacePermission(SpacePermissions.Finances.View).WithSummary("Gets the categories available to the active space");
        group.MapPost("/", Create).WithName("Categories.Create").RequireSpacePermission(SpacePermissions.Finances.Configure).WithRequestValidation<CreateCategoryRequest>().WithSummary("Creates a custom category");
        group.MapPut("/{id:guid}", Update).WithName("Categories.Update").RequireSpacePermission(SpacePermissions.Finances.Configure).WithRequestValidation<UpdateCategoryRequest>().WithSummary("Updates a custom category");
        group.MapDelete("/{id:guid}", Delete).WithName("Categories.Delete").RequireSpacePermission(SpacePermissions.Finances.Configure).WithSummary("Deletes an unused custom category");

        return builder;
    }

    private static async Task<Results<Ok<List<CategoryResponse>>, ProblemHttpResult>> List(ListHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<CategoryResponse>, ProblemHttpResult>> Create(
        CreateCategoryRequest request,
        CreateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<CategoryResponse>, ProblemHttpResult>> Update(
        Guid id,
        UpdateCategoryRequest request,
        UpdateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}
using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Categories.Create;
using Kijk.Application.Categories.Delete;
using Kijk.Application.Categories.Get;
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
        var group = builder.MapGroup("categories")
            .WithTags("Categories")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("/", GetAll).RequireHouseholdPermission(HouseholdPermissions.Finances.View).WithSummary("Gets the categories available to the active household");
        group.MapPost("/", Create).RequireHouseholdPermission(HouseholdPermissions.Finances.Configure).WithRequestValidation<CreateCategoryRequest>().WithSummary("Creates a custom category");
        group.MapPut("/{id:guid}", Update).RequireHouseholdPermission(HouseholdPermissions.Finances.Configure).WithRequestValidation<UpdateCategoryRequest>().WithSummary("Updates a custom category");
        group.MapDelete("/{id:guid}", Delete).RequireHouseholdPermission(HouseholdPermissions.Finances.Configure).WithSummary("Deletes an unused custom category");

        return builder;
    }

    private static async Task<Results<Ok<List<CategoryResponse>>, ProblemHttpResult>> GetAll(GetCategoriesHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<CategoryResponse>, ProblemHttpResult>> Create(
        CreateCategoryRequest request,
        CreateCategoryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.CreateAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<Ok<CategoryResponse>, ProblemHttpResult>> Update(
        Guid id,
        UpdateCategoryRequest request,
        UpdateCategoryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteCategoryHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.DeleteAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}
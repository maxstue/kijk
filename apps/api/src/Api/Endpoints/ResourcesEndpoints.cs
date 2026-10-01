using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Resources.Create;
using Kijk.Application.Resources.Delete;
using Kijk.Application.Resources.GetAll;
using Kijk.Application.Resources.GetById;
using Kijk.Application.Resources.Shared;
using Kijk.Application.Resources.Update;
using Kijk.Domain.Authorization;
using Kijk.Shared;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for resources.
/// </summary>
public class ResourcesEndpoints : IEndpointGroup
{
    /// <inheritdoc />
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/resources")
            .WithTags("Resources")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("", GetAll)
            .RequireHouseholdPermission(HouseholdPermissions.Resources.View)
            .WithSummary("Gets all resources");

        group.MapGet("/{id:guid}", GetById)
            .RequireHouseholdPermission(HouseholdPermissions.Resources.View)
            .WithName("GetResourceById")
            .WithSummary("Gets a resource type");

        group.MapPost("", Create)
            .RequireHouseholdPermission(HouseholdPermissions.Resources.Configure)
            .WithRequestValidation<CreateResourceRequest>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .WithSummary("Creates a new resource type");

        group.MapPut("/{id:guid}", Update)
            .RequireHouseholdPermission(HouseholdPermissions.Resources.Configure)
            .WithRequestValidation<UpdateResourceRequest>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .WithSummary("Updates a custom resource type");

        group.MapDelete("/{id:guid}", Delete)
            .RequireHouseholdPermission(HouseholdPermissions.Resources.Configure)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .WithSummary("Deletes an unused custom resource type");

        return builder;
    }

    /// <summary>
    /// Gets all resources.
    /// </summary>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<List<ResourceResponse>>, ProblemHttpResult>> GetAll(GetAllResourcesHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Gets a resource type.
    /// </summary>
    /// <param name="id">The resource id.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> GetById(Guid id, GetByIdResourceHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetByIdAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Creates a new resource type.
    /// </summary>
    /// <param name="request">The request body.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<CreatedAtRoute<ResourceResponse>, ProblemHttpResult>> Create(CreateResourceRequest request, CreateResourceHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.CreateAsync(request, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.CreatedAtRoute(result.Value, "GetResourceById", new { id = result.Value.Id });
    }

    /// <summary>
    /// Updates a custom resource type.
    /// </summary>
    /// <param name="id">The resource id.</param>
    /// <param name="request">The request body.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> Update(Guid id, UpdateResourceRequest request, UpdateResourceHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Deletes an unused custom resource type.
    /// </summary>
    /// <param name="id">The resource id.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteResourceHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.DeleteAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}
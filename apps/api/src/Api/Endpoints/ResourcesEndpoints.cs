using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Resources.Create;
using Kijk.Application.Resources.Delete;
using Kijk.Application.Resources.Details;
using Kijk.Application.Resources.List;
using Kijk.Application.Resources.Shared;
using Kijk.Application.Resources.Update;
using Kijk.Application.Shared.Paging;
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
        var group = builder.MapSpaceGroup("resources")
            .WithTags("Resources")
            .RequireAuthorization(AppConstants.Policies.OnboardingCompleted);

        group.MapGet("", List).WithName("Resources.List")
            .RequireSpacePermission(SpacePermissions.Resources.View)
            .WithSummary("Gets the resources of the active space, optionally searched by name or unit, sorted and paged");

        group.MapGet("/{id:guid}", Details).WithName("Resources.Details")
            .RequireSpacePermission(SpacePermissions.Resources.View)

            .WithSummary("Gets a resource type");

        group.MapPost("", Create).WithName("Resources.Create")
            .RequireSpacePermission(SpacePermissions.Resources.Configure)
            .WithRequestValidation<CreateResourceRequest>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .WithSummary("Creates a new resource type");

        group.MapPut("/{id:guid}", Update).WithName("Resources.Update")
            .RequireSpacePermission(SpacePermissions.Resources.Configure)
            .WithRequestValidation<UpdateResourceRequest>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .WithSummary("Updates a custom resource type");

        group.MapDelete("/{id:guid}", Delete).WithName("Resources.Delete")
            .RequireSpacePermission(SpacePermissions.Resources.Configure)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .WithSummary("Deletes an unused custom resource type");

        return builder;
    }

    /// <summary>
    /// Gets the resources, optionally searched, sorted and paged.
    /// </summary>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <param name="search">An optional text the name or unit must contain.</param>
    /// <param name="sort">The column to sort by; by name when omitted.</param>
    /// <param name="descending">Whether to sort in descending order.</param>
    /// <param name="page">The 1-based page; all resources when page and page size are omitted.</param>
    /// <param name="pageSize">The page size.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<PageResponse<ResourceResponse>>, ProblemHttpResult>> List(
        ListHandler handler,
        CancellationToken cancellationToken,
        string? search = null,
        ResourceSort? sort = null,
        bool descending = false,
        int? page = null,
        int? pageSize = null)
    {
        var result = await handler.HandleAsync(new ListRequest<ResourceSort>(search, sort, descending, page, pageSize), cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Gets a resource type.
    /// </summary>
    /// <param name="id">The resource id.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> Details(Guid id, DetailsHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Creates a new resource type.
    /// </summary>
    /// <param name="request">The request body.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<CreatedAtRoute<ResourceResponse>, ProblemHttpResult>> Create(CreateResourceRequest request, CreateHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(request, cancellationToken);
        return result.IsError
            ? TypedResults.Problem(result.Error.ToProblemDetails())
            : TypedResults.CreatedAtRoute(result.Value, "Resources.Details", new { id = result.Value.Id });
    }

    /// <summary>
    /// Updates a custom resource type.
    /// </summary>
    /// <param name="id">The resource id.</param>
    /// <param name="request">The request body.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> Update(Guid id, UpdateResourceRequest request, UpdateHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Deletes an unused custom resource type.
    /// </summary>
    /// <param name="id">The resource id.</param>
    /// <param name="handler">The handler.</param>
    /// <param name="cancellationToken">The request cancellation token.</param>
    /// <returns>The result, or a problem response on failure.</returns>
    private static async Task<Results<NoContent, ProblemHttpResult>> Delete(Guid id, DeleteHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.NoContent();
    }
}
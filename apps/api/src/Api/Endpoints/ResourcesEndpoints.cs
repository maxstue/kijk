using Kijk.Api.Extensions;
using Kijk.Api.Models;
using Kijk.Application.Resources;
using Kijk.Application.Resources.Shared;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kijk.Api.Endpoints;

/// <summary>
/// Endpoints for resources.
/// </summary>
public class ResourcesEndpoints : IEndpointGroup
{
    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/resources")
            .WithTags("Resources");

        group.MapGet("", GetAll)
            .WithSummary("Gets all resources");

        group.MapGet("/{id:guid}", GetById)
            .WithSummary("Gets an resource usage");

        group.MapPost("", Create)
            .WithRequestValidation<CreateResourceRequest>()
            .WithSummary("Creates a new resource type");

        group.MapPut("/{id:guid}", Update)
            .WithSummary("Updates an resource usage");

        group.MapDelete("/{id:guid}", Delete)
            .WithSummary("Deletes an resource usage");

        return builder;
    }

    /// <summary>
    /// Gets all resources.
    /// </summary>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<List<ResourceResponse>>, ProblemHttpResult>> GetAll(GetAllResourcesHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetAllAsync(cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Gets an resource usage.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> GetById(Guid id, GetByIdResourceHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.GetByIdAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Creates a new resource type.
    /// </summary>
    /// <param name="request"></param>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> Create(CreateResourceRequest request, CreateResourceHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.CreateAsync(request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Updates an resource usage.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="request"></param>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> Update(Guid id, UpdateResourceRequest request, UpdateResourceHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.UpdateAsync(id, request, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }

    /// <summary>
    /// Deletes an resource usage.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="handler"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private static async Task<Results<Ok<bool>, ProblemHttpResult>> Delete(Guid id, DeleteResourceHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.DeleteAsync(id, cancellationToken);
        return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
    }
}
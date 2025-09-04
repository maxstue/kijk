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

        group.MapGet("", async Task<Results<Ok<List<ResourceResponse>>, ProblemHttpResult>> (GetAllResourcesHandler handler, CancellationToken cancellationToken) =>
            {
                var result = await handler.GetAllAsync(cancellationToken);
                return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
            })
            .WithSummary("Gets all resources");

        group.MapGet("/{id:guid}", async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> (Guid id, GetByIdResourceHandler handler, CancellationToken cancellationToken) =>
            {
                var result = await handler.GetByIdAsync(id, cancellationToken);
                return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
            })
            .WithSummary("Gets an resource usage");

        group.MapPost("", async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> ([FromBody] CreateResourceRequest request, CreateResourceHandler handler, CancellationToken cancellationToken) =>
            {
                var result = await handler.CreateAsync(request, cancellationToken);
                return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
            })
            .WithRequestValidation<CreateResourceRequest>()
            .WithSummary("Creates a new resource type");

        group.MapPut("/{id:guid}",
                async Task<Results<Ok<ResourceResponse>, ProblemHttpResult>> (Guid id, [FromBody] UpdateResourceRequest request, UpdateResourceHandler handler, CancellationToken cancellationToken) =>
                {
                    var result = await handler.HandleAsync(id, request, cancellationToken);
                    return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
                })
            .WithSummary("Updates an resource usage");

        group.MapDelete("/{id:guid}", async Task<Results<Ok<bool>, ProblemHttpResult>> (Guid id, DeleteResourceHandler handler, CancellationToken cancellationToken) =>
            {
                var result = await handler.DeleteAsync(id, cancellationToken);
                return result.IsError ? TypedResults.Problem(result.Error.ToProblemDetails()) : TypedResults.Ok(result.Value);
            })
            .WithSummary("Deletes an resource usage");

        return builder;
    }
}
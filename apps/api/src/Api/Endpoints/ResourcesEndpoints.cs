using Kijk.Api.Extensions;
using Kijk.Application.Resources;
using Kijk.Shared;

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

        group.MapGet("", GetAllResourcesHandler.HandleAsync)
            .WithSummary("Gets all resources");

        group.MapGet("/{id:guid}", GetByIdResourceHandler.HandleAsync)
            .WithSummary("Gets an resource usage");

        group.MapPost("", CreateResourceHandler.HandleAsync)
            .WithRequestValidation<CreateResourceRequest>()
            .WithSummary("Creates a new resource type");

        group.MapPut("/{id:guid}", UpdateResourceHandler.HandleAsync)
            .WithSummary("Updates an resource usage");

        group.MapDelete("/{id:guid}", DeleteResourceHandler.HandleAsync)
            .WithSummary("Deletes an resource usage");

        return builder;
    }
}
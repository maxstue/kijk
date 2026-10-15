using Kijk.Api.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Kijk.Api.Extensions.OpenApi;

/// <summary>
/// Documents the space id of space groups. The handlers read the space from the current user, so the route parameter
/// is not bound by them and would otherwise be missing from the operation.
/// </summary>
public class SpaceRouteParameterTransformer : IOpenApiOperationTransformer
{
    /// <inheritdoc />
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        if (context.Description.ActionDescriptor.EndpointMetadata.OfType<SpaceScopedMetadata>().FirstOrDefault() is not { } metadata)
        {
            return Task.CompletedTask;
        }

        operation.Parameters ??= [];
        if (operation.Parameters.All(parameter => parameter.Name != metadata.RouteParameter))
        {
            operation.Parameters.Insert(0, new OpenApiParameter
            {
                Name = metadata.RouteParameter,
                In = ParameterLocation.Path,
                Required = true,
                Description = "The space the request works on.",
                Schema = new OpenApiSchema { Type = JsonSchemaType.String, Format = "uuid" }
            });
        }

        return Task.CompletedTask;
    }
}
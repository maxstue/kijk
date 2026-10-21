using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Kijk.Api.Extensions.OpenApi;

/// <summary>
/// Adds the problem-details responses every operation can return (401, 403, 429, 500). Endpoint-specific errors such as
/// 400, 404 or 409 are declared by the endpoints themselves.
/// </summary>
public class OperationResponseTransformer : IOpenApiOperationTransformer
{
    /// <inheritdoc />
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        operation.Responses ??= new();
        operation.Responses["401"] = new OpenApiResponseReference("401");
        operation.Responses["403"] = new OpenApiResponseReference("403");
        operation.Responses["429"] = new OpenApiResponseReference("429");
        operation.Responses["500"] = new OpenApiResponseReference("500");

        return Task.CompletedTask;
    }
}
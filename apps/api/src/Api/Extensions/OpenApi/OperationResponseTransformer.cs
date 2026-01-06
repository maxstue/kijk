using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Kijk.Api.Extensions.OpenApi;

public class OperationResponseTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        operation.Responses ??= new();
        operation.Responses["400"] = new OpenApiResponseReference("400");
        operation.Responses["401"] = new OpenApiResponseReference("401");
        operation.Responses["403"] = new OpenApiResponseReference("403");
        operation.Responses["404"] = new OpenApiResponseReference("404");
        operation.Responses["429"] = new OpenApiResponseReference("429");
        operation.Responses["500"] = new OpenApiResponseReference("500");

        return Task.CompletedTask;
    }
}
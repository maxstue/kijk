using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Models;

namespace Kijk.Api.Extensions.OpenApi;

public class OperationResponseTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        operation.Responses["400"] = new() { Reference = new() { Type = ReferenceType.Response, Id = "400" } };
        operation.Responses["401"] = new() { Reference = new() { Type = ReferenceType.Response, Id = "401" } };
        operation.Responses["403"] = new() { Reference = new() { Type = ReferenceType.Response, Id = "403" } };
        operation.Responses["404"] = new() { Reference = new() { Type = ReferenceType.Response, Id = "404" } };
        operation.Responses["429"] = new() { Reference = new() { Type = ReferenceType.Response, Id = "429" } };
        operation.Responses["500"] = new() { Reference = new() { Type = ReferenceType.Response, Id = "500" } };

        return Task.CompletedTask;
    }
}
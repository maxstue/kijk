using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Kijk.Api.Extensions.OpenApi;

/// <summary>
/// This transformer adds the base information to the OpenApi document.
/// </summary>
public sealed class InformationTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        document.Info = new() { Version = "v1", Title = "Kijk API", Description = "Kijk API to manage your houses" };
        return Task.CompletedTask;
    }
}
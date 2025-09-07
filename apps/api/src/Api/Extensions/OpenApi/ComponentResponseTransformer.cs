using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;

namespace Kijk.Api.Extensions.OpenApi;

public class ComponentResponseTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        document.Components ??= new();
        document.Components.Schemas["String"] = new()
        {
            Type = "string",
        };

        document.Components.Schemas["Int"] = new()
        {
            Type = "integer",
            Format = "int32",
        };

        document.Components.Schemas["DateTime"] = new()
        {
            Type = "string",
            Format = "date-time",
        };

        document.Components.Schemas["ErrorType"] = new()
        {
            Enum =
            [
                new OpenApiString("Authentication"),
                new OpenApiString("Authorization"),
                new OpenApiString("NotFound"),
                new OpenApiString("Conflict"),
                new OpenApiString("Unexpected"),
            ],
            Default = new OpenApiString("<Type placeholder>")
        };

        document.Components.Schemas["Error"] = new()
        {
            Type = "object",
            Properties = new Dictionary<string, OpenApiSchema>
            {
                ["code"] = CreateSchemaRef("String"),
                ["description"] = CreateSchemaRef("String"),
                ["type"] = CreateSchemaRef("ErrorType")
            }
        };

        document.Components.Schemas["Problem"] = new()
        {
            Type = "object",
            Properties = new Dictionary<string, OpenApiSchema>
            {
                ["type"] = CreateSchemaRef("String"),
                ["title"] = CreateSchemaRef("String"),
                ["status"] = CreateSchemaRef("Int"),
                ["detail"] = CreateSchemaRef("String"),
                ["instance"] = CreateSchemaRef("String"),
                ["traceId"] = CreateSchemaRef("String"),
                ["timestamp"] = CreateSchemaRef("DateTime"),
                ["errors"] = new()
                {
                    Type = "object",
                    AdditionalPropertiesAllowed = true,
                    Properties = new Dictionary<string, OpenApiSchema>()
                },
                ["extensions"] = new()
                {
                    Type = "object",
                    AdditionalPropertiesAllowed = true,
                    Properties = new Dictionary<string, OpenApiSchema>
                    {
                        ["errorType"] = CreateSchemaRef("String"),
                    }
                },
            }
        };

        document.Components.Responses["400"] = new()
        {
            Description = "Bad request.",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = CreateSchemaRef("Problem") } }
            }
        };

        document.Components.Responses["401"] = new()
        {
            Description = "Unauthenticated request.",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = CreateSchemaRef("Problem") } }
            }
        };

        document.Components.Responses["403"] = new()
        {
            Description = "Unauthorized request.",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = CreateSchemaRef("Problem") } }
            }
        };

        document.Components.Responses["404"] = new()
        {
            Description = "Notfound request.",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = CreateSchemaRef("Problem") } }
            }
        };

        document.Components.Responses["429"] = new()
        {
            Description = "Too many requests.",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = CreateSchemaRef("Problem") } }
            }
        };

        document.Components.Responses["500"] = new()
        {
            Description = "Internal server error.",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = CreateSchemaRef("Problem") } }
            }
        };

        return Task.CompletedTask;
    }

    private static OpenApiSchema CreateSchemaRef(string schemaId) => new()
    {
        Reference = new()
        {
            Type = ReferenceType.Schema,
            Id = schemaId
        }
    };
}
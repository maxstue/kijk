using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Kijk.Api.Extensions.OpenApi;

public class ComponentResponseTransformer : IOpenApiDocumentTransformer
{
    public async Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        // TODO can this bis simplified, maybe by reusing existing schemas or does dotnet nowadys provide these by default?
        // https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/customize-openapi?view=aspnetcore-10.0#support-for-generating-openapischemas-in-transformers
        document.Components ??= new();
        document.Components.Schemas ??= new Dictionary<string, IOpenApiSchema>();

        var problemSchema = await CreateProblemDetailsSchema(context, cancellationToken);
        document.Components.Schemas["Problem"] = problemSchema;

        document.Components.Responses ??= new Dictionary<string, IOpenApiResponse>();
        document.Components.Responses.Add("400", new OpenApiResponse
        {
            Description = "Bad request.",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = new OpenApiSchemaReference("Problem", document) } }
            }
        });

        document.Components.Responses.Add("401", new OpenApiResponse
        {
            Description = "Unauthenticated request.",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = new OpenApiSchemaReference("Problem", document) } }
            }
        });

        document.Components.Responses.Add("403", new OpenApiResponse
        {
            Description = "Unauthorized request.",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = new OpenApiSchemaReference("Problem", document) } }
            }
        });

        document.Components.Responses.Add("404", new OpenApiResponse
        {
            Description = "Notfound request.",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = new OpenApiSchemaReference("Problem", document) } }
            }
        });

        document.Components.Responses.Add("429", new OpenApiResponse
        {
            Description = "Too many requests.",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = new OpenApiSchemaReference("Problem", document) } }
            }
        });

        document.Components.Responses.Add("500", new OpenApiResponse
        {
            Description = "Internal server error.",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = new OpenApiSchemaReference("Problem", document) } }
            }
        });
    }

    private static async Task<OpenApiSchema> CreateProblemDetailsSchema(OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        var problemSchema = await context.GetOrCreateSchemaAsync(typeof(ProblemDetails), null, cancellationToken);
        problemSchema.AdditionalPropertiesAllowed = true;
        problemSchema.Properties ??= new Dictionary<string, IOpenApiSchema>()
        {
            ["errorType"] = new OpenApiSchema
            {
                Enum =
                [
                    "Authentication",
                    "Authorization",
                    "NotFound",
                    "Conflict",
                    "Unexpected",
                ],
                Default = "<Type placeholder>"
            },
            ["timestamp"] = new OpenApiSchema
            {
                Type = JsonSchemaType.String,
                Format = "date-time",
                Description = "The date and time when the error occurred."
            },
            ["correlationId"] = new OpenApiSchema
            {
                Type = JsonSchemaType.String,
                Description = "The correlation ID for the request."
            }
        };
        return problemSchema;
    }
}
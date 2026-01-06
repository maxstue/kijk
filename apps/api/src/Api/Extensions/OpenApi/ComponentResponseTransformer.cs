using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Kijk.Api.Extensions.OpenApi;

public class ComponentResponseTransformer : IOpenApiDocumentTransformer
{
    public async Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        document.Components ??= new();
        document.Components.Schemas ??= new Dictionary<string, IOpenApiSchema>();

        var problemSchema = await CreateProblemDetailsSchema(context, cancellationToken);
        document.Components.Schemas["Problem"] = problemSchema;

        document.Components.Responses ??= new Dictionary<string, IOpenApiResponse>();
        document.Components.Responses.Add("400", CreateErrorResponse("Bad Request", document));
        document.Components.Responses.Add("401", CreateErrorResponse("Unauthenticated", document));
        document.Components.Responses.Add("403", CreateErrorResponse("Unauthorized", document));
        document.Components.Responses.Add("404", CreateErrorResponse("Not found", document));
        document.Components.Responses.Add("429", CreateErrorResponse("Too many requests", document));
        document.Components.Responses.Add("500", CreateErrorResponse("Internal server error", document));
    }

    private static OpenApiResponse CreateErrorResponse(string description, OpenApiDocument document) =>
        new()
        {
            Description = description,
            Content = new Dictionary<string, OpenApiMediaType>
            {
                { "application/problem+json", new() { Schema = new OpenApiSchemaReference("Problem", document) } }
            }
        };

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
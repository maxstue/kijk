using Kijk.Api.Common.Options;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Models;

namespace Kijk.Api.Common.Extensions;

/// <summary>
/// Schema transformer for the OpenApi document to add the Oauth2 (Bearer) authentication.
/// </summary>
/// <param name="authenticationSchemeProvider"></param>
/// <param name="configuration"></param>
public sealed class BearerAuthSchemeTransformer(IAuthenticationSchemeProvider authenticationSchemeProvider, IConfiguration configuration)
    : IOpenApiDocumentTransformer
{
    public async Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        var appSettings = configuration.GetSection(AuthOptions.SectionName).Get<AuthOptions>();

        if (appSettings is null)
        {
            throw new Exception($"Keine AuthOptions gefunden, {appSettings}");
        }

        var authenticationSchemes = await authenticationSchemeProvider.GetAllSchemesAsync();
        if (authenticationSchemes.Any(authScheme => authScheme.Name == "Bearer"))
        {
            var requirements = new Dictionary<string, OpenApiSecurityScheme>
            {
                ["Bearer"] = new()
                {
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    In = ParameterLocation.Header,
                    BearerFormat = "Json Web Token",
                    Description = "JWT Authorization header using the Bearer scheme."
                }
            };
            document.Components ??= new OpenApiComponents();
            document.Components.SecuritySchemes = requirements;
            // Apply it as a requirement for all operations
            foreach (var operation in document.Paths.Values.SelectMany(path => path.Operations))
            {
                operation.Value.Security.Add(new OpenApiSecurityRequirement
                {
                    [new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = "Bearer", Type = ReferenceType.SecurityScheme } }] =
                        Array.Empty<string>()
                });
            }
        }
    }
}
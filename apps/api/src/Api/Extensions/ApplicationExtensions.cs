using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Events;

namespace Kijk.Api.Extensions;

public static class ApplicationExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder applicationBuilder)
    {
        applicationBuilder.UseSerilogRequestLogging(options => options.GetLevel = (ctx, _, ex) =>
        {
            if (ex == null && ctx.Response.StatusCode <= 499)
            {
                return LogEventLevel.Information;
            }

            if (ctx.Request.Path.StartsWithSegments("/api/health") && ex is OperationCanceledException)
            {
                // If the incoming HTTP request for a healthcheck is aborted, don't log the resultant OperationCanceledException
                // as an error. beware that the ASP.NET DefaultHealthCheckService ensures that if the exception occurs
                // within the healthcheck implementation (and the request wasn't aborted) a failed healthcheck is logged
                // see https://github.com/dotnet/aspnetcore/blob/ce9e1ae5500c3f0c4b9bd682fd464b3493e48e61/src/HealthChecks/HealthChecks/src/DefaultHealthCheckService.cs#L121
                return LogEventLevel.Information;
            }

            return LogEventLevel.Error;
        });

        return applicationBuilder;
    }

    public static IApplicationBuilder MapOpenApi(this IApplicationBuilder applicationBuilder)
    {
        var app = (WebApplication)applicationBuilder;

        app.MapOpenApi("{documentName}.json");
        app.MapScalarApiReference("", options =>
        {
            options.WithTitle("Kijk Api")
                .WithFavicon("favicon.svg")
                .WithOpenApiRoutePattern("/{documentName}.json")
                .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
                .AddPreferredSecuritySchemes("Bearer")
                .AddHttpAuthentication("Bearer", schemeOpt => schemeOpt.Token = app.Configuration["OpenApi:Token"]);
        });
        if (app.Environment.IsDevelopment())
        {
            app.Map("/", () => Results.Redirect("openapi"));
        }

        return applicationBuilder;
    }

    /// <summary>
    /// Maps the health check endpoint to the application.
    /// </summary>
    /// <param name="app"></param>
    /// <returns></returns>
    public static WebApplication MapHealthCheck(this WebApplication app)
    {
        app.MapHealthChecks("/health", new HealthCheckOptions { ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse });

        return app;
    }
}
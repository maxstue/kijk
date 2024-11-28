using HealthChecks.UI.Client;

using Kijk.Api.Common.Models;
using Kijk.Api.Endpoints;
using Kijk.Api.Persistence;

using Microsoft.AspNetCore.Diagnostics.HealthChecks;

using Swashbuckle.AspNetCore.SwaggerUI;

namespace Kijk.Api.Common.Extensions;

public static class ApplicationExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder applicationBuilder)
    {
        applicationBuilder.UseSerilogRequestLogging(
            options => options.GetLevel = new Func<HttpContext, double, Exception?, LogEventLevel>((ctx, _, ex) =>
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
            }));

        return applicationBuilder;
    }

    public static IApplicationBuilder UseOpenApi(this IApplicationBuilder applicationBuilder)
    {
        applicationBuilder.UseSwaggerUI(
            c =>
            {
                c.SwaggerEndpoint("/api/openapi.json", "Kijk Api v1.0");
                c.DefaultModelsExpandDepth(0);
                c.DefaultModelExpandDepth(0);
                c.DocExpansion(DocExpansion.None);
                c.DocumentTitle = "SwaggerUI - Kijk Api";
                c.RoutePrefix = "api/swagger";
            });
        return applicationBuilder;
    }

    public static IApplicationBuilder ApplyInitialData(this IApplicationBuilder applicationBuilder)
    {
        using var scope = applicationBuilder.ApplicationServices.CreateScope();
        using var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        AppDbInitializer.InitDb(dbContext);

        return applicationBuilder;
    }

    public static WebApplication MapApiEndpoints(this WebApplication app)
    {
        var apiGroup = app.MapGroup("/api")
            .RequireAuthorization(AppConstants.Policies.All)
            .RequirePerUserRateLimit();

        apiGroup.MapTransactionsEndpoints();
        apiGroup.MapUsersApi();
        apiGroup.MapCategoriesApi();

        return app;
    }

    public static IApplicationBuilder MapHealthCheck(this IApplicationBuilder applicationBuilder)
    {
        var app = (IEndpointRouteBuilder)applicationBuilder;
        app.MapHealthChecks("/health", new HealthCheckOptions { ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse });

        return applicationBuilder;
    }
}
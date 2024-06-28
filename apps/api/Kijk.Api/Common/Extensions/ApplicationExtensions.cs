using HealthChecks.UI.Client;
using Kijk.Api.Common.Models;
using Kijk.Api.Endpoints;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

namespace Kijk.Api.Common.Extensions;

public static class ApplicationExtensions
{
    public static IApplicationBuilder UseCustomOpenApi(this IApplicationBuilder applicationBuilder)
    {
        applicationBuilder.UseSwagger(
            c =>
            {
                c.RouteTemplate = "api/swagger/{documentName}/swagger.json";
            });
        applicationBuilder.UseSwaggerUI(
            c =>
            {
                // c.UseRequestInterceptor(
                //     "(req) => { req.headers['Authorization'] = 'Bearer ' + window?.swaggerUIRedirectOauth2?.auth?.token?.access_token; return req; }");
                c.DefaultModelsExpandDepth(0);
                c.DefaultModelExpandDepth(0);
                c.SwaggerEndpoint("v1/swagger.json", "Kijk Api v1.00");
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

    public static IApplicationBuilder ApplyMigrations(this IApplicationBuilder applicationBuilder)
    {
        using var scope = applicationBuilder.ApplicationServices.CreateScope();
        using var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        dbContext.Database.MigrateAsync();
        Log.ForContext(typeof(AppDbInitializer)).Information("Database migrations applied");

        return applicationBuilder;
    }

    public static IApplicationBuilder MapApiEndpoints(this IApplicationBuilder applicationBuilder)
    {
        var app = (WebApplication)applicationBuilder;
        app.Map("/", () => Results.Redirect("api/swagger"));

        var apiGroup = app.MapGroup("/api")
            .RequireAuthorization(AppConstants.Policies.All)
            .WithOpenApi();

        apiGroup.RequirePerUserRateLimit();

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

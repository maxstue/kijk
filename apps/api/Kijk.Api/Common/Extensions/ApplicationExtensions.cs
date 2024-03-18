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
        applicationBuilder.UseOpenApi();
        applicationBuilder.UseSwaggerUi(
            c =>
            {
                c.PersistAuthorization = true;
            });
        return applicationBuilder;
    }

    public static async Task<IApplicationBuilder> UseInitDatabaseAsync(this IApplicationBuilder applicationBuilder, IWebHostEnvironment environment)
    {
        var app = (WebApplication)applicationBuilder;
        using var scope = app.Services.CreateScope();
        await using var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await AppDbInitializer.InitDb(dbContext, environment);

        return app;
    }

    public static IApplicationBuilder MapCustomEndpoints(this IApplicationBuilder applicationBuilder)
    {
        var app = (WebApplication)applicationBuilder;
        app.Map("/", () => Results.Redirect("/swagger"));

        var apiGroup = app.MapGroup("/api")
            .RequireAuthorization(AppConstants.Policies.All);

        apiGroup.RequirePerUserRateLimit();

        apiGroup.MapTransactionsEndpoints();
        apiGroup.MapUsersEndpoints();
        apiGroup.MapCategoriesEndpoints();

        return app;
    }

    public static IApplicationBuilder MapHealthCheck(this IApplicationBuilder applicationBuilder)
    {
        var app = (IEndpointRouteBuilder)applicationBuilder;
        app.MapHealthChecks("/health", new HealthCheckOptions { ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse });

        return applicationBuilder;
    }
}

using Kijk.Api.Common.interfaces;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Common.Extensions;

public static class WebApplicationExtension
{
    public static WebApplication UseCustomOpenApi(this WebApplication app)
    {
        var appSettings = app.Configuration.Get<AppSettings>();

        app.UseSwagger(
            c =>
            {
                c.RouteTemplate = "swagger/{documentName}/swagger.json";
            });
        app.UseSwaggerUI(
            c =>
            {
                c.UseRequestInterceptor(
                    "(req) => { req.headers['Authorization'] = 'Bearer ' + window?.swaggerUIRedirectOauth2?.auth?.token?.access_token; return req; }");

                c.OAuthClientId(appSettings?.AzureAd.ClientId);
                c.OAuthUsePkce();
                c.OAuthScopes(appSettings?.AzureAd.Scopes);
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Kijk Api v1.00");
            });
        app.UseReDoc();

        return app;
    }

    public static async Task<WebApplication> UseInitDb(this WebApplication app)
    {
        var connectionString = app.Configuration.GetConnectionString("DefaultConnection");
        Log.ForContext(typeof(WebApplicationExtension)).Information(
            "Ensuring database exists and is up to date at connection string '{ConnectionString}'",
            connectionString);

        // Migrate latest database changes during startup
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await dbContext.Database.MigrateAsync();

        return app;
    }

    public static WebApplication MapCustomEndpoints(this WebApplication app)
    {
        app.Map("/", () => Results.Redirect("/swagger"));
        app.MapApiGroupEndpoints();
        return app;
    }

    private static WebApplication MapApiGroupEndpoints(this WebApplication app)
    {
        var registeredModules = DiscoverEndpoints();
        var apiGroup = app.MapGroup("/api");
            // .RequireAuthorization(AppConstants.Policies.All);

        // apiGroup.WithOpenApi(); // disabled until this is fixed "https://github.com/domaindrivendev/Swashbuckle.AspNetCore/issues/2625"
        apiGroup.RequirePerUserRateLimit();

        foreach (var endpointModule in registeredModules)
        {
            endpointModule.MapEndpoints(apiGroup);
        }

        return app;
    }

    private static IEnumerable<IEndpoint> DiscoverEndpoints()
    {
        return typeof(IEndpoint).Assembly
            .GetTypes()
            .Where(p => p.IsClass && p.IsAssignableTo(typeof(IEndpoint)))
            .Select(Activator.CreateInstance)
            .Cast<IEndpoint>();
    }
}

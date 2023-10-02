using Kijk.Api.Common.Models;
using Kijk.Api.Endpoints;
using Kijk.Api.Persistence;

using NSwag.AspNetCore;

namespace Kijk.Api.Common.Extensions;

public static class WebApplicationExtension
{
    public static WebApplication UseCustomOpenApi(this WebApplication app)
    {
        var appSettings = app.Configuration.Get<AppSettings>();

        app.UseOpenApi();
        app.UseSwaggerUi3(
            c =>
            {
                // c.UseRequestInterceptor("(req) => { req.headers['Authorization'] = 'Bearer ' + window?.swaggerUIRedirectOauth2?.auth?.token?.access_token; return req; }");

                c.PersistAuthorization = true;
                c.OAuth2Client = new OAuth2ClientSettings
                {
                    ClientId = appSettings?.AzureAd.ClientId,
                    AppName = "kijk",
                    AdditionalQueryStringParameters = { { "foo", "bar" } },
                    Scopes = { appSettings?.AzureAd.Scopes },
                    UsePkceWithAuthorizationCodeGrant = true,
                };
            });
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

        var apiGroup = app.MapGroup("/api")
            .WithGroupName("api")
            .WithTags("api")
            .WithOpenApi();

        // .RequireAuthorization(AppConstants.Policies.All);
        // apiGroup.WithOpenApi(); // disabled until this is fixed "https://github.com/domaindrivendev/Swashbuckle.AspNetCore/issues/2625"

        apiGroup.RequirePerUserRateLimit();

        apiGroup.MapWeatherEndpoints();

        return app;
    }

}

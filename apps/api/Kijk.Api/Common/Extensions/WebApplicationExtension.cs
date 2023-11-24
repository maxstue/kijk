using Kijk.Api.Common.Models;
using Kijk.Api.Endpoints;
using Kijk.Api.Persistence;

namespace Kijk.Api.Common.Extensions;

public static class WebApplicationExtension
{
    public static WebApplication UseCustomOpenApi(this WebApplication app)
    {
        app.UseOpenApi();
        app.UseSwaggerUi(
            c =>
            {
                c.PersistAuthorization = true;
            });
        return app;
    }

    public static async Task<WebApplication> UseInitDatabase(this WebApplication app, IWebHostEnvironment environment)
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await AppDbInitializer.InitDb(dbContext, environment);

        return app;
    }

    public static WebApplication MapCustomEndpoints(this WebApplication app)
    {
        app.Map("/", () => Results.Redirect("/swagger"));

        var apiGroup = app.MapGroup("/api")
            .WithGroupName("api")
            .WithTags("api")
            .WithOpenApi()
            .RequireAuthorization(AppConstants.Policies.All);

        apiGroup.RequirePerUserRateLimit();

        apiGroup.MapTransactionsEndpoints();
        apiGroup.MapUsersEndpoints();
        apiGroup.MapCategoriesEndpoints();

        return app;
    }

}

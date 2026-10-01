using Kijk.Shared;

namespace Kijk.Api.Extensions;

/// <summary>Maps the API endpoints.</summary>
public static class EndpointExtensions
{
    /// <summary>
    /// Maps all endpoints to the application.
    /// All endpoints are registered in the "/api" group and are protected by the "Authenticated" policy and use a per user rate limit.
    /// </summary>
    /// <param name="app">The web application.</param>
    /// <returns>The web application.</returns>
    public static WebApplication MapEndpoints(this WebApplication app)
    {
        var apiGroup = app.MapGroup("/api")
            .RequireAuthorization(AppConstants.Policies.Authenticated)
            .RequirePerUserRateLimit();

        apiGroup.MapApiEndpoints();

        return app;
    }
}
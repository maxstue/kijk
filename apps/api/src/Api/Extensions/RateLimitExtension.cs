using System.Security.Claims;
using System.Threading.RateLimiting;
using Kijk.Shared;

namespace Kijk.Api.Extensions;

/// <summary>Rate limiting setup.</summary>
public static class RateLimitExtensions
{
    /// <summary>
    /// Registers the per-user rate limits: 100 requests per 10 seconds, 20 uploads per hour and 30 invitations per hour,
    /// answered with HTTP 429.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddRateLimitPolicy(this IServiceCollection services) => services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        options.AddPolicy(AppConstants.RateLimit, context => RateLimitPartition.GetFixedWindowLimiter(
            context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromSeconds(10),
            }));

        // Uploads are expensive to store and process; partition by the identity id, which every token carries.
        options.AddPolicy(AppConstants.UploadRateLimit, context => RateLimitPartition.GetFixedWindowLimiter(
            context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromHours(1),
            }));

        // Invitations by e-mail reach people outside Kijk, and the authentication provider allows only 100 invitations
        // per hour for the whole application.
        options.AddPolicy(AppConstants.InvitationRateLimit, context => RateLimitPartition.GetFixedWindowLimiter(
            context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromHours(1),
            }));
    });

    /// <summary>Applies the per-user rate limit to all endpoints of the group.</summary>
    /// <param name="builder">The route group.</param>
    /// <returns>The route group.</returns>
    public static RouteGroupBuilder RequirePerUserRateLimit(this RouteGroupBuilder builder)
    {
        builder.RequireRateLimiting(AppConstants.RateLimit);
        return builder;
    }
}
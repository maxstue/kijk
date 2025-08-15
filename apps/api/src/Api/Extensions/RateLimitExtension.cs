using System.Threading.RateLimiting;
using Kijk.Shared;

namespace Kijk.Api.Extensions;

public static class RateLimitExtensions
{
    public static IServiceCollection AddRateLimitPolicy(this IServiceCollection services) => services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        options.AddPolicy(AppConstants.Policies.RateLimit, context => RateLimitPartition.GetFixedWindowLimiter(
            context.User.Identity?.Name ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromSeconds(10),
            }));
    });

    public static RouteGroupBuilder RequirePerUserRateLimit(this RouteGroupBuilder builder)
    {
        builder.RequireRateLimiting(AppConstants.Policies.RateLimit);
        return builder;
    }
}
using System.Security.Claims;
using System.Threading.RateLimiting;

using Kijk.Shared;

namespace Kijk.Api.Common.Extensions;

public static class RateLimitExtensions
{
    public static IServiceCollection AddRateLimitPolicy(this IServiceCollection services) => services.AddRateLimiter(
        options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy(AppConstants.Policies.RateLimit, context =>
            {
                var username = context.User.FindFirstValue(ClaimTypes.NameIdentifier)!;

                // 100 Requests per 10sec per user
                return RateLimitPartition.GetTokenBucketLimiter(
                    username,
                    _ => new TokenBucketRateLimiterOptions
                    {
                        ReplenishmentPeriod = TimeSpan.FromSeconds(10),
                        AutoReplenishment = true,
                        TokenLimit = 100,
                        TokensPerPeriod = 100,
                        QueueLimit = 100
                    });
            });
        });

    public static RouteGroupBuilder RequirePerUserRateLimit(this RouteGroupBuilder builder)
    {
        builder.RequireRateLimiting(AppConstants.Policies.RateLimit);
        return builder;
    }
}
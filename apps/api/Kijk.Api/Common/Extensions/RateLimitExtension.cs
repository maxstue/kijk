using System.Security.Claims;
using System.Threading.RateLimiting;

using Kijk.Api.Common.Models;

namespace Kijk.Api.Common.Extensions;

public static class RateLimitExtensions
{

    public static IServiceCollection AddCustomRateLimiter(this IServiceCollection services)
    {
        return services.AddRateLimiter(
            options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

                options.AddPolicy(
                    AppConstants.Policies.RateLimit,
                    context =>
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
    }

    public static IEndpointConventionBuilder RequirePerUserRateLimit(this IEndpointConventionBuilder builder)
    {
        return builder.RequireRateLimiting(AppConstants.Policies.RateLimit);
    }
}

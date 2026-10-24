using System.Diagnostics;
using Kijk.Application.Shared.Features;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.Infrastructure.FeatureFlags;

/// <summary>Registers the feature flags.</summary>
internal static class FeatureFlagsDependencyInjection
{
    /// <summary>
    /// Evaluates the PostHog flags locally when PostHog is configured and answers from the configured fallbacks otherwise.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddFeatureFlags(this IServiceCollection services)
    {
        // The definitions download runs on behalf of whichever request finds them outdated; trace headers (traceparent,
        // and sentry-trace and baggage from Sentry's handler) would tie it to that request's traces and errors.
        services.AddHttpClient(PostHogFeatureFlags.HttpClientName)
            .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
            {
                ActivityHeadersPropagator = DistributedContextPropagator.CreateNoOutputPropagator()
            })
            .ConfigureAdditionalHttpMessageHandlers((handlers, _) => handlers.Clear());
        services.AddSingleton<IFeatureFlags, PostHogFeatureFlags>();

        return services;
    }
}
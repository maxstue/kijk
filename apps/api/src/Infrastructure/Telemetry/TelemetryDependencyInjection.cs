using System.Diagnostics;
using Kijk.Application.Users.Feedback;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using OpenTelemetry;
using OpenTelemetry.Context.Propagation;
using OpenTelemetry.Exporter;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using PostHog.Config;

namespace Kijk.Infrastructure.Telemetry;

/// <summary>
/// Registers error tracking and scrubbed OpenTelemetry traces for configured destinations, including Railway's
/// environment-provided exporter. Sentry hooks into the web host, so its error tracking is set up
/// in <see cref="HostExtensions.AddTelemetryTracking" />; everything else is here. A destination without settings is skipped.
/// </summary>
internal static class TelemetryDependencyInjection
{
    internal const string ServiceName = "kijk-api";

    private const string PostHogExporter = "posthog";

    /// <summary>Registers error tracking and, when a destination is configured, tracing.</summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The application configuration.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddTelemetry(this IServiceCollection services, IConfiguration configuration)
    {
        var destinations = TelemetryDestinations.From(configuration);
        var railway = !string.IsNullOrWhiteSpace(configuration["OTEL_EXPORTER_OTLP_ENDPOINT"])
            || !string.IsNullOrWhiteSpace(configuration["OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"]);
        services.AddSingleton(destinations);
        services.AddSingleton<ITelemetryService, TelemetryService>();
        // Feedback must not carry trace headers that could link the message to an account's request.
        services.AddHttpClient<IFeedbackSender, PostHogFeedbackSender>(client => client.Timeout = TimeSpan.FromSeconds(10))
            .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
            {
                ActivityHeadersPropagator = DistributedContextPropagator.CreateNoOutputPropagator()
            })
            .ConfigureAdditionalHttpMessageHandlers((handlers, _) => handlers.Clear());

        if (destinations.PostHog)
        {
            services.AddPostHog(builder => builder
                .UseConfigurationSection(configuration.GetSection("PostHog"))
                .PostConfigure(options => options.BeforeSend = PostHogEventScrubber.Scrub));
            services.AddSingleton<PostHogErrorSink>();
            services.AddSingleton<ErrorTrackingSerilogSink>();
        }

        if (destinations.Any || railway)
        {
            services.AddTracing(destinations, configuration, railway);
        }

        return services;
    }

    private static void AddTracing(this IServiceCollection services, TelemetryDestinations destinations, IConfiguration configuration, bool railway)
    {
        Sdk.SetDefaultTextMapPropagator(new TraceContextPropagator());
        // Exporters register services of their own, so they are added here and not in the deferred callback below.
        services.AddOpenTelemetry().WithTracing(tracing =>
        {
            tracing
                .AddAspNetCoreInstrumentation(options =>
                {
                    options.RecordException = false;
                    options.Filter = context => IsTraced(context.Request);
                })
                .AddHttpClientInstrumentation(options =>
                {
                    options.RecordException = false;
                    options.FilterHttpRequestMessage = request => !IsTelemetryRequest(request.RequestUri, destinations);
                })
                .AddSource("Npgsql", "Wolverine")
                // Exporters are processors too and run in the order they are added, so the scrubber comes first.
                .AddProcessor(new TraceScrubbingProcessor());

            if (destinations.Sentry)
            {
                tracing.AddSentryOtlpExporter(destinations.SentryDsn!, defaultTextMapPropagator: new TraceContextPropagator());
            }

            if (destinations.PostHog)
            {
                tracing.AddOtlpExporter(PostHogExporter, exporter =>
                {
                    exporter.Endpoint = new(destinations.PostHogHost, "/i/v1/traces");
                    exporter.Protocol = OtlpExportProtocol.HttpProtobuf;
                    exporter.Headers = $"Authorization=Bearer {destinations.PostHogToken}";
                });
            }

            if (railway)
            {
                // No exporter options: endpoint, protocol and authentication come from OTEL_* variables.
                tracing.AddOtlpExporter("railway", _ => { });
            }
        });

        services.ConfigureOpenTelemetryTracerProvider((provider, tracing) =>
        {
            var environment = provider.GetRequiredService<IHostEnvironment>();
            var options = provider.GetRequiredService<IOptions<TelemetryOptions>>().Value;
            Sampler sampler = options.TracesSampleRate <= 0
                ? new AlwaysOffSampler()
                : new ParentBasedSampler(new TraceIdRatioBasedSampler(options.TracesSampleRate));
            if (railway)
            {
                sampler = new ParentBasedSampler(new AlwaysOnSampler());
            }

            tracing
                .ConfigureResource(resource => resource
                    .AddService(configuration["OTEL_SERVICE_NAME"] ?? ServiceName,
                        serviceVersion: configuration["OTEL_SERVICE_VERSION"] ?? typeof(TelemetryDependencyInjection).Assembly.GetName().Version?.ToString())
                    // The environment is named the way each tool reads it.
                    .AddAttributes([
                        new("deployment.environment.name", environment.EnvironmentName.ToLowerInvariant()),
                        new("deployment.environment", environment.EnvironmentName.ToLowerInvariant())
                    ]))
                .SetSampler(sampler);
        });
    }

    private static bool IsTraced(HttpRequest request)
    {
        var path = request.Path.Value ?? string.Empty;
        return !HttpMethods.IsOptions(request.Method)
            && !request.Path.StartsWithSegments("/health")
            && !path.Contains("openapi", StringComparison.OrdinalIgnoreCase)
            && !path.Contains("scalar", StringComparison.OrdinalIgnoreCase)
            && !path.Contains("/favicon", StringComparison.OrdinalIgnoreCase);
    }

    // The calls of the telemetry libraries themselves are not traced, which would feed back into the same pipeline.
    private static bool IsTelemetryRequest(Uri? uri, TelemetryDestinations destinations) =>
        uri is not null
        && (uri.Host.Equals(destinations.PostHogHost.Host, StringComparison.OrdinalIgnoreCase)
            || uri.Host.EndsWith(".sentry.io", StringComparison.OrdinalIgnoreCase)
            || Uri.TryCreate(destinations.SentryDsn, UriKind.Absolute, out var dsn) && uri.Host.Equals(dsn.Host, StringComparison.OrdinalIgnoreCase));
}
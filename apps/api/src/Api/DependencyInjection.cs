using System.Text.Json.Serialization;
using Humanizer;
using Kijk.Api.Extensions;
using Kijk.Api.Extensions.OpenApi;
using Kijk.Api.Middleware;
using Kijk.Infrastructure.Auth;
using Kijk.Infrastructure.Telemetry;
using Kijk.Shared;
using Kijk.Shared.Exceptions;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.ResponseCompression;

namespace Kijk.Api;

public static class DependencyInjection
{
    public static IServiceCollection AddApi(this IServiceCollection services, IConfiguration configuration) =>
        services
            .AddProblemDetail()
            .AddControllerOptions()
            .AddValidation()
            .AddCompression()
            .AddEndpoints()
            .AddMiddlewares()
            .AddExceptionHandler<GlobalExceptionHandler>()
            .AddHttpClient()
            .AddRateLimitPolicy()
            .AddOpenApiInternal(configuration);

    private static IServiceCollection AddMiddlewares(this IServiceCollection services)
    {
        services.AddTransient<ExtendRequestLoggingMiddleware>();
        services.AddTransient<CurrentUserMiddleware>();
        services.AddTransient<TelemetryMiddleware>();
        return services;
    }

    private static IServiceCollection AddProblemDetail(this IServiceCollection services) =>
        services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
        {
            context.ProblemDetails.Instance = $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}";
            context.ProblemDetails.Extensions.TryAdd("timestamp", DateTime.UtcNow);

            var activity = context.HttpContext.Features.Get<IHttpActivityFeature>()?.Activity;
            context.ProblemDetails.Extensions.TryAdd("correlationId", activity?.Id ?? context.HttpContext.TraceIdentifier);

            context.ProblemDetails.Extensions["errorType"] = context.HttpContext.Response.StatusCode switch
            {
                StatusCodes.Status401Unauthorized => ErrorType.Authentication,
                StatusCodes.Status403Forbidden => ErrorType.Authorization,
                _ => context.ProblemDetails.Extensions["errorType"]
            };
        });

    private static IServiceCollection AddOpenApiInternal(this IServiceCollection services, IConfiguration configuration)
    {
        var appSettings = configuration.GetSection(AuthOptions.SectionName).Get<AuthOptions>();
        if (appSettings is null)
        {
            throw new NullException($"No AuthSettings found, {appSettings}");
        }

        services.AddOpenApi("openapi", opt =>
        {
            opt.AddDocumentTransformer<InformationTransformer>();
            opt.AddDocumentTransformer<AuthSchemeTransformer>();
            opt.AddDocumentTransformer<ComponentResponseTransformer>();

            opt.AddOperationTransformer<OperationResponseTransformer>();
        });
        return services;
    }

    private static IServiceCollection AddCompression(this IServiceCollection services)
    {
        services.AddResponseCompression(options =>
        {
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
            options.MimeTypes = ResponseCompressionDefaults.MimeTypes;
        });
        return services;
    }

    private static IServiceCollection AddValidation(this IServiceCollection services)
    {
        ValidatorOptions.Global.DisplayNameResolver = (_, member, _) => member?.Name.Humanize().Titleize();
        ValidatorOptions.Global.LanguageManager.Culture = new("de");
        return services;
    }

    private static IServiceCollection AddControllerOptions(this IServiceCollection services)
    {
        services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
        services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
        return services;
    }
}
using System.Globalization;
using System.Text.Json.Serialization;
using Humanizer;
using Kijk.Api.Extensions;
using Kijk.Api.Extensions.OpenApi;
using Kijk.Api.Middleware;
using Kijk.Infrastructure.Auth;
using Kijk.Shared;
using Kijk.Shared.Exceptions;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.ResponseCompression;

namespace Kijk.Api;

public static class DependencyInjection
{
    public static IServiceCollection AddApi(this IServiceCollection services, IConfiguration configuration) =>
        services.AddServices()
            .AddProblemDetail()
            .AddControllerOptions()
            .AddValidation()
            .AddCompression()
            .AddEndpoints()
            .AddExceptionHandler<GlobalExceptionHandler>()
            .AddHttpClient()
            .AddRateLimitPolicy()
            .AddOpenApiInternal(configuration);


    private static IServiceCollection AddServices(this IServiceCollection services) => services.AddTransient<ExtendRequestLoggingMiddleware>();

    private static IServiceCollection AddProblemDetail(this IServiceCollection services) =>
        services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
        {
            context.ProblemDetails.Instance = $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}";
            context.ProblemDetails.Extensions.TryAdd("requestId", context.HttpContext.TraceIdentifier);

            var activity = context.HttpContext.Features.Get<IHttpActivityFeature>()?.Activity;
            context.ProblemDetails.Extensions.TryAdd("traceId", activity?.Id);
            if (context.HttpContext.Response.StatusCode is StatusCodes.Status401Unauthorized or StatusCodes.Status403Forbidden)
            {
                var error = Error.FromStatusCode(context.HttpContext.Response.StatusCode);
                context.ProblemDetails.Extensions["errors"] = error.ToProblemDetails().Extensions["errors"];
            }
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
        ValidatorOptions.Global.LanguageManager.Culture = new CultureInfo("de");

        return services;
    }

    private static IServiceCollection AddControllerOptions(this IServiceCollection services)
    {
        services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
        services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

        return services;
    }
}
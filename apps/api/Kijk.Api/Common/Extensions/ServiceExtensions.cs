using System.Globalization;
using System.IO.Compression;
using System.Text.Json.Serialization;

using Humanizer;

using Kijk.Api.Application.App;
using Kijk.Api.Application.Weathers;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.OpenApi.Models;

namespace Kijk.Api.Common.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection RegisterModules(this IServiceCollection services)
    {
        services.RegisterAppModule()
            .RegisterWeatherModule();

        return services;
    }

    public static IServiceCollection AddCustomCors(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("Cors").Get<string[]>();
        if (allowedOrigins is null)
        {
            throw new ArgumentNullException($"{allowedOrigins}", "Cors appsettings is null");
        }

        services.AddCors(
            options =>
            {
                options.AddPolicy(
                    AppConstants.Policies.Cors,
                    builder =>
                    {
                        builder.WithOrigins(allowedOrigins)
                            .AllowAnyMethod()
                            .AllowAnyHeader();
                    });
            });

        return services;
    }

    public static IServiceCollection AddCustomOpenApi(this IServiceCollection services, IConfiguration configuration)
    {
        var appSettings = configuration.Get<AppSettings>();

        if (appSettings is null)
        {
            throw new Exception($"Keine Appsettings gefunden, {appSettings}");
        }

        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(
            o =>
            {
                o.SwaggerDoc(
                    "v1",
                    new OpenApiInfo { Version = "v1", Title = "Kijk API", Description = "ASP.NET 7 Web API" });

                // To Enable authorization using Swagger (JWT)
                o.AddSecurityDefinition(
                    "oAuth2",
                    new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.OAuth2,
                        Flows = new OpenApiOAuthFlows
                        {
                            AuthorizationCode = new OpenApiOAuthFlow
                            {
                                AuthorizationUrl =
                                    new Uri($"{appSettings.AzureAd.Instance}{appSettings.AzureAd.TenantId}/oauth2/v2.0/authorize"),
                                TokenUrl =
                                    new Uri($"{appSettings.AzureAd.Instance}{appSettings.AzureAd.TenantId}/oauth2/v2.0/token"),
                                Scopes = { { appSettings.AzureAd.Scopes, "Web Api access" } }
                            }
                        }
                    });
            });
        return services;
    }

    public static IServiceCollection ConfigureDatabase(this IServiceCollection services)
    {
        services.AddDbContext<AppDbContext>();

        return services;
    }

    public static IServiceCollection AddCustomCompression(this IServiceCollection services)
    {
        services.AddResponseCompression(
            options =>
            {
                options.EnableForHttps = true;
                options.Providers.Add<BrotliCompressionProvider>();
                options.Providers.Add<GzipCompressionProvider>();
                options.MimeTypes = ResponseCompressionDefaults.MimeTypes;
            });

        services.Configure<BrotliCompressionProviderOptions>(
            options =>
            {
                options.Level = CompressionLevel.Optimal;
            });

        services.Configure<GzipCompressionProviderOptions>(
            options =>
            {
                options.Level = CompressionLevel.SmallestSize;
            });

        return services;
    }

    public static IServiceCollection AddCustomValidation(this IServiceCollection services)
    {
        ValidatorOptions.Global.DisplayNameResolver = (_, member, _) => member?.Name.Humanize().Titleize();
        ValidatorOptions.Global.LanguageManager.Culture = new CultureInfo("de");

        return services;
    }

    public static IServiceCollection AddCustomAppSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AppSettings>(configuration);

        return services;
    }

    public static IServiceCollection AddCustomControllerOptions(this IServiceCollection services)
    {
        services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

        services.AddControllers().AddJsonOptions(
            options =>
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

        return services;
    }

}

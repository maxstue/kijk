using System.Globalization;
using System.IO.Compression;
using System.Text.Json.Serialization;

using Humanizer;

using Kijk.Api.Application.App;
using Kijk.Api.Application.Transactions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Kijk.Api.Persistence.Interceptors;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore.Diagnostics;

using NSwag;
using NSwag.Generation.Processors.Security;

namespace Kijk.Api.Common.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection RegisterModules(this IServiceCollection services)
    {
        services.RegisterAppModule()
            .RegisterAppModule()
            .RegisterTransactionModule();

        return services;
    }

    public static IServiceCollection AddCustomAppSettings(this IServiceCollection services, IConfiguration configuration)
    {
        // TODO: split into multiple smaller settings objects
        services.AddScoped<IValidator<AppSettings>, AppSettingsValidator>();

        services.AddOptions<AppSettings>()
            .BindConfiguration("")
            .ValidateFluentValidation()
            .ValidateOnStart();

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
        var authSettings = configuration.GetSection("Auth").Get<Auth>();

        if (authSettings is null)
        {
            throw new Exception($"No auth settings found, {authSettings}");
        }

        services.AddEndpointsApiExplorer();
        services.AddOpenApiDocument(
            o =>
            {
                o.PostProcess = document =>
                {
                    document.Info = new OpenApiInfo
                    {
                        Title = "Kijk API",
                        Description = "Kijk api to manage households",
                        Version = "0.5",
                        Contact = new OpenApiContact { Name = "Github", Url = "https://github.com/maxstue/kijk" }
                    };
                };

                // o.AddSecurity(
                //     "oAuth2",
                //     Enumerable.Empty<string>(),
                //     new OpenApiSecurityScheme
                //     {
                //         Type = OpenApiSecuritySchemeType.OAuth2,
                //         Description = "Kijk Authentication",
                //         Flows = new OpenApiOAuthFlows
                //         {
                //             AuthorizationCode = new OpenApiOAuthFlow
                //             {
                //                 AuthorizationUrl = $"{authSettings.Instance}{authSettings.TenantId}/oauth2/v2.0/authorize",
                //                 TokenUrl = $"{authSettings.Instance}{authSettings.TenantId}/oauth2/v2.0/token",
                //                 Scopes = { { authSettings.Scopes, "Web Api access" } }
                //             }
                //         }
                //     });
                //
                // o.OperationProcessors.Add(new AspNetCoreOperationSecurityScopeProcessor("oAuth2"));
                o.AddSecurity(
                    "Bearer",
                    Enumerable.Empty<string>(),
                    new OpenApiSecurityScheme
                    {
                        Type = OpenApiSecuritySchemeType.Http,
                        Scheme = JwtBearerDefaults.AuthenticationScheme,
                        BearerFormat = "JWT",
                        Description = "Type into the textbox: {your JWT token}."
                    });

                o.OperationProcessors.Add(new AspNetCoreOperationSecurityScopeProcessor("Bearer"));
            });
        return services;
    }

    public static IServiceCollection ConfigureDatabase(this IServiceCollection services)
    {
        services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();

        services.AddDbContext<AppDbContext>(
            (sp, options) =>
            {
                options.AddInterceptors(sp.GetServices<ISaveChangesInterceptor>());
            });

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

    public static IServiceCollection AddCustomControllerOptions(this IServiceCollection services)
    {
        services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

        services.AddControllers().AddJsonOptions(
            options =>
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

        return services;
    }

    public static IServiceCollection AddCustomHealthCheck(this IServiceCollection services, IConfiguration configuration)
    {
        var conString = configuration.GetConnectionString("DefaultConnection");
        if (conString is null)
        {
            throw new Exception($"No connection string found, {conString}");
        }

        services.AddHealthChecks().AddNpgSql(conString, tags: new[] { "database", "postgresql" });

        return services;
    }

}

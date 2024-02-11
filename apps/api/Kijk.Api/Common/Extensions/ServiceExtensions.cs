using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.Json.Serialization;
using Humanizer;
using Kijk.Api.Application.App;
using Kijk.Api.Application.Categories;
using Kijk.Api.Application.Transactions;
using Kijk.Api.Application.Users;
using Kijk.Api.Common.Models;
using Kijk.Api.Common.Options;
using Kijk.Api.Persistence;
using Kijk.Api.Persistence.Interceptors;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;
using NSwag;
using NSwag.Generation.Processors.Security;

namespace Kijk.Api.Common.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddModules(this IServiceCollection services)
    {
        services.RegisterAppModule()
            .RegisterAppModule()
            .RegisterUsersModule()
            .RegisterTransactionsModule()
            .RegisterCategoriesModule();

        return services;
    }

    public static IServiceCollection AddAppSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.ConfigureOptions<AuthConfigureOptions>();
        services.ConfigureOptions<ConnectionStringsConfigureOptions>();

        return services;
    }

    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
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

    public static IServiceCollection AddOpenApi(this IServiceCollection services, IConfiguration configuration)
    {
        var authSettings = configuration.GetSection(AuthOptions.AuthOptionsPath).Get<AuthOptions>();

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

    public static IServiceCollection AddDatabase(this IServiceCollection services)
    {
        services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();

        services.AddDbContext<AppDbContext>();

        return services;
    }

    public static IServiceCollection AddCompression(this IServiceCollection services)
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

    public static IServiceCollection AddValidation(this IServiceCollection services)
    {
        ValidatorOptions.Global.DisplayNameResolver = (_, member, _) => member?.Name.Humanize().Titleize();
        ValidatorOptions.Global.LanguageManager.Culture = new CultureInfo("de");

        return services;
    }

    public static IServiceCollection AddControllerOptions(this IServiceCollection services)
    {
        services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

        services.AddControllers().AddJsonOptions(
            options =>
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

        return services;
    }

    public static IServiceCollection AddHealthCheck(this IServiceCollection services, IConfiguration configuration)
    {
        var conString = configuration.GetConnectionString(nameof(ConnectionStringsOptions.DefaultConnection));
        if (conString is null)
        {
            throw new Exception($"No connection string found, {conString}");
        }

        services.AddHealthChecks().AddNpgSql(conString, tags: ["database", "postgresql"]);

        return services;
    }

    public static IServiceCollection AddAuth(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthentication(
            o =>
            {
                o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                o.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(
            o =>
            {
                o.IncludeErrorDetails = true;
                o.SaveToken = true;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey =
                        new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(
                                configuration.GetValue<string>($"{AuthOptions.AuthOptionsPath}:IssuerSigningKey") ??
                                string.Empty)),
                    ValidateIssuer = false,
                    ValidateAudience = true,
                    ValidAudience = configuration.GetValue<string>($"{AuthOptions.AuthOptionsPath}:ValidAudience"),
                };
            });

        // State that represents the current user from the request
        services.AddCurrentUser();

        // TODO write into custom requirementshandler
        services.AddAuthorizationBuilder()
            .AddPolicy(
                AppConstants.Policies.All,
                policy => policy.RequireRole("authenticated").RequireCurrentUser().Build())

            // .AddPolicy(AppConstants.Policies.User, policy => policy.RequireRole(AppConstants.Roles.User).RequireCurrentUser().Build())
            // .AddPolicy(AppConstants.Policies.Admin, policy => policy.RequireRole(AppConstants.Roles.Admin).RequireCurrentUser().Build())
            .AddCurrentUserHandler();

        return services;
    }

    public static IServiceCollection AddCache(this IServiceCollection services)
    {
        services.AddFusionCache(AppConstants.CacheNames.Base);
        return services;
    }
}

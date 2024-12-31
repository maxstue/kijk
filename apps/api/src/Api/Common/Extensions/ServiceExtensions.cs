using System.Globalization;
using System.Security.Claims;
using System.Text.Json.Serialization;

using EntityFramework.Exceptions.PostgreSQL;

using Humanizer;

using Kijk.Api.Common.Exceptions;
using Kijk.Api.Common.Middleware;
using Kijk.Api.Common.Models;
using Kijk.Api.Common.Options;
using Kijk.Api.Modules.App;
using Kijk.Api.Modules.Categories;
using Kijk.Api.Modules.EnergyConsumptions;
using Kijk.Api.Modules.Transactions;
using Kijk.Api.Modules.Users;
using Kijk.Api.Persistence;
using Kijk.Api.Persistence.Interceptors;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.IdentityModel.Tokens;

namespace Kijk.Api.Common.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddModules(this IServiceCollection services)
    {
        services.RegisterAppModule()
            .RegisterAppModule()
            .AddUsersModule()
            .AddTransactionsModule()
            .AddCategoriesModule()
            .AddEnergyConsumptionsModule();

        return services;
    }

    public static IServiceCollection AddAppSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.ConfigureOptions<AuthOptions>(configuration).ConfigureOptions<ConnectionOptions>(configuration);

        return services;
    }

    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("Cors").Get<string[]>();
        if (allowedOrigins is null)
        {
            throw new ArgumentNullException($"{allowedOrigins}", "Cors appsettings is null");
        }

        services.AddCors(options => options.AddPolicy(
            AppConstants.Policies.Cors, builder => builder.WithOrigins(allowedOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader()));

        return services;
    }

    public static IServiceCollection AddOpenApi(this IServiceCollection services, IConfiguration configuration)
    {
        var appSettings = configuration.GetSection(AuthOptions.SectionName).Get<AuthOptions>();

        if (appSettings is null)
        {
            throw new NullException($"Keine AzureAdSettings gefunden, {appSettings}");
        }

        services.AddOpenApi("openapi", opt => opt.AddDocumentTransformer((document, _, _) =>
        {
            document.Info = new() { Version = "v1", Title = "Kijk API", Description = "Kijk API to manage your houses", };
            opt.AddDocumentTransformer<BearerAuthSchemeTransformer>();
            return Task.CompletedTask;
        }));
        return services;
    }

    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<AuditableEntityInterceptor>();

        services.AddDbContextPool<AppDbContext>((sp, optionsBuilder) =>
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            optionsBuilder.UseNpgsql(connectionString, opt =>
                {
                    opt.EnableRetryOnFailure();
                    opt.MapEnum<TransactionType>()
                        .MapEnum<EnergyConsumptionType>()
                        .MapEnum<Role>()
                        .MapEnum<CategoryType>()
                        .MapEnum<CategoryCreatorType>()
                        .MapEnum<Visibility>()
                        .MapEnum<AccountType>()
                        .MapEnum<Frequency>()
                        .MapEnum<TransactionStatus>()
                        .MapEnum<BudgetStatus>();
                })
                .UseExceptionProcessor()
                .UseSnakeCaseNamingConvention()
                .AddInterceptors(sp.GetServices<AuditableEntityInterceptor>());
        });

        return services;
    }

    public static IServiceCollection AddCompression(this IServiceCollection services)
    {
        services.AddResponseCompression(options =>
        {
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
            options.MimeTypes = ResponseCompressionDefaults.MimeTypes;
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
        services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

        return services;
    }

    public static IServiceCollection AddHealthCheck(this IServiceCollection services, IConfiguration configuration)
    {
        var conString = configuration.GetConnectionString(ConnectionOptions.SectionName);
        if (conString is null)
        {
            throw new NullException($"No connection string found, {conString}");
        }

        services.AddHealthChecks().AddNpgSql(conString, tags: ["database", "postgresql"]);

        return services;
    }

    public static IServiceCollection AddAuth(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(
                x =>
                {
                    // Authority is the URL of your clerk instance
                    x.Authority = configuration["Auth:Authority"];
                    x.TokenValidationParameters = new TokenValidationParameters()
                    {
                        // Disable audience validation as we aren't using it
                        ValidateAudience = false, NameClaimType = ClaimTypes.NameIdentifier
                    };
                    x.Events = new JwtBearerEvents
                    {
                        // Additional validation for AZP claim
                        OnTokenValidated = context =>
                        {
                            var azp = context.Principal?.FindFirstValue("azp");

                            // AuthorizedParty is the base URL of your frontend.
                            if (string.IsNullOrEmpty(azp) || !azp.Equals(configuration["Auth:AuthorizedParty"], StringComparison.Ordinal))
                            {
                                context.Fail("AZP Claim is invalid or missing");
                            }

                            return Task.CompletedTask;
                        }
                    };
                });

        services.AddScoped<CurrentUser>();
        services.AddTransient<CurrentUserMiddleware>();

        services.AddAuthorizationBuilder()
            .AddPolicy(AppConstants.Policies.All, policy => policy.RequireClaim("id").RequireAuthenticatedUser().Build());

        // .AddPolicy(AppConstants.Policies.User, policy => policy.RequireRole(AppConstants.Roles.User).RequireCurrentUser().Build())
        // .AddPolicy(AppConstants.Policies.Admin, policy => policy.RequireRole(AppConstants.Roles.Admin).RequireCurrentUser().Build())

        return services;
    }

    public static IServiceCollection AddCache(this IServiceCollection services) => services;
}
using System.Security.Claims;
using EntityFramework.Exceptions.PostgreSQL;
using Kijk.Infrastructure.Auth;
using Kijk.Infrastructure.Persistence;
using Kijk.Infrastructure.Persistence.Interceptors;
using Kijk.Shared;
using Kijk.Shared.Exceptions;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Kijk.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration) =>
        services.AddOptions(configuration)
            .AddDatabase(configuration)
            .AddHealthCheck(configuration)
            .AddCorsPolicy(configuration)
            .AddAuth(configuration);

    private static IServiceCollection AddOptions(this IServiceCollection services, IConfiguration configuration)
    {
        services.ConfigureOptions<AuthOptions>(configuration)
            .ConfigureOptions<ConnectionOptions>(configuration)
            .ConfigureOptions<PersistenceOptions>(configuration);

        return services;
    }

    private static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContextPool<AppDbContext>((sp, optionsBuilder) =>
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            var persistenceOptions = sp.GetRequiredService<IOptions<PersistenceOptions>>().Value;

            IList<IInterceptor> interceptors =
            [
                new SlowQueryInterceptor(persistenceOptions.SlowQueryLoggingEnabled, persistenceOptions.SlowQueryThreshold)
            ];

            optionsBuilder.UseNpgsql(connectionString, opt => opt.MapEnum<CreatorType>().EnableRetryOnFailure())
                .UseExceptionProcessor()
                .UseSnakeCaseNamingConvention()
                .AddInterceptors(interceptors);
        });

        return services;
    }

    private static IServiceCollection AddHealthCheck(this IServiceCollection services, IConfiguration configuration)
    {
        var conString = configuration.GetConnectionString(ConnectionOptions.SectionName);
        if (conString is null)
        {
            throw new NullException($"No connection string found, {conString}");
        }

        services.AddHealthChecks().AddNpgSql(conString, tags: ["database", "postgresql"]);

        return services;
    }

    private static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
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

    private static IServiceCollection AddAuth(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(x =>
            {
                // Authority is the URL of your clerk instance
                x.Authority = configuration["Auth:Authority"];
                x.TokenValidationParameters = new()
                {
                    // Disable audience validation as we aren't using it
                    ValidateAudience = false, NameClaimType = ClaimTypes.NameIdentifier
                };
                x.Events = new()
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

        services.AddAuthorizationBuilder()
            .AddPolicy(AppConstants.Policies.All, policy => policy.RequireClaim("id").RequireAuthenticatedUser().Build());

        return services;
    }
}
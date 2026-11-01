using System.Security.Claims;
using Clerk.BackendAPI;
using EntityFramework.Exceptions.PostgreSQL;
using Kijk.Application.Shared.Identity;
using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Authorization;
using Kijk.Infrastructure.Ai;
using Kijk.Infrastructure.Auth;
using Kijk.Infrastructure.Configuration;
using Kijk.Infrastructure.FeatureFlags;
using Kijk.Infrastructure.Imports;
using Kijk.Infrastructure.Jobs;
using Kijk.Infrastructure.Persistence;
using Kijk.Infrastructure.Persistence.Interceptors;
using Kijk.Infrastructure.Telemetry;
using Kijk.Shared;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Serilog;

namespace Kijk.Infrastructure;

/// <summary>Registers the infrastructure services: persistence, authentication, authorization, telemetry and logging.</summary>
public static class DependencyInjection
{
    extension(IServiceCollection services)
    {
        /// <summary>Registers infrastructure services. Register durable workers separately with <see cref="JobsDependencyInjection.AddBackgroundJobs" />.</summary>
        /// <param name="configuration">The application configuration.</param>
        /// <returns>The service collection.</returns>
        public IServiceCollection AddInfrastructure(IConfiguration configuration) =>
            services.AddConfigurationOptions(configuration)
                .AddDatabase()
                .AddHealthCheck()
                .AddTelemetry(configuration)
                .AddFeatureFlags()
                .AddLogging(configuration)
                .AddClerkBackendApi()
                .AddAuth()
                .AddImports()
                .AddAi();

        private IServiceCollection AddDatabase()
        {
            services.AddDbContextPool<AppDbContext>((sp, optionsBuilder) =>
            {
                var connectionString = sp.GetRequiredService<IOptions<ConnectionOptions>>().Value.DefaultConnection;
                var persistenceOptions = sp.GetRequiredService<IOptions<PersistenceOptions>>().Value;

                IList<IInterceptor> interceptors =
                [
                    new SlowQueryInterceptor(persistenceOptions.SlowQueryLoggingEnabled, persistenceOptions.SlowQueryThreshold)
                ];

                optionsBuilder.UseNpgsql(connectionString, opt => opt.MapEnum<CreatorType>())
                    .UseExceptionProcessor()
                    .UseSnakeCaseNamingConvention()
                    .AddInterceptors(interceptors);
            });

            services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

            return services;
        }

        private IServiceCollection AddHealthCheck()
        {
            services.AddHealthChecks().AddNpgSql(
                sp => sp.GetRequiredService<IOptions<ConnectionOptions>>().Value.DefaultConnection,
                tags: ["database", "postgresql"]);

            return services;
        }

        private IServiceCollection AddAuth()
        {
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer();
            services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
                .Configure<IOptions<AuthOptions>>((x, configuredAuth) =>
                {
                    var authOptions = configuredAuth.Value;
                    // Authority is the URL of your clerk instance
                    x.Authority = authOptions.Authority;
                    x.TokenValidationParameters = new()
                    {
                        // Disable audience validation as we aren't using it
                        ValidateAudience = false,
                        NameClaimType = ClaimTypes.NameIdentifier,
                        ClockSkew = TimeSpan.FromSeconds(authOptions.ClockSkewInSeconds)
                    };
                    x.Events = new()
                    {
                        // Additional validation for AZP claim
                        OnTokenValidated = context =>
                        {
                            var azp = context.Principal?.FindFirstValue("azp");

                            // AuthorizedParties contains the allowed base URLs of your frontends.
                            if (string.IsNullOrEmpty(azp) || !authOptions.AuthorizedParties.Contains(azp, StringComparer.Ordinal))
                            {
                                context.Fail("AZP Claim is invalid or missing");
                            }

                            return Task.CompletedTask;
                        }
                    };
                });

            services.AddScoped<CurrentUser>();
            services.AddScoped<IAuthorizationHandler, OnboardingCompletedAuthorizationHandler>();
            services.AddScoped<IAuthorizationHandler, SpacePermissionAuthorizationHandler>();

            var authorization = services.AddAuthorizationBuilder()
                .AddPolicy(AppConstants.Policies.Authenticated, policy => policy.RequireAuthenticatedUser())
                .AddPolicy(
                    AppConstants.Policies.OnboardingCompleted,
                    policy => policy
                        .RequireAuthenticatedUser()
                        .AddRequirements(new OnboardingCompletedRequirement()));

            foreach (var permission in SpacePermissions.All.Select(permission => permission.Name))
            {
                authorization.AddPolicy(
                    AppConstants.Policies.SpacePermission(permission),
                    policy => policy
                        .RequireAuthenticatedUser()
                        .AddRequirements(new SpacePermissionRequirement(permission)));
            }

            return services;
        }

        private IServiceCollection AddClerkBackendApi()
        {
            services.AddSingleton(sp =>
            {
                var authOptions = sp.GetRequiredService<IOptions<AuthOptions>>().Value;
                return new ClerkBackendApi(bearerAuth: authOptions.SecretKey);
            });
            services.AddScoped<IIdentityProvider, ClerkIdentityProvider>();

            return services;
        }

        /// <summary>
        /// Adds Serilog and the sinks that turn logged exceptions into error reports for Sentry and, when configured, PostHog.
        /// </summary>
        /// <returns>The service collection.</returns>
        private IServiceCollection AddLogging(IConfiguration configuration)
        {
            services.AddSerilog((sp, lc) =>
            {
                lc
                    .ReadFrom.Configuration(configuration)
                    .ReadFrom.Services(sp)
                    .WriteTo.Logger(errors => errors
                        .Filter.ByIncludingOnly(logEvent => logEvent.Exception is not null)
                        .WriteTo.Sentry());

                if (sp.GetService<ErrorTrackingSerilogSink>() is { } postHogErrors)
                {
                    lc.WriteTo.Sink(postHogErrors);
                }
            });

            return services;
        }
    }
}
using System.Security.Claims;
using System.Text.Encodings.Web;
using Kijk.Api;
using Kijk.Api.Extensions;
using Kijk.Api.Middleware;
using Kijk.Application;
using Kijk.Application.Shared.Persistence;
using Kijk.Infrastructure;
using Kijk.Infrastructure.Persistence;
using Kijk.IntegrationTests.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Kijk.IntegrationTests.Http;

// Runs the production endpoints, policies and current-user middleware over HTTP.
// Only external authentication and the database connection are replaced.
internal sealed class HouseholdApiHost(WebApplication application, HttpClient client) : IAsyncDisposable
{
    internal HttpClient Client => client;

    internal HttpClient CreateClient(string authId)
    {
        var result = new HttpClient { BaseAddress = client.BaseAddress };
        result.DefaultRequestHeaders.Add(TestAuthenticationHandler.HeaderName, authId);
        return result;
    }

    internal static async Task<HouseholdApiHost> StartAsync(string authId)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Testing",
            ApplicationName = typeof(Kijk.Api.DependencyInjection).Assembly.FullName
        });
        builder.Configuration.Sources.Clear();
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Auth:Authority"] = "https://identity.example.test",
            ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=unused",
            ["Cors:0"] = "http://localhost",
            ["Serilog:WriteTo:0:Name"] = "Console",
            ["Serilog:MinimumLevel:Default"] = "Warning"
        });
        builder.WebHost.UseKestrel(options => options.Listen(System.Net.IPAddress.Loopback, 0));
        builder.Services.AddApplication().AddApi(builder.Configuration).AddInfrastructure(builder.Configuration);
        builder.Services.RemoveAll<AppDbContext>();
        builder.Services.AddScoped(_ => PostgreSqlTestDatabase.CreateDbContext());
        builder.Services.RemoveAll<IAppDbContext>();
        builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        builder.Services.AddSingleton<Sentry.IHub>(Sentry.Extensibility.HubAdapter.Instance);
        builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = TestAuthenticationHandler.SchemeName;
            options.DefaultChallengeScheme = TestAuthenticationHandler.SchemeName;
            options.DefaultForbidScheme = TestAuthenticationHandler.SchemeName;
        }).AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(TestAuthenticationHandler.SchemeName, _ => { });

        var app = builder.Build();
        app.UseRouting();
        app.UseRateLimiter();
        app.UseExceptionHandler();
        app.UseAuthentication();
        app.UseMiddleware<CurrentUserMiddleware>();
        app.UseAuthorization();
        app.MapEndpoints();
        await app.StartAsync();
        var client = new HttpClient { BaseAddress = new Uri(app.Urls.Single()) };
        client.DefaultRequestHeaders.Add(TestAuthenticationHandler.HeaderName, authId);
        return new HouseholdApiHost(app, client);
    }

    public async ValueTask DisposeAsync()
    {
        client.Dispose();
        await application.DisposeAsync();
    }

    private sealed class TestAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        internal const string SchemeName = "TestIdentity";
        internal const string HeaderName = "X-Test-Auth-Id";

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.TryGetValue(HeaderName, out var authId))
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }

            var identity = new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, authId.ToString())], SchemeName);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName)));
        }
    }
}
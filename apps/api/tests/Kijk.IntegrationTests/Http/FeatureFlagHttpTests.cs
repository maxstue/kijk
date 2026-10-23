using System.Net;
using System.Text.Json;
using Kijk.Application.Shared.Features;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Domain.ValueObjects;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Kijk.IntegrationTests.Http;

// A PostHog feature flag that is off makes the finance area and the AI import unavailable in the API, not just hidden.
[NotInParallel]
public class FeatureFlagHttpTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    private static readonly string[] FinancePaths = ["accounts", "budgets", "categories", "category-rules", "imports", "transactions?year=2026&month=10"];

    [Test]
    public async Task SwitchingOffTheFinancesFlagMakesEveryFinanceEndpointUnavailableAndLeavesTheOtherAreas()
    {
        var (user, spaceId) = await CreateMemberAsync();
        await using var host = await StartHostAsync(user, AppConstants.Features.Finances);

        foreach (var path in FinancePaths)
        {
            using var response = await host.Client.GetAsync($"/api/spaces/{spaceId}/{path}");

            await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.NotFound).Because(path);
            await Assert.That(await ErrorCodeAsync(response)).IsEqualTo(ErrorCodes.FeatureDisabled).Because(path);
        }

        using var resources = await host.Client.GetAsync($"/api/spaces/{spaceId}/resources");
        await Assert.That(resources.StatusCode).IsEqualTo(HttpStatusCode.OK);
        // The AI import lives inside the finance area, so the client is told it is off as well.
        await Assert.That(await FeaturesAsync(host)).IsEqualTo((false, false));
    }

    [Test]
    public async Task FinanceEndpointsWorkWhileTheFlagIsOn()
    {
        var (user, spaceId) = await CreateMemberAsync();
        await using var host = await StartHostAsync(user);

        using var response = await host.Client.GetAsync($"/api/spaces/{spaceId}/accounts");

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(await FeaturesAsync(host)).IsEqualTo((true, true));
    }

    [Test]
    public async Task SwitchingOffTheAiImportFlagMakesOnlyTheAiEndpointsUnavailable()
    {
        var (user, spaceId) = await CreateMemberAsync();
        await using var host = await StartHostAsync(user, AppConstants.Features.AiImport);

        foreach (var (method, action) in new[] { (HttpMethod.Get, "ai-preview"), (HttpMethod.Post, "categorize") })
        {
            using var request = new HttpRequestMessage(method, $"/api/spaces/{spaceId}/imports/{Guid.NewGuid()}/{action}");
            using var response = await host.Client.SendAsync(request);

            await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.NotFound).Because(action);
            await Assert.That(await ErrorCodeAsync(response)).IsEqualTo(ErrorCodes.FeatureDisabled).Because(action);
        }

        using var imports = await host.Client.GetAsync($"/api/spaces/{spaceId}/imports");
        await Assert.That(imports.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(await FeaturesAsync(host)).IsEqualTo((true, false));
    }

    private static Task<SpaceApiHost> StartHostAsync(User user, params string[] disabled) =>
        SpaceApiHost.StartAsync(
            user.AuthId,
            configureServices: services => services.Replace(ServiceDescriptor.Singleton<IFeatureFlags>(new SwitchedOffFlags(disabled))));

    private static async Task<(User User, Guid SpaceId)> CreateMemberAsync()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = Space.Create("Shared space");
        var admin = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Admin.Id);
        var user = User.Init("member-auth", "member", "member@example.test");
        user.CompleteOnboarding("member", AnalyticsConsent.Declined, DateTime.UtcNow);
        user.UserSpaces.Add(UserSpace.Create(user, space, admin));
        dbContext.Add(user);
        await dbContext.SaveChangesAsync();
        return (user, space.Id);
    }

    // The client reads the API's own decision instead of asking PostHog, so both always agree.
    private static async Task<(bool Finances, bool AiImport)> FeaturesAsync(SpaceApiHost host)
    {
        using var response = await host.Client.GetAsync("/api/users/me/features");
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return (body.RootElement.GetProperty("finances").GetBoolean(), body.RootElement.GetProperty("aiImport").GetBoolean());
    }

    private static async Task<string?> ErrorCodeAsync(HttpResponseMessage response)
    {
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return body.RootElement.TryGetProperty("errorCode", out var code) ? code.GetString() : null;
    }

    private sealed class SwitchedOffFlags(string[] disabled) : IFeatureFlags
    {
        public Task<bool> IsEnabledAsync(string feature, CancellationToken cancellationToken) =>
            Task.FromResult(!disabled.Contains(feature));
    }
}
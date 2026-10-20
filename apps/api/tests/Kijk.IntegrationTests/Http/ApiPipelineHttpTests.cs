using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kijk.Application.Units.List;
using Kijk.Application.Units.Shared;
using Kijk.Application.Users.Update;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.IntegrationTests.Http;

[NotInParallel]
public class ApiPipelineHttpTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task RateLimitsAreSeparateForDifferentIdentities()
    {
        var first = await CreateUserAsync("first");
        var second = await CreateUserAsync("second");
        await using var host = await SpaceApiHost.StartAsync(first.AuthId);
        using var other = host.CreateClient(second.AuthId);

        for (var index = 0; index < 100; index++)
        {
            using var allowed = await host.Client.GetAsync("/api/spaces/roles");
            await Assert.That(allowed.StatusCode).IsEqualTo(HttpStatusCode.OK);
        }
        using var limited = await host.Client.GetAsync("/api/spaces/roles");
        using var unaffected = await other.GetAsync("/api/spaces/roles");

        await Assert.That(limited.StatusCode).IsEqualTo(HttpStatusCode.TooManyRequests);
        await Assert.That(unaffected.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(limited.Headers.Contains(AppConstants.CorrelationId)).IsTrue();
    }

    [Test]
    public async Task UnexpectedErrorsHideTheExceptionMessage()
    {
        var user = await CreateUserAsync("actor");
        await using var host = await SpaceApiHost.StartAsync(
            user.AuthId,
            configureServices: services => services.AddScoped<ListHandler>(_ => throw new InvalidOperationException("internal detail")));

        using var response = await host.Client.GetAsync("/api/units");
        var body = await response.Content.ReadAsStringAsync();
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, Json)!;

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.InternalServerError);
        await Assert.That(body).DoesNotContain("internal detail");
        await Assert.That(problem.Extensions["correlationId"]!.ToString())
            .IsEqualTo(response.Headers.GetValues(AppConstants.CorrelationId).Single());
    }

    [Test]
    public async Task EveryRequestGetsItsOwnCorrelationId()
    {
        var user = await CreateUserAsync("actor");
        await using var host = await SpaceApiHost.StartAsync(user.AuthId);

        using var first = new HttpRequestMessage(HttpMethod.Get, "/api/units?scope=System");
        first.Headers.Add(AppConstants.CorrelationId, "client-id");
        using var firstResponse = await host.Client.SendAsync(first);
        using var secondResponse = await host.Client.GetAsync("/api/units?scope=System");
        var firstId = firstResponse.Headers.GetValues(AppConstants.CorrelationId).Single();
        var secondId = secondResponse.Headers.GetValues(AppConstants.CorrelationId).Single();

        await Assert.That(firstId).IsNotEqualTo("client-id");
        await Assert.That(secondId).IsNotEqualTo(firstId);
    }

    [Test]
    public async Task UnitScopesListSystemPersonalAndSpaceUnits()
    {
        var user = await CreateUserAsync("actor", "Bucket");
        await using var host = await SpaceApiHost.StartAsync(user.AuthId);

        var system = await host.Client.GetFromJsonAsync<UnitPageResponse>("/api/units?scope=System", Json);
        var personal = await host.Client.GetFromJsonAsync<UnitPageResponse>("/api/units?scope=Personal&pageSize=2&page=2", Json);
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var spaceId = await dbContext.UserSpaces.Where(link => link.UserId == user.Id).Select(link => link.SpaceId).SingleAsync();
        var space = await host.Client.GetFromJsonAsync<UnitPageResponse>($"/api/units?scope={UnitScope.Space}&spaceId={spaceId}", Json);
        using var withoutSpace = await host.Client.GetAsync($"/api/units?scope={UnitScope.Space}");

        await Assert.That(system!.Items.All(unit => unit.CreatorType == CreatorType.System)).IsTrue();
        await Assert.That(system.TotalCount).IsEqualTo(system.Items.Count);
        await Assert.That(personal!.TotalCount).IsEqualTo(system.TotalCount + 1);
        await Assert.That(personal.CustomCount).IsEqualTo(1);
        await Assert.That(personal.Items.Count).IsEqualTo(2);
        await Assert.That(personal.Page).IsEqualTo(2);
        await Assert.That(space!.TotalCount).IsEqualTo(system.TotalCount);
        await Assert.That(withoutSpace.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task ProfileUpdatesAndConsumptionStatisticsUseCanonicalPaths()
    {
        var user = await CreateUserAsync("actor");
        await using var host = await SpaceApiHost.StartAsync(user.AuthId);
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var spaceId = await dbContext.UserSpaces.Where(link => link.UserId == user.Id).Select(link => link.SpaceId).SingleAsync();

        using var update = await host.Client.PutAsJsonAsync("/api/users/me", new UpdateUserRequest("Updated actor", null, null, null), Json);
        using var statistics = await host.Client.GetAsync($"/api/spaces/{spaceId}/consumptions/statistics?year=2026&month=October");
        using var previousUpdate = await host.Client.PutAsJsonAsync("/api/users", new UpdateUserRequest("Previous route", null, null, null), Json);
        using var previousStatistics = await host.Client.GetAsync($"/api/spaces/{spaceId}/consumptions/stats?year=2026&month=October");

        await Assert.That(update.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(statistics.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(previousUpdate.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(previousStatistics.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(await dbContext.Users.Where(item => item.Id == user.Id).Select(item => item.Name).SingleAsync()).IsEqualTo("Updated actor");
    }

    [Test]
    public async Task SpaceUnitsRequireMembership()
    {
        var user = await CreateUserAsync("actor");
        var outsider = await CreateUserAsync("outsider");
        await using var host = await SpaceApiHost.StartAsync(user.AuthId);
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var foreignSpaceId = await dbContext.UserSpaces.Where(link => link.UserId == outsider.Id).Select(link => link.SpaceId).SingleAsync();

        using var response = await host.Client.GetAsync($"/api/units?scope={UnitScope.Space}&spaceId={foreignSpaceId}");

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.Forbidden);
    }

    private static async Task<User> CreateUserAsync(string name, string? unitName = null)
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var admin = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Admin.Id);
        var user = User.Init($"{name}-auth", name, $"{name}@example.test");
        user.CompleteOnboarding(name, AnalyticsConsent.Declined, DateTime.UtcNow);
        user.UserSpaces.Add(UserSpace.Create(user, Space.Create($"{name} space"), admin));
        dbContext.Add(user);
        if (unitName is not null)
        {
            dbContext.Add(new Unit
            {
                Name = unitName,
                Symbol = unitName.ToLowerInvariant(),
                QuantityKey = $"Custom:{unitName}",
                CreatorType = CreatorType.User,
                ConversionType = UnitConversionType.None,
                OwnerUser = user
            });
        }

        await dbContext.SaveChangesAsync();
        return user;
    }
}
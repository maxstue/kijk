using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kijk.Application.Categories.Create;
using Kijk.Application.Categories.Shared;
using Kijk.Application.Categories.Update;
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

        using var first = new HttpRequestMessage(HttpMethod.Get, "/api/units");
        first.Headers.Add(AppConstants.CorrelationId, "client-id");
        using var firstResponse = await host.Client.SendAsync(first);
        using var secondResponse = await host.Client.GetAsync("/api/units");
        var firstId = firstResponse.Headers.GetValues(AppConstants.CorrelationId).Single();
        var secondId = secondResponse.Headers.GetValues(AppConstants.CorrelationId).Single();

        await Assert.That(firstId).IsNotEqualTo<string>("client-id");
        await Assert.That(secondId).IsNotEqualTo<string>(firstId);
    }

    [Test]
    public async Task UnitsListTheSystemCatalog()
    {
        var user = await CreateUserAsync("actor");
        await using var host = await SpaceApiHost.StartAsync(user.AuthId);

        var units = await host.Client.GetFromJsonAsync<List<UnitResponse>>("/api/units", Json);

        await Assert.That(units!.Count).IsEqualTo(12);
        await Assert.That(units.Select(unit => unit.Symbol)).Contains("km");
        await Assert.That(units.Single(unit => unit.Symbol == "pcs").QuantityKey).IsEqualTo("Count");
    }

    [Test]
    [Arguments("TRAVEL")]
    [Arguments(" travel ")]
    public async Task CategoryNamesUseNormalizedUniquenessForCreateAndUpdate(string duplicateName)
    {
        var user = await CreateUserAsync("actor");
        await using var host = await SpaceApiHost.StartAsync(user.AuthId);
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var spaceId = await dbContext.UserSpaces.Where(link => link.UserId == user.Id).Select(link => link.SpaceId).SingleAsync();
        var path = $"/api/spaces/{spaceId}/categories";

        using var created = await host.Client.PostAsJsonAsync(path, new CreateCategoryRequest("Travel", "circle", "#112233", CategoryKind.Expense), Json);
        var category = await created.Content.ReadFromJsonAsync<CategoryResponse>(Json);
        using var duplicate = await host.Client.PostAsJsonAsync(path, new CreateCategoryRequest(duplicateName, "circle", "#112233", CategoryKind.Expense), Json);
        using var systemDuplicate = await host.Client.PostAsJsonAsync(path, new CreateCategoryRequest(" gROCERIES ", "circle", "#112233", CategoryKind.Expense), Json);
        using var otherCreated = await host.Client.PostAsJsonAsync(path, new CreateCategoryRequest("Custom test category", "circle", "#112233", CategoryKind.Expense), Json);
        var other = await otherCreated.Content.ReadFromJsonAsync<CategoryResponse>(Json);
        using var update = await host.Client.PutAsJsonAsync($"{path}/{other!.Id}", new UpdateCategoryRequest(duplicateName, "circle", "#112233", CategoryKind.Expense), Json);
        using var unchanged = await host.Client.PutAsJsonAsync($"{path}/{category!.Id}", new UpdateCategoryRequest(duplicateName, "circle", "#112233", CategoryKind.Expense), Json);

        await Assert.That(created.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(duplicate.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await Assert.That(systemDuplicate.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await Assert.That(otherCreated.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(update.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await Assert.That(unchanged.StatusCode).IsEqualTo(HttpStatusCode.OK);
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

    private static async Task<User> CreateUserAsync(string name)
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var admin = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Admin.Id);
        var user = User.Init($"{name}-auth", name, $"{name}@example.test");
        user.CompleteOnboarding(name, AnalyticsConsent.Declined, DateTime.UtcNow);
        user.UserSpaces.Add(UserSpace.Create(user, Space.Create($"{name} space"), admin));
        dbContext.Add(user);
        await dbContext.SaveChangesAsync();
        return user;
    }
}
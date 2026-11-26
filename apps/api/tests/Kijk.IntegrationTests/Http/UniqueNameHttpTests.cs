using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kijk.Application.Shared.Identity;
using Kijk.Application.Users.CompleteOnboarding;
using Kijk.Application.Users.Shared;
using Kijk.Application.Users.Update;
using Kijk.Domain.Entities;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Npgsql;

namespace Kijk.IntegrationTests.Http;

// Every user has a unique name (Max#4821) of the Kijk user name and a four-digit number, unique ignoring case.
[NotInParallel]
public class UniqueNameHttpTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task OnboardingAssignsAUniqueNameFromTheKijkUserName()
    {
        await using var host = await SpaceApiHost.StartAsync(
            "newcomer-auth",
            configureServices: services => services.Replace(ServiceDescriptor.Scoped<IIdentityProvider, FakeIdentityProvider>()));

        using var welcomed = await host.Client.PutAsJsonAsync("/api/users/onboarding", new WelcomeUserRequest(" Max ", null, false, true, AnalyticsConsent.Declined), Json);
        await Assert.That(welcomed.StatusCode).IsEqualTo(HttpStatusCode.OK);
        var uniqueName = await CurrentUniqueNameAsync(welcomed);

        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var user = await dbContext.Users.SingleAsync(item => item.AuthId == "newcomer-auth");
        await Assert.That(user.Name).IsEqualTo("Max");
        await Assert.That(user.Tag).IsBetween(User.MinTag, User.MaxTag);
        // The unique name uses the Kijk user name, never the full name from the identity provider.
        await Assert.That(uniqueName).IsEqualTo($"Max#{user.Tag:D4}");
    }

    [Test]
    public async Task RenamingKeepsTheNumberWhileTheCombinationIsFree()
    {
        var user = await SeedAsync("Max", 42, "max-auth");
        await using var host = await SpaceApiHost.StartAsync(
            user.AuthId,
            configureServices: services => services.Replace(ServiceDescriptor.Scoped<IIdentityProvider, FakeIdentityProvider>()));

        var renamed = await RenameAsync(host, "Moritz");

        await Assert.That(renamed.UniqueName).IsEqualTo("Moritz#0042");
        using var me = await host.Client.GetAsync("/api/users/me");
        await Assert.That(await CurrentUniqueNameAsync(me)).IsEqualTo("Moritz#0042");
    }

    [Test]
    public async Task RenamingToATakenCombinationAssignsAFreeNumberIgnoringCase()
    {
        await SeedAsync("Moritz", 42, "other-auth");
        var user = await SeedAsync("Max", 42, "max-auth");
        await using var host = await SpaceApiHost.StartAsync(user.AuthId);

        var renamed = await RenameAsync(host, "moritz");

        await Assert.That(renamed.Name).IsEqualTo("moritz");
        await Assert.That(renamed.Tag).IsNotEqualTo(42).And.IsBetween(User.MinTag, User.MaxTag);
        await Assert.That(renamed.UniqueName).IsEqualTo($"moritz#{renamed.Tag:D4}");
    }

    [Test]
    public async Task RenamingIsAConflictWhenEveryNumberOfTheNameIsTaken()
    {
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            for (var tag = User.MinTag; tag <= User.MaxTag; tag++)
            {
                var other = User.Init($"full-{tag}", "Full", null);
                other.AssignTag(tag);
                dbContext.Users.Add(other);
            }

            await dbContext.SaveChangesAsync();
        }

        var user = await SeedAsync("Max", 42, "max-auth");
        await using var host = await SpaceApiHost.StartAsync(user.AuthId);

        using var response = await host.Client.PutAsJsonAsync("/api/users/me", new UpdateUserRequest("FULL", null, null, null), Json);

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.Conflict);
        await using var verify = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That((await verify.Users.SingleAsync(item => item.Id == user.Id)).UniqueName).IsEqualTo("Max#0042");
    }

    [Test]
    [Arguments("Max#1234")]
    [Arguments("max@example.test")]
    public async Task NamesWithSeparatorsAreRejected(string name)
    {
        var user = await SeedAsync("Max", 42, "max-auth");
        await using var host = await SpaceApiHost.StartAsync(user.AuthId);

        using var response = await host.Client.PutAsJsonAsync("/api/users/me", new UpdateUserRequest(name, null, null, null), Json);

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task DatabaseRejectsTheSameCombinationIgnoringCase()
    {
        await SeedAsync("Max", 42, "first-auth");
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var duplicate = User.Init("second-auth", "MAX", null);
        duplicate.AssignTag(42);
        dbContext.Users.Add(duplicate);

        var failure = await Assert.ThrowsAsync<DbUpdateException>(() => dbContext.SaveChangesAsync());

        await Assert.That((failure!.InnerException as PostgresException)?.SqlState).IsEqualTo(PostgresErrorCodes.UniqueViolation);
    }

    // CurrentUserResponse has a private constructor, so the test reads the property from the JSON.
    private static async Task<string?> CurrentUniqueNameAsync(HttpResponseMessage response)
    {
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return document.RootElement.GetProperty("user").GetProperty("uniqueName").GetString();
    }

    private static async Task<UserResponse> RenameAsync(SpaceApiHost host, string name)
    {
        using var response = await host.Client.PutAsJsonAsync("/api/users/me", new UpdateUserRequest(name, null, null, null), Json);
        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<UserResponse>(Json))!;
    }

    private static async Task<User> SeedAsync(string name, int tag, string authId)
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var user = User.Init(authId, name, null);
        user.AssignTag(tag);
        user.CompleteOnboarding(name, AnalyticsConsent.Declined, DateTime.UtcNow);
        user.UserSpaces.Add(UserSpace.Create(user, Space.CreatePersonal(), await dbContext.Roles.SingleAsync(role => role.Name == "Admin")));
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        return user;
    }

    private sealed class FakeIdentityProvider : IIdentityProvider
    {
        public Task<ExternalIdentity> GetAsync(string authId, CancellationToken cancellationToken) =>
            Task.FromResult(new ExternalIdentity("Maximilian Mustermann", "newcomer@example.test", null, true));

        public Task SetUseProfileInKijkAsync(string authId, bool useProfileInKijk, CancellationToken cancellationToken) => Task.CompletedTask;

        public Task DeleteAsync(string authId, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
using System.Net;
using System.Net.Http.Json;
using Kijk.Application.Consumptions.Update;
using Kijk.Application.Households.ChangeMemberRole;
using Kijk.Application.Households.Update;
using Kijk.Application.Limits.Create;
using Kijk.Application.Limits.Update;
using Kijk.Application.Resources.Update;
using Kijk.Domain.Authorization;
using Kijk.Domain.Entities;
using Kijk.Domain.ValueObjects;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;

namespace Kijk.IntegrationTests.Http;

[NotInParallel]
public class HouseholdPermissionHttpTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    [Arguments("Admin")]
    [Arguments("Member")]
    [Arguments("Viewer")]
    public async Task EveryRoleCanReadHouseholdData(string role)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);

        foreach (var path in new[] { "/api/resources", "/api/consumptions", "/api/limits", $"/api/limits/{fixture.Limit.Id}", $"/api/households/{fixture.Household.Id}/members" })
        {
            using var response = await host.Client.GetAsync(path);
            if (response.StatusCode != HttpStatusCode.OK)
            {
                throw new InvalidOperationException($"{path}: {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
            }
            await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.OK);
        }
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.OK)]
    [Arguments("Member", HttpStatusCode.OK)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task ExportRequiresExportPermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.GetAsync($"/api/consumptions/{fixture.Consumption.Id}/export");

        await Assert.That(response.StatusCode).IsEqualTo(expected);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.OK)]
    [Arguments("Member", HttpStatusCode.OK)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task RecordingRequiresRecordPermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/consumptions/{fixture.Consumption.Id}",
            new UpdateConsumptionRequest("Updated reading", 15m, UpdateConsumptionValueTypes.Relative, null, null));

        await Assert.That(response.StatusCode).IsEqualTo(expected);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var value = await verification.Consumptions.Where(item => item.Id == fixture.Consumption.Id).Select(item => item.Name).SingleAsync();
        await Assert.That(value).IsEqualTo(expected == HttpStatusCode.OK ? "Updated reading" : "Reading");
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.OK)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task PlanningRequiresPlanPermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/limits/{fixture.Limit.Id}",
            new UpdateLimitRequest("Updated budget", null, 200m, fixture.Limit.Period, true));

        await Assert.That(response.StatusCode).IsEqualTo(expected);
        using var created = await host.Client.PostAsJsonAsync("/api/limits",
            new CreateLimitRequest("Yearly budget", null, 500m, Period.Year, true, fixture.Resource.Id));
        await Assert.That(created.StatusCode).IsEqualTo(expected == HttpStatusCode.OK ? HttpStatusCode.Created : HttpStatusCode.Forbidden);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.OK)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task ResourceChangesRequireConfigurePermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/resources/{fixture.Resource.Id}",
            new UpdateResourceRequest("Updated resource", null, null, null));

        await Assert.That(response.StatusCode).IsEqualTo(expected);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.NoContent)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task SharingOwnedUnitsRequiresSharePermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsync($"/api/units/{fixture.Unit.Id}/households/{fixture.Household.Id}", null);

        await Assert.That(response.StatusCode).IsEqualTo(expected);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.NoContent)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task HouseholdChangesRequireConfigurePermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/households/{fixture.Household.Id}", new UpdateHouseholdRequest("Updated household", null));

        await Assert.That(response.StatusCode).IsEqualTo(expected);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.NoContent)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task HouseholdDeletionRequiresDeletePermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.DeleteAsync($"/api/households/{fixture.Household.Id}");

        await Assert.That(response.StatusCode).IsEqualTo(expected);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.Households.AnyAsync(item => item.Id == fixture.Household.Id)).IsEqualTo(expected == HttpStatusCode.Forbidden);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.OK)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task ChangingAnotherMembersRoleRequiresAssignRolePermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/households/{fixture.Household.Id}/members/{fixture.OtherUser.Id}/role",
            new ChangeMemberRoleRequest(HouseholdRoles.Viewer.Id));

        await Assert.That(response.StatusCode).IsEqualTo(expected);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var roleId = await verification.UserHouseholds.Where(link => link.UserId == fixture.OtherUser.Id).Select(link => link.RoleId).SingleAsync();
        await Assert.That(roleId).IsEqualTo(expected == HttpStatusCode.OK ? HouseholdRoles.Viewer.Id : HouseholdRoles.Member.Id);
    }

    [Test]
    public async Task AdminCannotChangeTheirOwnRole()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/households/{fixture.Household.Id}/members/{fixture.User.Id}/role",
            new ChangeMemberRoleRequest(HouseholdRoles.Member.Id));

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var roleId = await verification.UserHouseholds.Where(link => link.UserId == fixture.User.Id).Select(link => link.RoleId).SingleAsync();
        await Assert.That(roleId).IsEqualTo(HouseholdRoles.Admin.Id);
    }

    [Test]
    [Arguments("Admin", "Viewer", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", "Admin", HttpStatusCode.NoContent)]
    public async Task RouteHouseholdPermissionUsesThatHouseholdsRoleInsteadOfTheActiveRole(string activeRole, string routeRole, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(activeRole);
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var otherHousehold = Household.Create("Other household");
        var user = await dbContext.Users.SingleAsync(item => item.Id == fixture.User.Id);
        var role = await dbContext.Roles.SingleAsync(item => item.Name == routeRole);
        dbContext.UserHouseholds.Add(UserHousehold.Create(user, otherHousehold, role));
        await dbContext.SaveChangesAsync();
        await using var host = await HouseholdApiHost.StartAsync(user.AuthId);

        using var changed = await host.Client.PutAsJsonAsync($"/api/households/{otherHousehold.Id}", new UpdateHouseholdRequest("Other renamed", null));
        using var readable = await host.Client.GetAsync($"/api/households/{otherHousehold.Id}/members");
        using var unknown = await host.Client.GetAsync($"/api/households/{Guid.NewGuid()}/members");

        await Assert.That(changed.StatusCode).IsEqualTo(expected);
        await Assert.That(readable.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(unknown.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
    }

    [Test]
    public async Task ChangedDatabaseRoleTakesEffectOnTheNextRequestWithTheSameIdentity()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var admin = await HouseholdApiHost.StartAsync(fixture.User.AuthId);
        using var member = admin.CreateClient(fixture.OtherUser.AuthId);
        // The identity stays unchanged: permission changes must come from the DB, not token claims.
        using var before = await member.GetAsync($"/api/consumptions/{fixture.Consumption.Id}/export");
        using var change = await admin.Client.PutAsJsonAsync($"/api/households/{fixture.Household.Id}/members/{fixture.OtherUser.Id}/role", new ChangeMemberRoleRequest(HouseholdRoles.Viewer.Id));
        using var after = await member.GetAsync($"/api/consumptions/{fixture.Consumption.Id}/export");

        await Assert.That(before.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(change.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(after.StatusCode).IsEqualTo(HttpStatusCode.Forbidden);
    }

    private static async Task<Fixture> CreateFixtureAsync(string roleName)
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = Household.Create("Shared household");
        var role = await dbContext.Roles.SingleAsync(item => item.Name == roleName);
        var member = await dbContext.Roles.SingleAsync(item => item.Id == HouseholdRoles.Member.Id);
        var user = CreateUser("actor");
        var otherUser = CreateUser("other");
        user.UserHouseholds.Add(UserHousehold.Create(user, household, role, isActive: true));
        otherUser.UserHouseholds.Add(UserHousehold.Create(otherUser, household, member, isActive: true));
        var systemUnit = await dbContext.Units.SingleAsync(item => item.Id == new Guid("11111111-1111-4111-8111-111111111113"));
        var resource = new Resource { Name = "Gas", Unit = systemUnit, Color = "#334455", Icon = "flame", CreatorType = CreatorType.User, Household = household };
        user.AddResource(resource);
        otherUser.AddResource(resource);
        var consumption = Consumption.Create("Reading", resource, household, new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc), new ConsumptionReading(10m, ConsumptionValueType.Relative, 10m));
        var limit = Limit.Create(new("Budget", null, 100m, Period.Month, true), resource, user, household);
        var unit = new Unit { Name = "Bucket", Symbol = "bucket", QuantityKey = "Custom:bucket", CreatorType = CreatorType.User, ConversionType = UnitConversionType.None, OwnerUser = user };
        dbContext.AddRange(user, otherUser, resource, consumption, limit, unit);
        await dbContext.SaveChangesAsync();
        return new(household, user, otherUser, resource, consumption, limit, unit);
    }

    private static User CreateUser(string name)
    {
        var user = User.Init($"{name}-auth", name, $"{name}@example.test");
        user.CompleteOnboarding(name, AnalyticsConsent.Declined, DateTime.UtcNow);
        return user;
    }

    private sealed record Fixture(Household Household, User User, User OtherUser, Resource Resource, Consumption Consumption, Limit Limit, Unit Unit);
}
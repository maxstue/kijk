using System.Net;
using System.Net.Http.Json;
using Kijk.Application.Consumptions.Record;
using Kijk.Application.Consumptions.Update;
using Kijk.Application.Dashboard.Queries;
using Kijk.Application.Imports.Settings;
using Kijk.Application.Limits.Create;
using Kijk.Application.Limits.Update;
using Kijk.Application.Resources.Update;
using Kijk.Application.Shared.Features;
using Kijk.Application.Spaces.ChangeMemberRole;
using Kijk.Application.Spaces.Update;
using Kijk.Domain.Authorization;
using Kijk.Domain.Catalogs;
using Kijk.Domain.Entities;
using Kijk.Domain.ValueObjects;
using Kijk.IntegrationTests.Persistence;
using Kijk.Shared;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kijk.IntegrationTests.Http;

[NotInParallel]
public class SpacePermissionHttpTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    [Arguments("Admin")]
    [Arguments("Member")]
    [Arguments("Viewer")]
    public async Task EveryRoleCanReadSpaceData(string role)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);

        foreach (var path in new[] { $"/api/spaces/{fixture.Space.Id}/resources", $"/api/spaces/{fixture.Space.Id}/consumptions", $"/api/spaces/{fixture.Space.Id}/limits", $"/api/spaces/{fixture.Space.Id}/limits/{fixture.Limit.Id}", $"/api/spaces/{fixture.Space.Id}/members" })
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
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.GetAsync($"/api/spaces/{fixture.Space.Id}/consumptions/{fixture.Consumption.Id}/export");

        await Assert.That(response.StatusCode).IsEqualTo(expected);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.OK)]
    [Arguments("Member", HttpStatusCode.OK)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task RecordingRequiresRecordPermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}/consumptions/{fixture.Consumption.Id}",
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
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}/limits/{fixture.Limit.Id}",
            new UpdateLimitRequest("Updated budget", null, 200m, fixture.Limit.Period, true));

        await Assert.That(response.StatusCode).IsEqualTo(expected);
        using var created = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Space.Id}/limits",
            new CreateLimitRequest("Yearly budget", null, 500m, Period.Year, true, fixture.Resource.Id));
        await Assert.That(created.StatusCode).IsEqualTo(expected == HttpStatusCode.OK ? HttpStatusCode.Created : HttpStatusCode.Forbidden);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.NoContent)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task LimitDeletionRequiresPlanPermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.DeleteAsync($"/api/spaces/{fixture.Space.Id}/limits/{fixture.Limit.Id}");

        await Assert.That(response.StatusCode).IsEqualTo(expected);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.Limits.AnyAsync(item => item.Id == fixture.Limit.Id))
            .IsEqualTo(expected == HttpStatusCode.Forbidden);
        await Assert.That(await verification.Resources.AnyAsync(item => item.Id == fixture.Resource.Id)).IsTrue();
        await Assert.That(await verification.Consumptions.AnyAsync(item => item.Id == fixture.Consumption.Id)).IsTrue();
    }

    [Test]
    public async Task LimitDeletionReturnsNotFoundForMissingOrOtherSpaceLimits()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var otherSpace = Space.Create("Other space");
        var resource = await dbContext.Resources.SingleAsync(item => item.Id == fixture.Resource.Id);
        var user = await dbContext.Users.SingleAsync(item => item.Id == fixture.User.Id);
        var otherLimit = Limit.Create(new("Other limit", null, 100m, Period.Month, true), resource, user, otherSpace);
        dbContext.Add(otherLimit);
        await dbContext.SaveChangesAsync();
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);

        using var missing = await host.Client.DeleteAsync($"/api/spaces/{fixture.Space.Id}/limits/{Guid.NewGuid()}");
        using var inaccessible = await host.Client.DeleteAsync($"/api/spaces/{fixture.Space.Id}/limits/{otherLimit.Id}");
        await Assert.That(missing.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(inaccessible.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.Limits.AnyAsync(item => item.Id == otherLimit.Id)).IsTrue();
        await Assert.That(await verification.Limits.AnyAsync(item => item.Id == fixture.Limit.Id)).IsTrue();
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.OK)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task ResourceChangesRequireConfigurePermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}/resources/{fixture.Resource.Id}",
            new UpdateResourceRequest("Updated resource", null, null, null));

        await Assert.That(response.StatusCode).IsEqualTo(expected);
    }

    [Test]
    public async Task SeveralFailedRulesOfOnePropertyAreAllReported()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}/resources/{fixture.Resource.Id}",
            new UpdateResourceRequest(string.Empty, null, null, null));

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>();
        await Assert.That(problem!.Errors["Name"].Length).IsGreaterThan(1);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.NoContent)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task SharingOwnedUnitsRequiresSharePermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsync($"/api/units/{fixture.Unit.Id}/spaces/{fixture.Space.Id}", null);

        await Assert.That(response.StatusCode).IsEqualTo(expected);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.NoContent)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task SpaceChangesRequireConfigurePermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}", new UpdateSpaceRequest("Updated space", null));

        await Assert.That(response.StatusCode).IsEqualTo(expected);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.NoContent)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task SpaceDeletionRequiresDeletePermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.DeleteAsync($"/api/spaces/{fixture.Space.Id}");

        await Assert.That(response.StatusCode).IsEqualTo(expected);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verification.Spaces.AnyAsync(item => item.Id == fixture.Space.Id)).IsEqualTo(expected == HttpStatusCode.Forbidden);
    }

    [Test]
    [Arguments("Admin", HttpStatusCode.OK)]
    [Arguments("Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", HttpStatusCode.Forbidden)]
    public async Task ChangingAnotherMembersRoleRequiresAssignRolePermission(string role, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(role);
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}/members/{fixture.OtherUser.Id}/role",
            new ChangeMemberRoleRequest(SpaceRoles.Viewer.Id));

        await Assert.That(response.StatusCode).IsEqualTo(expected);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var roleId = await verification.UserSpaces.Where(link => link.UserId == fixture.OtherUser.Id).Select(link => link.RoleId).SingleAsync();
        await Assert.That(roleId).IsEqualTo(expected == HttpStatusCode.OK ? SpaceRoles.Viewer.Id : SpaceRoles.Member.Id);
    }

    [Test]
    public async Task ConcurrentRoleChangesCannotRemoveBothAdministrators()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using (var seed = PostgreSqlTestDatabase.CreateDbContext())
        {
            var membership = await seed.UserSpaces.SingleAsync(link => link.UserId == fixture.OtherUser.Id);
            membership.ChangeRole(await seed.Roles.SingleAsync(role => role.Id == SpaceRoles.Admin.Id));
            await seed.SaveChangesAsync();
        }
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var other = host.CreateClient(fixture.OtherUser.AuthId);
        var responses = await Task.WhenAll(
            host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}/members/{fixture.OtherUser.Id}/role", new ChangeMemberRoleRequest(SpaceRoles.Member.Id)),
            other.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}/members/{fixture.User.Id}/role", new ChangeMemberRoleRequest(SpaceRoles.Member.Id)));
        try
        {
            await Assert.That(responses.Select(response => response.StatusCode))
                .IsEquivalentTo(new[] { HttpStatusCode.OK, HttpStatusCode.Forbidden });
            await using var verification = PostgreSqlTestDatabase.CreateDbContext();
            await Assert.That(await verification.UserSpaces.CountAsync(link => link.SpaceId == fixture.Space.Id && link.RoleId == SpaceRoles.Admin.Id)).IsEqualTo(1);
        }
        finally
        {
            foreach (var response in responses)
            {
                response.Dispose();
            }
        }
    }

    [Test]
    [Arguments("name")]
    [Arguments("value")]
    [Arguments("date")]
    [Arguments("type")]
    [Arguments("resource")]
    public async Task InvalidConsumptionChangesAreRejectedWithoutSaving(string field)
    {
        var fixture = await CreateFixtureAsync("Member");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        var request = new UpdateConsumptionRequest(
            field == "name" ? "" : null,
            field == "value" ? -5 : null,
            field == "type" ? (UpdateConsumptionValueTypes)123 : UpdateConsumptionValueTypes.Relative,
            field == "resource" ? Guid.Empty : null,
            field == "date" ? DateTime.UtcNow.AddDays(1) : null);

        using var response = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}/consumptions/{fixture.Consumption.Id}", request);

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        using var createResponse = await host.Client.PostAsJsonAsync($"/api/spaces/{fixture.Space.Id}/consumptions",
            new CreateConsumptionRequest(
                field == "name" ? "" : "Reading",
                field == "value" ? -5 : 1,
                field == "type" ? (CreateConsumptionValueTypes)123 : CreateConsumptionValueTypes.Relative,
                field == "resource" ? Guid.Empty : fixture.Resource.Id,
                field == "date" ? DateTime.UtcNow.AddDays(1) : DateTime.UtcNow.Date));
        await Assert.That(createResponse.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var stored = await verification.Consumptions.SingleAsync(item => item.Id == fixture.Consumption.Id);
        await Assert.That(stored.Name).IsEqualTo("Reading");
        await Assert.That(stored.Value).IsEqualTo(10m);
        await Assert.That(stored.Date).IsEqualTo(fixture.Consumption.Date);
    }

    [Test]
    [Arguments(false)]
    [Arguments(true)]
    public async Task RenamingAConsumptionPreservesItsValueTypeAndMeterSegment(bool startsNewMeterSegment)
    {
        var fixture = await CreateFixtureAsync("Member");
        var valueType = startsNewMeterSegment ? ConsumptionValueType.Absolute : ConsumptionValueType.Relative;
        await using (var seed = PostgreSqlTestDatabase.CreateDbContext())
        {
            var entry = await seed.Consumptions.SingleAsync(item => item.Id == fixture.Consumption.Id);
            entry.ValueType = valueType;
            entry.StartsNewMeterSegment = startsNewMeterSegment;
            await seed.SaveChangesAsync();
        }
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}/consumptions/{fixture.Consumption.Id}", new { name = "Renamed reading" });

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var stored = await verification.Consumptions.SingleAsync(item => item.Id == fixture.Consumption.Id);
        await Assert.That(stored.Name).IsEqualTo("Renamed reading");
        await Assert.That(stored.ValueType).IsEqualTo(valueType);
        await Assert.That(stored.StartsNewMeterSegment).IsEqualTo(startsNewMeterSegment);
        await Assert.That(stored.Value).IsEqualTo(fixture.Consumption.Value);
    }

    [Test]
    public async Task MeterSegmentChangesUseTheExistingValueTypeWhenOmitted()
    {
        var fixture = await CreateFixtureAsync("Member");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        var path = $"/api/spaces/{fixture.Space.Id}/consumptions/{fixture.Consumption.Id}";
        using var invalid = await host.Client.PutAsJsonAsync(path, new { startsNewMeterSegment = true });
        await Assert.That(invalid.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        using var reset = await host.Client.PutAsJsonAsync(path, new UpdateConsumptionRequest(null, 0, UpdateConsumptionValueTypes.Absolute, null, null, true));
        reset.EnsureSuccessStatusCode();
        using var renamed = await host.Client.PutAsJsonAsync(path, new { name = "New meter" });
        renamed.EnsureSuccessStatusCode();
        using var clearReset = await host.Client.PutAsJsonAsync(path, new { startsNewMeterSegment = false });
        clearReset.EnsureSuccessStatusCode();

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var stored = await verification.Consumptions.SingleAsync(item => item.Id == fixture.Consumption.Id);
        await Assert.That(stored.ValueType).IsEqualTo(ConsumptionValueType.Absolute);
        await Assert.That(stored.StartsNewMeterSegment).IsFalse();
        await Assert.That(stored.Value).IsEqualTo(0m);
    }

    [Test]
    public async Task ANewMeterCanStartAtZero()
    {
        var fixture = await CreateFixtureAsync("Member");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}/consumptions/{fixture.Consumption.Id}",
            new UpdateConsumptionRequest(null, 0, UpdateConsumptionValueTypes.Absolute, null, null, true));

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var stored = await verification.Consumptions.SingleAsync(item => item.Id == fixture.Consumption.Id);
        await Assert.That(stored.Value).IsEqualTo(0m);
        await Assert.That(stored.StartsNewMeterSegment).IsTrue();
    }

    [Test]
    public async Task AdminCannotChangeTheirOwnRole()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var response = await host.Client.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}/members/{fixture.User.Id}/role",
            new ChangeMemberRoleRequest(SpaceRoles.Member.Id));

        await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var roleId = await verification.UserSpaces.Where(link => link.UserId == fixture.User.Id).Select(link => link.RoleId).SingleAsync();
        await Assert.That(roleId).IsEqualTo(SpaceRoles.Admin.Id);
    }

    [Test]
    [Arguments("Admin", "Viewer", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", "Admin", HttpStatusCode.NoContent)]
    public async Task RouteSpacePermissionUsesThatSpacesRoleInsteadOfTheActiveRole(string activeRole, string routeRole, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(activeRole);
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var otherSpace = Space.Create("Other space");
        var user = await dbContext.Users.SingleAsync(item => item.Id == fixture.User.Id);
        var role = await dbContext.Roles.SingleAsync(item => item.Name == routeRole);
        dbContext.UserSpaces.Add(UserSpace.Create(user, otherSpace, role));
        await dbContext.SaveChangesAsync();
        await using var host = await SpaceApiHost.StartAsync(user.AuthId);

        using var changed = await host.Client.PutAsJsonAsync($"/api/spaces/{otherSpace.Id}", new UpdateSpaceRequest("Other renamed", null));
        using var readable = await host.Client.GetAsync($"/api/spaces/{otherSpace.Id}/members");
        using var unknown = await host.Client.GetAsync($"/api/spaces/{Guid.NewGuid()}/members");

        await Assert.That(changed.StatusCode).IsEqualTo(expected);
        await Assert.That(readable.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(unknown.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
    }

    [Test]
    public async Task ChangedDatabaseRoleTakesEffectOnTheNextRequestWithTheSameIdentity()
    {
        var fixture = await CreateFixtureAsync("Admin");
        await using var admin = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        using var member = admin.CreateClient(fixture.OtherUser.AuthId);
        // The identity stays unchanged: permission changes must come from the DB, not token claims.
        using var before = await member.GetAsync($"/api/spaces/{fixture.Space.Id}/consumptions/{fixture.Consumption.Id}/export");
        using var change = await admin.Client.PutAsJsonAsync($"/api/spaces/{fixture.Space.Id}/members/{fixture.OtherUser.Id}/role", new ChangeMemberRoleRequest(SpaceRoles.Viewer.Id));
        using var after = await member.GetAsync($"/api/spaces/{fixture.Space.Id}/consumptions/{fixture.Consumption.Id}/export");

        await Assert.That(before.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(change.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(after.StatusCode).IsEqualTo(HttpStatusCode.Forbidden);
    }

    [Test]
    [Arguments("Admin", "Viewer", HttpStatusCode.Forbidden)]
    [Arguments("Admin", "Member", HttpStatusCode.Forbidden)]
    [Arguments("Viewer", "Admin", HttpStatusCode.OK)]
    public async Task ImportSettingsUseTheSelectedSpacesPermissionsAndLeaveTheActiveSpaceUnchanged(
        string activeRole, string routeRole, HttpStatusCode expected)
    {
        var fixture = await CreateFixtureAsync(activeRole);
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var otherSpace = Space.Create("Other household");
        var user = await dbContext.Users.SingleAsync(item => item.Id == fixture.User.Id);
        var role = await dbContext.Roles.SingleAsync(item => item.Name == routeRole);
        dbContext.UserSpaces.Add(UserSpace.Create(user, otherSpace, role));
        await dbContext.SaveChangesAsync();
        await using var host = await SpaceApiHost.StartAsync(user.AuthId);

        using var readable = await host.Client.GetAsync($"/api/spaces/{otherSpace.Id}/imports/settings");
        using var changed = await host.Client.PutAsJsonAsync($"/api/spaces/{otherSpace.Id}/imports/settings",
            new UpdateImportSettingsRequest(PurposeRetention.Remove, MinimizeData: true));
        using var unknown = await host.Client.GetAsync($"/api/spaces/{Guid.NewGuid()}/imports/settings");
        using var unknownUpdate = await host.Client.PutAsJsonAsync($"/api/spaces/{Guid.NewGuid()}/imports/settings",
            new UpdateImportSettingsRequest(PurposeRetention.Remove));

        await Assert.That(readable.StatusCode).IsEqualTo(HttpStatusCode.OK);
        await Assert.That(changed.StatusCode).IsEqualTo(expected);
        await Assert.That(unknown.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
        await Assert.That(unknownUpdate.StatusCode).IsEqualTo(HttpStatusCode.NotFound);

        await using var verification = PostgreSqlTestDatabase.CreateDbContext();
        var active = await verification.Spaces.SingleAsync(item => item.Id == fixture.Space.Id);
        var selected = await verification.Spaces.SingleAsync(item => item.Id == otherSpace.Id);
        await Assert.That(active.PurposeRetention).IsEqualTo(fixture.Space.PurposeRetention);
        await Assert.That(active.MinimizeData).IsEqualTo(fixture.Space.MinimizeData);
        await Assert.That(selected.PurposeRetention).IsEqualTo(expected == HttpStatusCode.OK ? PurposeRetention.Remove : otherSpace.PurposeRetention);
        await Assert.That(selected.MinimizeData).IsEqualTo(expected == HttpStatusCode.OK);
    }

    [Test]
    [Arguments("Admin")]
    [Arguments("Member")]
    [Arguments("Viewer")]
    public async Task DashboardExcludesPrivateBookingsEvenForTheirOwner(string role)
    {
        var fixture = await CreateFixtureAsync(role);
        await using (var db = PostgreSqlTestDatabase.CreateDbContext())
        {
            var user = await db.Users.SingleAsync(item => item.Id == fixture.User.Id);
            var space = await db.Spaces.SingleAsync(item => item.Id == fixture.Space.Id);
            var shared = Account.Create("Shared", null, space);
            var secret = Account.Create("Private", null, space);
            var otherSpace = Space.Create("Other space");
            secret.SetOwner(user.Id);
            var date = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
            db.AddRange(shared, secret,
                Transaction.Create(new(date, 10000m, null, null, TransactionStatus.Booked, false), null, user, otherSpace),
                Transaction.Create(new(date, 50m, null, null, TransactionStatus.Booked, false), shared, user, space),
                Transaction.Create(new(date, -20m, null, null, TransactionStatus.Booked, false), shared, user, space),
                Transaction.Create(new(date, 999m, null, null, TransactionStatus.Booked, false), secret, user, space),
                Transaction.Create(new(date, 700m, null, null, TransactionStatus.Pending, false), shared, user, space),
                Transaction.Create(new(date, 800m, null, null, TransactionStatus.Booked, true), shared, user, space));
            await db.SaveChangesAsync();
        }
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId,
            configureServices: services => services.AddSingleton<IFeatureFlags>(new DashboardFlags(true)));
        using var other = host.CreateClient(fixture.OtherUser.AuthId);
        var path = $"/api/spaces/{fixture.Space.Id}/dashboard/finances?year=2026";
        var ownerResult = await host.Client.GetStringAsync(path);
        await Assert.That(await other.GetStringAsync(path)).IsEqualTo(ownerResult);
        var data = await host.Client.GetFromJsonAsync<List<FinanceMonth>>(path);
        await Assert.That(data!.Count).IsEqualTo(12);
        var september = data.Single(item => item.Month == 9);
        await Assert.That(september.Income).IsEqualTo(50m);
        await Assert.That(september.Expenses).IsEqualTo(20m);
        await Assert.That(september.Balance).IsEqualTo(30m);
        await Assert.That(data.Single(item => item.Month == 1).HasData).IsFalse();
    }

    [Test]
    public async Task DashboardUsesSelectedPeriodAndKeepsConsumptionsAvailableWithoutFinances()
    {
        var fixture = await CreateFixtureAsync("Viewer");
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId,
            configureServices: services => services.AddSingleton<IFeatureFlags>(new DashboardFlags(false)));
        var root = $"/api/spaces/{fixture.Space.Id}/dashboard";
        using var finances = await host.Client.GetAsync($"{root}/finances?year=2026");
        await Assert.That(finances.IsSuccessStatusCode).IsFalse();
        using var budgets = await host.Client.GetAsync($"{root}/budgets?year=2026&month=9");
        await Assert.That(budgets.IsSuccessStatusCode).IsFalse();
        var consumption = await host.Client.GetFromJsonAsync<List<ConsumptionMonth>>($"{root}/consumptions?year=2026");
        await Assert.That(consumption!.Single().Value).IsEqualTo(10m);
        var limits = await host.Client.GetFromJsonAsync<List<DashboardLimit>>($"{root}/limits?year=2026&month=9");
        await Assert.That(limits!.Single().ActualValue).IsEqualTo(10m);
        await Assert.That(limits!.Single().Remaining).IsEqualTo(90m);
        using var foreign = await host.Client.GetAsync($"/api/spaces/{Guid.NewGuid()}/dashboard/consumptions?year=2026");
        await Assert.That(foreign.StatusCode).IsEqualTo(HttpStatusCode.NotFound);
    }

    [Test]
    [Arguments(20, 0, 50)]
    [Arguments(10, 0, 100)]
    [Arguments(5, 5, 200)]
    [Arguments(0, 10, -1)]
    public async Task DashboardLimitsDistinguishReachedExceededAndZero(int threshold, int overrun, int percentage)
    {
        var fixture = await CreateFixtureAsync("Viewer");
        await using (var db = PostgreSqlTestDatabase.CreateDbContext())
        {
            var limit = await db.Limits.SingleAsync(item => item.Id == fixture.Limit.Id);
            limit.Threshold = threshold;
            await db.SaveChangesAsync();
        }
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        var data = await host.Client.GetFromJsonAsync<List<DashboardLimit>>($"/api/spaces/{fixture.Space.Id}/dashboard/limits?year=2026&month=9");
        await Assert.That(data!.Single().Overrun).IsEqualTo((decimal)overrun);
        await Assert.That(data!.Single().Percentage).IsEqualTo(percentage == -1 ? (decimal?)null : percentage);
    }

    [Test]
    public async Task DashboardBudgetsUseSharedBookingsAndVersionsAndReturnTopThreeBudgets()
    {
        var fixture = await CreateFixtureAsync("Viewer");
        await using (var db = PostgreSqlTestDatabase.CreateDbContext())
        {
            var user = await db.Users.SingleAsync(item => item.Id == fixture.User.Id);
            var space = await db.Spaces.SingleAsync(item => item.Id == fixture.Space.Id);
            var privateAccount = Account.Create("Private", null, space);
            privateAccount.SetOwner(user.Id);
            var date = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
            foreach (var spent in new[] { 10, 20, 30, 40, 50, 60, 70 })
            {
                var category = Category.Create($"Category {spent}", "house", "#334455", CategoryKind.Expense, space);
                var shared = Budget.Create(100, new MonthYear(date), true, category, user, space);
                var privateBudget = Budget.Create(1, new MonthYear(date), true, category, user, space, Visibility.Private);
                var booking = Transaction.Create(new(date, -spent, null, null, TransactionStatus.Booked, false), null, user, space);
                booking.AssignCategoryManually(category);
                var privateBooking = Transaction.Create(new(date, -999, null, null, TransactionStatus.Booked, false), privateAccount, user, space);
                privateBooking.AssignCategoryManually(category);
                var pending = Transaction.Create(new(date, -999, null, null, TransactionStatus.Pending, false), null, user, space);
                pending.AssignCategoryManually(category);
                var future = Budget.Create(1000, new MonthYear(date.AddMonths(1)), true, category, user, space);
                db.AddRange(category, shared, privateBudget, booking, privateBooking, pending, future);
            }
            await db.SaveChangesAsync();
        }
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId,
            configureServices: services => services.AddSingleton<IFeatureFlags>(new DashboardFlags(true)));
        var path = $"/api/spaces/{fixture.Space.Id}/dashboard/budgets?year=2026&month=9";
        var data = await host.Client.GetFromJsonAsync<List<DashboardBudget>>(path);
        await Assert.That(data!.Select(item => item.Spent).ToArray()).IsEquivalentTo(new decimal[] { 70, 60, 50 });
        await Assert.That(data![0].Spent).IsEqualTo(70m);
        await Assert.That(data.All(item => item.Amount == 100m)).IsTrue();
        using var other = host.CreateClient(fixture.OtherUser.AuthId);
        await Assert.That(await other.GetStringAsync(path)).IsEqualTo(await host.Client.GetStringAsync(path));
        using var invalid = await host.Client.GetAsync($"/api/spaces/{fixture.Space.Id}/dashboard/budgets?year=2026&month=13");
        await Assert.That(invalid.StatusCode).IsEqualTo(HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task DashboardConsumptionMeterReadingsUseHistoricalBaselineRelativeEntriesAndMeterResets()
    {
        var fixture = await CreateFixtureAsync("Viewer");
        await using (var db = PostgreSqlTestDatabase.CreateDbContext())
        {
            var resource = await db.Resources.Include(item => item.Unit).SingleAsync(item => item.Id == fixture.Resource.Id);
            var space = await db.Spaces.SingleAsync(item => item.Id == fixture.Space.Id);
            var entries = new[]
            {
                (2025, 12, 1, 1000m, ConsumptionValueType.Absolute, 0m, false),
                (2026, 1, 1, 10m, ConsumptionValueType.Relative, 10m, false),
                (2026, 2, 1, 1040m, ConsumptionValueType.Absolute, 30m, false),
                (2026, 2, 2, 5m, ConsumptionValueType.Relative, 5m, false),
                (2026, 4, 1, 100m, ConsumptionValueType.Absolute, 0m, true),
                (2026, 4, 2, 7m, ConsumptionValueType.Relative, 7m, false)
            };
            foreach (var (year, month, day, value, type, consumption, reset) in entries)
            {
                db.Add(Consumption.Create("Reading", resource, space, new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc),
                    new ConsumptionReading(value, type, consumption, reset)));
            }
            var relativeOnly = new Resource { Name = "Relative only", Unit = resource.Unit, Color = "#334455", Icon = "flame", CreatorType = CreatorType.User, Space = space };
            db.Add(Consumption.Create("No baseline", relativeOnly, space, new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                new ConsumptionReading(15, ConsumptionValueType.Relative, 15)));
            var otherSpace = Space.Create("Other space");
            db.Add(Consumption.Create("Other meter", resource, otherSpace, new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                new ConsumptionReading(99999, ConsumptionValueType.Absolute, 0)));
            await db.SaveChangesAsync();
        }
        await using var host = await SpaceApiHost.StartAsync(fixture.User.AuthId);
        var data = await host.Client.GetFromJsonAsync<List<ConsumptionMonth>>($"/api/spaces/{fixture.Space.Id}/dashboard/consumptions?year=2026");
        var readings = data!.Where(item => item.ResourceId == fixture.Resource.Id).ToDictionary(item => item.Month);
        await Assert.That(readings.Count).IsEqualTo(4);
        await Assert.That(readings[1].Value).IsEqualTo(10m);
        await Assert.That(readings[1].MeterReading).IsEqualTo(1010m);
        await Assert.That(readings[2].Value).IsEqualTo(35m);
        await Assert.That(readings[2].MeterReading).IsEqualTo(1045m);
        await Assert.That(readings[4].Value).IsEqualTo(7m);
        await Assert.That(readings[4].MeterReading).IsEqualTo(107m);
        await Assert.That(readings[9].MeterReading).IsEqualTo(117m);
        await Assert.That(data!.Single(item => item.Name == "Relative only").MeterReading).IsNull();
    }

    private sealed class DashboardFlags(bool enabled) : IFeatureFlags
    {
        public Task<bool> IsEnabledAsync(string feature, CancellationToken cancellationToken) => Task.FromResult(enabled);
    }

    private static async Task<Fixture> CreateFixtureAsync(string roleName)
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = Space.Create("Shared space");
        var role = await dbContext.Roles.SingleAsync(item => item.Name == roleName);
        var member = await dbContext.Roles.SingleAsync(item => item.Id == SpaceRoles.Member.Id);
        var user = CreateUser("actor");
        var otherUser = CreateUser("other");
        user.UserSpaces.Add(UserSpace.Create(user, space, role));
        otherUser.UserSpaces.Add(UserSpace.Create(otherUser, space, member));
        var systemUnit = await dbContext.Units.SingleAsync(item => item.Id == new Guid("11111111-1111-4111-8111-111111111113"));
        var resource = new Resource { Name = "Gas", Unit = systemUnit, Color = "#334455", Icon = "flame", CreatorType = CreatorType.User, Space = space };
        user.AddResource(resource);
        otherUser.AddResource(resource);
        var consumption = Consumption.Create("Reading", resource, space, new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc), new ConsumptionReading(10m, ConsumptionValueType.Relative, 10m));
        var limit = Limit.Create(new("Budget", null, 100m, Period.Month, true), resource, user, space);
        var unit = new Unit { Name = "Bucket", Symbol = "bucket", QuantityKey = "Custom:bucket", CreatorType = CreatorType.User, ConversionType = UnitConversionType.None, OwnerUser = user };
        dbContext.AddRange(user, otherUser, resource, consumption, limit, unit);
        await dbContext.SaveChangesAsync();
        return new(space, user, otherUser, resource, consumption, limit, unit);
    }

    private static User CreateUser(string name)
    {
        var user = User.Init($"{name}-auth", name, $"{name}@example.test");
        user.CompleteOnboarding(name, AnalyticsConsent.Declined, DateTime.UtcNow);
        return user;
    }

    private sealed record Fixture(Space Space, User User, User OtherUser, Resource Resource, Consumption Consumption, Limit Limit, Unit Unit);
}
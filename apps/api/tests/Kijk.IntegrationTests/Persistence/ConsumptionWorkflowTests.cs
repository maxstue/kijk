using Kijk.Application.Consumptions.Create;
using Kijk.Application.Consumptions.Delete;
using Kijk.Application.Consumptions.GetStats;
using Kijk.Application.Consumptions.Update;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Kijk.IntegrationTests.Persistence;

[NotInParallel]
public class ConsumptionWorkflowTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [After(Class)]
    public static Task StopDatabase() => PostgreSqlTestDatabase.StopAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task StatsAggregateCalculatedConsumptionByMonth()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(dbContext);
        var clock = new MutableTimeProvider(new DateTimeOffset(2026, 9, 8, 12, 0, 0, TimeSpan.Zero));
        var create = CreateHandler(dbContext, fixture.CurrentUser, clock);

        await CreateAsync(create, "January baseline", 1_000m, CreateConsumptionValueTypes.Absolute, fixture.Resource.Id, UtcDate(2024, 1, 1));
        await CreateAsync(create, "January relative", 20m, CreateConsumptionValueTypes.Relative, fixture.Resource.Id, UtcDate(2024, 1, 10));
        await CreateAsync(create, "January reading", 1_060m, CreateConsumptionValueTypes.Absolute, fixture.Resource.Id, UtcDate(2024, 1, 20));
        await CreateAsync(create, "February relative", 30m, CreateConsumptionValueTypes.Relative, fixture.Resource.Id, UtcDate(2024, 2, 10));

        var result = await new GetStatsConsumptionsHandler(dbContext, fixture.CurrentUser)
            .GetStatsAsync(2024, "January", CancellationToken.None);

        await Assert.That(result.IsSuccess).IsTrue();
        var stats = result.Value.Stats.Single(item => item.Resource.Id == fixture.Resource.Id);
        await Assert.That(stats.MonthTotal).IsEqualTo(60m);
        await Assert.That(stats.YearTotal).IsEqualTo(90m);
        await Assert.That(stats.YearAverage).IsEqualTo(45m);
        await Assert.That(stats.YearMin).IsEqualTo(30m);
        await Assert.That(stats.YearMax).IsEqualTo(60m);
    }

    [Test]
    public async Task LimitOccurrenceIsRecordedAgainOnlyAfterFallingBelowThreshold()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(dbContext);
        var limit = ConsumptionLimit.Create(
            new ConsumptionLimitSettings("Monthly electricity", null, 50m, Period.Month, true),
            fixture.Resource,
            fixture.User,
            fixture.Household);
        dbContext.ConsumptionsLimits.Add(limit);
        await dbContext.SaveChangesAsync();

        var firstOccurrence = new DateTimeOffset(2026, 9, 8, 12, 0, 0, TimeSpan.Zero);
        var clock = new MutableTimeProvider(firstOccurrence);
        var create = CreateHandler(dbContext, fixture.CurrentUser, clock);
        await CreateAsync(create, "Below limit", 30m, CreateConsumptionValueTypes.Relative, fixture.Resource.Id, UtcDate(2026, 9, 1));
        await Assert.That(limit.LastOccurrence).IsNull();

        await CreateAsync(create, "Cross limit", 25m, CreateConsumptionValueTypes.Relative, fixture.Resource.Id, UtcDate(2026, 9, 2));
        await Assert.That(limit.LastOccurrence).IsEqualTo(firstOccurrence.UtcDateTime);

        clock.UtcNow = firstOccurrence.AddHours(1);
        await CreateAsync(create, "Remain above", 10m, CreateConsumptionValueTypes.Relative, fixture.Resource.Id, UtcDate(2026, 9, 3));
        await Assert.That(limit.LastOccurrence).IsEqualTo(firstOccurrence.UtcDateTime);

        var crossingEntry = await dbContext.Consumptions.SingleAsync(item => item.Name == "Cross limit");
        await new DeleteConsumptionHandler(dbContext, fixture.CurrentUser, clock, NullLogger<DeleteConsumptionHandler>.Instance)
            .DeleteAsync(crossingEntry.Id, CancellationToken.None);

        var secondOccurrence = firstOccurrence.AddHours(2);
        clock.UtcNow = secondOccurrence;
        await CreateAsync(create, "Cross again", 15m, CreateConsumptionValueTypes.Relative, fixture.Resource.Id, UtcDate(2026, 9, 4));
        await Assert.That(limit.LastOccurrence).IsEqualTo(secondOccurrence.UtcDateTime);
    }

    [Test]
    public async Task CreateUpdateAndDeleteRecalculateLaterAbsoluteReading()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await CreateFixtureAsync(dbContext);
        var clock = new MutableTimeProvider(DateTimeOffset.UtcNow);
        var create = CreateHandler(dbContext, fixture.CurrentUser, clock);

        await CreateAsync(create, "Baseline", 1_000m, CreateConsumptionValueTypes.Absolute, fixture.Resource.Id, UtcDate(2026, 9, 1));
        await CreateAsync(create, "Later reading", 1_100m, CreateConsumptionValueTypes.Absolute, fixture.Resource.Id, UtcDate(2026, 9, 20));
        await AssertCalculatedAsync(dbContext, "Later reading", 100m);

        await CreateAsync(create, "Intervening usage", 30m, CreateConsumptionValueTypes.Relative, fixture.Resource.Id, UtcDate(2026, 9, 10));
        await AssertCalculatedAsync(dbContext, "Later reading", 70m);

        var relative = await dbContext.Consumptions.SingleAsync(item => item.Name == "Intervening usage");
        var updateResult = await new UpdateConsumptionHandler(dbContext, fixture.CurrentUser, clock, NullLogger<UpdateConsumptionHandler>.Instance)
            .UpdateAsync(relative.Id, new UpdateConsumptionRequest(null, 40m, UpdateConsumptionValueTypes.Relative, null, null), CancellationToken.None);
        await Assert.That(updateResult.IsSuccess).IsTrue();
        await AssertCalculatedAsync(dbContext, "Later reading", 60m);

        var deleteResult = await new DeleteConsumptionHandler(dbContext, fixture.CurrentUser, clock, NullLogger<DeleteConsumptionHandler>.Instance)
            .DeleteAsync(relative.Id, CancellationToken.None);
        await Assert.That(deleteResult.IsSuccess).IsTrue();
        await AssertCalculatedAsync(dbContext, "Later reading", 100m);
    }

    private static CreateConsumptionHandler CreateHandler(AppDbContext dbContext, CurrentUser currentUser, TimeProvider timeProvider) =>
        new(dbContext, currentUser, timeProvider, NullLogger<CreateConsumptionHandler>.Instance);

    private static DateTime UtcDate(int year, int month, int day) => new(year, month, day, 0, 0, 0, DateTimeKind.Utc);

    private static async Task CreateAsync(
        CreateConsumptionHandler handler,
        string name,
        decimal value,
        CreateConsumptionValueTypes valueType,
        Guid resourceId,
        DateTime date)
    {
        var result = await handler.CreateAsync(
            new CreateConsumptionRequest(name, value, valueType, resourceId, date),
            CancellationToken.None);
        await Assert.That(result.IsSuccess).IsTrue();
    }

    private static async Task AssertCalculatedAsync(AppDbContext dbContext, string name, decimal expected)
    {
        var value = await dbContext.Consumptions
            .Where(item => item.Name == name)
            .Select(item => item.CalculatedConsumption)
            .SingleAsync();
        await Assert.That(value).IsEqualTo(expected);
    }

    private static async Task<TestFixture> CreateFixtureAsync(AppDbContext dbContext)
    {
        var household = Household.Create("Integration household");
        var resource = new Resource
        {
            Name = "Electricity",
            Unit = "kWh",
            Color = "#112233",
            CreatorType = CreatorType.User,
            Household = household
        };
        var user = User.Init("integration-auth", "Integration user", "integration@example.test");
        dbContext.AddRange(household, resource, user);
        await dbContext.SaveChangesAsync();

        return new TestFixture(
            household,
            resource,
            user,
            new CurrentUser { User = new SimpleAuthUser(user.Id, user.AuthId, household.Id, user.Name, user.Email, true) });
    }

    private sealed record TestFixture(Household Household, Resource Resource, User User, CurrentUser CurrentUser);

    private sealed class MutableTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public DateTimeOffset UtcNow { get; set; } = utcNow;

        public override DateTimeOffset GetUtcNow() => UtcNow;
    }
}
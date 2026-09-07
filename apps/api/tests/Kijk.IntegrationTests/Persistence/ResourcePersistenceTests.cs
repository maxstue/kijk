using Bogus;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;

namespace Kijk.IntegrationTests.Persistence;

[NotInParallel]
public class ResourcePersistenceTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [After(Class)]
    public static Task StopDatabase() => PostgreSqlTestDatabase.StopAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    public async Task SaveChangesWithBogusResourcesPersistsGeneratedData()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = Household.Create("Integration household");
        dbContext.Households.Add(household);

        var faker = new Faker<Resource>()
            .UseSeed(215)
            .RuleFor(resource => resource.Name, fake => fake.Random.String2(12, "abcdefghijklmnopqrstuvwxyz"))
            .RuleFor(resource => resource.Unit, fake => fake.PickRandom("kWh", "Liter", "m3"))
            .RuleFor(resource => resource.Color, fake => fake.Internet.Color())
            .RuleFor(resource => resource.CreatorType, _ => CreatorType.User)
            .RuleFor(resource => resource.Household, _ => household);
        var resources = faker.Generate(3);
        dbContext.Resources.AddRange(resources);

        await dbContext.SaveChangesAsync();

        var persistedResources = await dbContext.Resources.AsNoTracking().OrderBy(resource => resource.Name).ToListAsync();
        await Assert.That(persistedResources).Count().IsEqualTo(3);
        await Assert.That(persistedResources.All(resource => resource.HouseholdId == household.Id)).IsTrue();
    }

    [Test]
    public async Task SaveChangesWithEquivalentResourceNamesEnforcesNormalizedUniqueConstraint()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var household = Household.Create("Integration household");
        dbContext.Resources.AddRange(
            CreateResource("Electricity", "kWh", household),
            CreateResource(" electricity ", " KWH ", household));

        var constraintWasEnforced = false;
        try
        {
            await dbContext.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            constraintWasEnforced = true;
        }

        await Assert.That(constraintWasEnforced).IsTrue();
    }

    [Test]
    public async Task ResetAsyncAfterPersistingDataRemovesApplicationRows()
    {
        await using (var dbContext = PostgreSqlTestDatabase.CreateDbContext())
        {
            dbContext.Households.Add(Household.Create("Disposable household"));
            await dbContext.SaveChangesAsync();
        }

        await PostgreSqlTestDatabase.ResetAsync();

        await using var verificationContext = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verificationContext.Households.CountAsync()).IsEqualTo(0);
    }

    private static Resource CreateResource(string name, string unit, Household household) => new()
    {
        Name = name,
        Unit = unit,
        Color = "#112233",
        CreatorType = CreatorType.User,
        Household = household
    };
}
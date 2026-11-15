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
        var space = Space.Create("Integration space");
        dbContext.Spaces.Add(space);
        var units = await dbContext.Units.ToListAsync();

        var faker = new Faker<Resource>()
            .UseSeed(215)
            .RuleFor(resource => resource.Name, fake => fake.Random.String2(12, "abcdefghijklmnopqrstuvwxyz"))
            .RuleFor(resource => resource.Unit, fake => fake.PickRandom(units))
            .RuleFor(resource => resource.Color, fake => fake.Internet.Color())
            .RuleFor(resource => resource.Icon, _ => "circle")
            .RuleFor(resource => resource.CreatorType, _ => CreatorType.User)
            .RuleFor(resource => resource.Space, _ => space);
        var resources = faker.Generate(3);
        dbContext.Resources.AddRange(resources);

        await dbContext.SaveChangesAsync();

        var persistedResources = await dbContext.Resources.AsNoTracking().OrderBy(resource => resource.Name).ToListAsync();
        await Assert.That(persistedResources).Count().IsEqualTo(3);
        await Assert.That(persistedResources.All(resource => resource.SpaceId == space.Id)).IsTrue();
    }

    [Test]
    public async Task SaveChangesWithEquivalentResourceNamesEnforcesCaseInsensitiveUniqueConstraint()
    {
        await using var dbContext = PostgreSqlTestDatabase.CreateDbContext();
        var space = Space.Create("Integration space");
        var unit = await dbContext.Units.SingleAsync(item => item.Symbol == "kWh");
        dbContext.Resources.AddRange(
            CreateResource("Electricity", unit, space),
            CreateResource("electricity", unit, space));

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
            dbContext.Spaces.Add(Space.Create("Disposable space"));
            await dbContext.SaveChangesAsync();
        }

        await PostgreSqlTestDatabase.ResetAsync();

        await using var verificationContext = PostgreSqlTestDatabase.CreateDbContext();
        await Assert.That(await verificationContext.Spaces.CountAsync()).IsEqualTo(0);
    }

    private static Resource CreateResource(string name, Unit unit, Space space) => new()
    {
        Name = name,
        Unit = unit,
        Color = "#112233",
        Icon = "circle",
        CreatorType = CreatorType.User,
        Space = space
    };
}
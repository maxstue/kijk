using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Kijk.IntegrationTests.Persistence;

[NotInParallel]
public class NameCollationTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Before(Test)]
    public Task ResetDatabase() => PostgreSqlTestDatabase.ResetAsync();

    [Test]
    [Arguments("CAFÉ", true)]
    [Arguments("Cafe\u0301", true)]
    [Arguments("Cafe", false)]
    public async Task NamesIgnoreCaseAndUnicodeCompositionButPreserveAccents(string search, bool matches)
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await SeedAsync(db);

        await Assert.That(await db.Units.AnyAsync(item => item.Id == fixture.Unit.Id && item.Name == search)).IsEqualTo(matches);
        await Assert.That(await db.Categories.AnyAsync(item => item.Id == fixture.Category.Id && item.Name == search)).IsEqualTo(matches);
        await Assert.That(await db.Resources.AnyAsync(item => item.Id == fixture.Resource.Id && item.Name == search)).IsEqualTo(matches);
        db.ChangeTracker.Clear();
        await Assert.That((await db.Units.FindAsync(fixture.Unit.Id))!.Name).IsEqualTo("Café");
        await Assert.That((await db.Categories.FindAsync(fixture.Category.Id))!.Name).IsEqualTo("Café");
        await Assert.That((await db.Resources.FindAsync(fixture.Resource.Id))!.Name).IsEqualTo("Café");
    }

    [Test]
    [Arguments("units")]
    [Arguments("categories")]
    [Arguments("resources")]
    public async Task DatabaseEnforcesCaseInsensitiveUniqueness(string table)
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await SeedAsync(db);
        AddNamedEntity(db, fixture, table, "CAFÉ");

        var failure = await SaveFailureAsync(db);

        await Assert.That(failure.SqlState).IsEqualTo(PostgresErrorCodes.UniqueViolation);
    }

    [Test]
    [Arguments("units")]
    [Arguments("categories")]
    [Arguments("resources")]
    public async Task DatabaseRejectsUntrimmedNames(string table)
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await SeedAsync(db);
        AddNamedEntity(db, fixture, table, " Another name ");

        var failure = await SaveFailureAsync(db);

        await Assert.That(failure.SqlState).IsEqualTo(PostgresErrorCodes.CheckViolation);
    }

    [Test]
    public async Task NameIndexesRetainSpaceAndUnitScopes()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await SeedAsync(db);
        var otherSpace = Space.Create("Other space");
        var otherUnit = NewUnit("Other unit", "other");
        db.AddRange(otherSpace, otherUnit);
        db.Categories.Add(Category.Create("CAFÉ", "circle", "#112233", CategoryKind.Expense, otherSpace));
        db.Resources.AddRange(NewResource("CAFÉ", fixture.Unit, otherSpace), NewResource("CAFÉ", otherUnit, fixture.Space));

        await db.SaveChangesAsync();

        await Assert.That(await db.Categories.CountAsync(item => item.Name == "café")).IsEqualTo(2);
        await Assert.That(await db.Resources.CountAsync(item => item.Name == "café")).IsEqualTo(3);
    }

    [Test]
    public async Task UnitSymbolsIgnoreCase()
    {
        await using var db = PostgreSqlTestDatabase.CreateDbContext();
        var fixture = await SeedAsync(db);

        await Assert.That(await db.Units.AnyAsync(item => item.Id == fixture.Unit.Id && item.Symbol == "mW")).IsTrue();
        await Assert.That(await db.Units.AnyAsync(item => item.Id == fixture.Unit.Id && item.Symbol == "MW")).IsTrue();
    }

    internal static async Task<Fixture> SeedAsync(AppDbContext db, string name = "Café", User? persistedOwner = null)
    {
        var owner = persistedOwner ?? User.Init("collation-auth", "Owner", "owner@example.test");
        if (persistedOwner is null)
        {
            db.Users.Add(owner);
        }
        else
        {
            db.Users.Attach(owner);
        }
        var space = Space.Create("Collation space");
        var unit = NewUnit(name, "mW");
        var category = Category.Create(name, "circle", "#112233", CategoryKind.Expense, space);
        var resource = NewResource(name, unit, space);
        db.AddRange(space, unit, category, resource);
        await db.SaveChangesAsync();
        return new(owner, space, unit, category, resource);
    }

    internal static void AddNamedEntity(AppDbContext db, Fixture fixture, string table, string name)
    {
        switch (table)
        {
            case "units":
                db.Units.Add(NewUnit(name, "collation"));
                break;
            case "categories":
                db.Categories.Add(Category.Create(name, "circle", "#112233", CategoryKind.Expense, fixture.Space));
                break;
            case "resources":
                db.Resources.Add(NewResource(name, fixture.Unit, fixture.Space));
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(table));
        }
    }

    private static async Task<PostgresException> SaveFailureAsync(AppDbContext db)
    {
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException postgres)
        {
            return postgres;
        }
        throw new InvalidOperationException("Expected the database to reject this name.");
    }

    private static Unit NewUnit(string name, string symbol) => new()
    {
        Name = name,
        Symbol = symbol,
        QuantityKey = "Custom:collation"
    };

    private static Resource NewResource(string name, Unit unit, Space space) => new()
    {
        Name = name,
        Unit = unit,
        Color = "#112233",
        Icon = "circle",
        CreatorType = CreatorType.User,
        Space = space
    };

    internal sealed record Fixture(User Owner, Space Space, Unit Unit, Category Category, Resource Resource);
}
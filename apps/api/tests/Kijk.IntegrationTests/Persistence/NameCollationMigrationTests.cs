using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Kijk.IntegrationTests.Persistence;

[NotInParallel]
public class NameCollationMigrationTests
{
    private const string Before = "20261015183604_UseDefaultSpace";
    private const string After = "20261021060020_UseCaseInsensitiveNames";
    private const string NormalizedColumns = """
        SELECT count(*)::text FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name IN ('units', 'categories', 'resources') AND column_name = 'normalized_name'
        """;

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Test]
    public async Task MigrationTrimsNamesAndPreservesDataInBothDirections()
    {
        var connectionString = await CreateDatabaseAsync("name_collation_data");
        await using var db = CreateDbContext(connectionString);
        var migrator = db.GetInfrastructure().GetRequiredService<IMigrator>();
        await migrator.MigrateAsync(Before);
        var fixture = await NameCollationTests.SeedAsync(db, " Café ");

        await migrator.MigrateAsync(After);
        db.ChangeTracker.Clear();

        await AssertNamesAsync(db, fixture, "Café");
        await Assert.That(await ScalarAsync(connectionString, NormalizedColumns)).IsEqualTo("0");
        await Assert.That(await db.Units.AnyAsync(item => item.Id == fixture.Unit.Id && item.Name == "CAFÉ")).IsTrue();
        await Assert.That(await db.Units.AnyAsync(item => item.Id == fixture.Unit.Id && item.Symbol == "MW")).IsFalse();

        await migrator.MigrateAsync(Before);
        db.ChangeTracker.Clear();

        await AssertNamesAsync(db, fixture, "Café");
        await Assert.That(await ScalarAsync(connectionString, NormalizedColumns)).IsEqualTo("3");
        await Assert.That(await ScalarAsync(connectionString, "SELECT normalized_name FROM units WHERE name = 'Café'")).IsEqualTo("café");
        await Assert.That(await ScalarAsync(connectionString, "SELECT count(*)::text FROM pg_collation WHERE collname = 'case_insensitive'")).IsEqualTo("0");
    }

    [Test]
    [Arguments("units")]
    [Arguments("categories")]
    [Arguments("resources")]
    public async Task CollidingExistingNamesAbortWithoutChangingData(string table)
    {
        var connectionString = await CreateDatabaseAsync($"name_collation_collision_{table}");
        await using var db = CreateDbContext(connectionString);
        var migrator = db.GetInfrastructure().GetRequiredService<IMigrator>();
        await migrator.MigrateAsync(Before);
        var fixture = await NameCollationTests.SeedAsync(db, " Café ");
        NameCollationTests.AddNamedEntity(db, fixture, table, "Cafe\u0301");
        await db.SaveChangesAsync();

        var failure = await MigrationFailureAsync(migrator);

        await Assert.That(failure.MessageText).IsEqualTo("Cannot apply case-insensitive names: resolve names that collide under the new collation first.");
        await Assert.That(await db.Database.GetAppliedMigrationsAsync()).DoesNotContain(After);
        await Assert.That(await ScalarAsync(connectionString, NormalizedColumns)).IsEqualTo("3");
        await Assert.That(await ScalarAsync(connectionString, $"SELECT count(*)::text FROM {table} WHERE name IN (' Café ', 'Café')")).IsEqualTo("2");
        db.ChangeTracker.Clear();
        await AssertNamesAsync(db, fixture, " Café ");
    }

    private static async Task AssertNamesAsync(AppDbContext db, NameCollationTests.Fixture fixture, string expected)
    {
        await Assert.That((await db.Units.FindAsync(fixture.Unit.Id))!.Name).IsEqualTo(expected);
        await Assert.That((await db.Categories.FindAsync(fixture.Category.Id))!.Name).IsEqualTo(expected);
        await Assert.That((await db.Resources.FindAsync(fixture.Resource.Id))!.Name).IsEqualTo(expected);
    }

    private static async Task<PostgresException> MigrationFailureAsync(IMigrator migrator)
    {
        try
        {
            await migrator.MigrateAsync(After);
        }
        catch (PostgresException exception)
        {
            return exception;
        }

        throw new InvalidOperationException("Expected the migration to reject colliding names.");
    }

    private static async Task<string> CreateDatabaseAsync(string name)
    {
        await using var connection = new NpgsqlConnection(PostgreSqlTestDatabase.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand($"DROP DATABASE IF EXISTS {name} WITH (FORCE); CREATE DATABASE {name};", connection);
        await command.ExecuteNonQueryAsync();
        return new NpgsqlConnectionStringBuilder(PostgreSqlTestDatabase.ConnectionString) { Database = name }.ConnectionString;
    }

    private static AppDbContext CreateDbContext(string connectionString) =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString, postgres => postgres.MapEnum<CreatorType>())
            .UseSnakeCaseNamingConvention()
            .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning))
            .Options);

    private static async Task<string?> ScalarAsync(string connectionString, string sql)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        return (string?)await command.ExecuteScalarAsync();
    }
}
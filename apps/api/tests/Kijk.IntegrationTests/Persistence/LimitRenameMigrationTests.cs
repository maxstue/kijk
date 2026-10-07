using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Kijk.IntegrationTests.Persistence;

// The rename must keep existing limits; EF would have generated a drop and re-create of the table.
[NotInParallel]
public class LimitRenameMigrationTests
{
    private const string BeforeRename = "20261005164013_AddPersonalSpacesAndPrivateFinances";
    private const string Rename = "20261005164941_RenameConsumptionLimitsToLimits";

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Test]
    public async Task RenamingKeepsExistingLimitsInBothDirections()
    {
        var connectionString = await CreateDatabaseAsync("limit_rename_check");
        await using var dbContext = CreateDbContext(connectionString);
        var migrator = dbContext.GetInfrastructure().GetRequiredService<IMigrator>();
        await migrator.MigrateAsync(BeforeRename);

        var id = Guid.NewGuid();
        await ExecuteAsync(connectionString, $"""
            SET session_replication_role = replica;
            INSERT INTO consumptions_limits (id, name, "limit", period, active, resource_id, created_by_id, household_id)
            VALUES ('{id}', 'Power', 123.45, 0, true, '{Guid.NewGuid()}', '{Guid.NewGuid()}', '{Guid.NewGuid()}');
            """);

        await migrator.MigrateAsync(Rename);
        var renamed = await QueryAsync(connectionString, $"SELECT threshold FROM limits WHERE id = '{id}'");
        await migrator.MigrateAsync(BeforeRename);
        var restored = await QueryAsync(connectionString, $"""SELECT "limit" FROM consumptions_limits WHERE id = '{id}'""");

        await Assert.That(renamed).IsEqualTo(123.45m);
        await Assert.That(restored).IsEqualTo(123.45m);
    }

    private static async Task<string> CreateDatabaseAsync(string name)
    {
        await ExecuteAsync(PostgreSqlTestDatabase.ConnectionString, $"DROP DATABASE IF EXISTS {name} WITH (FORCE); CREATE DATABASE {name};");
        return new NpgsqlConnectionStringBuilder(PostgreSqlTestDatabase.ConnectionString) { Database = name }.ConnectionString;
    }

    private static AppDbContext CreateDbContext(string connectionString) =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString, postgres => postgres.MapEnum<CreatorType>())
            .UseSnakeCaseNamingConvention()
            .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning))
            .Options);

    private static async Task ExecuteAsync(string connectionString, string sql)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }

    private static async Task<decimal?> QueryAsync(string connectionString, string sql)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        return (decimal?)await command.ExecuteScalarAsync();
    }
}
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Kijk.IntegrationTests.Persistence;

// Renaming households to spaces must keep all data.
[NotInParallel]
public class SpaceRenameMigrationTests
{
    private const string BeforeRename = "20261005164941_RenameConsumptionLimitsToLimits";
    private const string Rename = "20261005193222_RenameHouseholdsToSpaces";

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Test]
    public async Task RenamingKeepsDataInBothDirections()
    {
        var connectionString = await CreateDatabaseAsync("space_rename_data");
        await using var dbContext = CreateDbContext(connectionString);
        var migrator = dbContext.GetInfrastructure().GetRequiredService<IMigrator>();
        await migrator.MigrateAsync(BeforeRename);

        var household = Guid.NewGuid();
        var user = Guid.NewGuid();
        await ExecuteAsync(connectionString, $"""
            INSERT INTO users (id, auth_id, name, created_at) VALUES ('{user}', 'rename', 'Rename', now());
            INSERT INTO households (id, name, is_personal, purpose_retention, ai_data_sharing, minimize_data) VALUES ('{household}', 'Family', FALSE, 0, 0, FALSE);
            INSERT INTO user_households (id, user_id, household_id, role_id, is_active) VALUES (gen_random_uuid(), '{user}', '{household}', '0195624d-5bd9-754c-a92b-5e0e82e1ede1', TRUE);
            INSERT INTO accounts (id, name, kind, household_id) VALUES (gen_random_uuid(), 'Giro', 0, '{household}');
            """);

        await migrator.MigrateAsync(Rename);
        await Assert.That(await ScalarAsync(connectionString, $"SELECT name FROM spaces WHERE id = '{household}'")).IsEqualTo("Family");
        await Assert.That(await ScalarAsync(connectionString, $"SELECT count(*)::text FROM user_spaces WHERE space_id = '{household}' AND user_id = '{user}'")).IsEqualTo("1");
        await Assert.That(await ScalarAsync(connectionString, $"SELECT name FROM accounts WHERE space_id = '{household}'")).IsEqualTo("Giro");
        await Assert.That(await ScalarAsync(connectionString, "SELECT count(*)::text FROM permissions WHERE name LIKE 'space:%'")).IsEqualTo("2");

        await migrator.MigrateAsync(BeforeRename);
        await Assert.That(await ScalarAsync(connectionString, $"SELECT name FROM accounts WHERE household_id = '{household}'")).IsEqualTo("Giro");
        await Assert.That(await ScalarAsync(connectionString, "SELECT count(*)::text FROM permissions WHERE name LIKE 'household:%'")).IsEqualTo("2");
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

    private static async Task<string?> ScalarAsync(string connectionString, string sql)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        return (string?)await command.ExecuteScalarAsync();
    }
}
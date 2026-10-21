using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Kijk.IntegrationTests.Persistence;

// Existing users get exactly one personal space with a cash account; users without onboarding get it when they finish.
[NotInParallel]
public class PersonalSpaceMigrationTests
{
    private const string Before = "20261005093923_AddFinanceExportPermission";
    private const string PersonalSpaces = "20261005164013_AddPersonalSpacesAndPrivateFinances";

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Test]
    public async Task ExistingUsersGetOnePersonalSpaceWithACashAccount()
    {
        var connectionString = await CreateDatabaseAsync("personal_space_check");
        await using var dbContext = CreateDbContext(connectionString);
        var migrator = dbContext.GetInfrastructure().GetRequiredService<IMigrator>();
        await migrator.MigrateAsync(Before);

        var onboarded = Guid.NewGuid();
        var pending = Guid.NewGuid();
        await ExecuteAsync(connectionString, $"""
            INSERT INTO users (id, auth_id, name, onboarding_completed_at, created_at) VALUES
                ('{onboarded}', 'onboarded', 'Onboarded', now(), now()),
                ('{pending}', 'pending', 'Pending', NULL, now());
            """);

        await migrator.MigrateAsync(PersonalSpaces);

        await Assert.That(await CountAsync(connectionString, $"""
            SELECT count(*) FROM user_households uh JOIN households h ON h.id = uh.household_id
            WHERE uh.user_id = '{onboarded}' AND h.is_personal AND NOT uh.is_active
            """)).IsEqualTo(1);
        await Assert.That(await CountAsync(connectionString, $"""
            SELECT count(*) FROM accounts a JOIN user_households uh ON uh.household_id = a.household_id
            WHERE uh.user_id = '{onboarded}' AND a.kind = 1
            """)).IsEqualTo(1);
        await Assert.That(await CountAsync(connectionString, $"SELECT count(*) FROM user_households WHERE user_id = '{pending}'")).IsEqualTo(0);

        // Down removes the personal spaces again.
        await migrator.MigrateAsync(Before);
        await Assert.That(await CountAsync(connectionString, $"SELECT count(*) FROM user_households WHERE user_id = '{onboarded}'")).IsEqualTo(0);
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

    private static async Task<long> CountAsync(string connectionString, string sql)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        return (long)(await command.ExecuteScalarAsync())!;
    }
}
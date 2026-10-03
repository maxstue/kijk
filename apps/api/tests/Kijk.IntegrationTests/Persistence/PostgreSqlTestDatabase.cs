using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Npgsql;
using Respawn;
using Testcontainers.PostgreSql;

namespace Kijk.IntegrationTests.Persistence;

internal static class PostgreSqlTestDatabase
{
    private static readonly PostgreSqlContainer Container = new PostgreSqlBuilder("postgres:18-alpine").Build();
    private static Respawner _respawner = null!;
    private static string _restoreSystemUnitsSql = null!;
    private static bool _started;

    internal static async Task StartAsync()
    {
        if (_started)
        {
            return;
        }

        await Container.StartAsync();
        await using var dbContext = CreateDbContext();
        await dbContext.Database.MigrateAsync();

        await using var connection = new NpgsqlConnection(Container.GetConnectionString());
        await connection.OpenAsync();

        // Respawn truncates with CASCADE, which also empties units owned by users. Keep a copy of the seeded system
        // units outside the reset schema and restore them after every reset.
        await using (var columns = new NpgsqlCommand(
            """
            SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'units' AND is_generated = 'NEVER'
            """,
            connection))
        {
            var unitColumns = (string)(await columns.ExecuteScalarAsync())!;
            _restoreSystemUnitsSql = $"INSERT INTO units ({unitColumns}) SELECT {unitColumns} FROM test_seed.units";
        }

        await ExecuteAsync(connection, "CREATE SCHEMA test_seed; CREATE TABLE test_seed.units AS SELECT * FROM units WHERE creator_type = 'system'");

        _respawner = await Respawner.CreateAsync(connection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
            SchemasToInclude = ["public"],
            // Household roles and permissions are reference data seeded by migrations.
            TablesToIgnore = ["__EFMigrationsHistory", "roles", "permissions", "roles_permissions"]
        });
        _started = true;
    }

    // The container is shared by all integration-test classes and Testcontainers
    // disposes it when the test process exits.
    internal static Task StopAsync() => Task.CompletedTask;

    internal static async Task ResetAsync()
    {
        await using var connection = new NpgsqlConnection(Container.GetConnectionString());
        await connection.OpenAsync();
        await _respawner.ResetAsync(connection);
        await ExecuteAsync(connection, _restoreSystemUnitsSql);
    }

    private static async Task ExecuteAsync(NpgsqlConnection connection, string sql)
    {
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }

    internal static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(Container.GetConnectionString(), postgres => postgres.MapEnum<CreatorType>())
            .UseSnakeCaseNamingConvention()
            .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning))
            .Options;

        return new AppDbContext(options);
    }
}
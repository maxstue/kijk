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
    private static string _restoreSystemRowsSql = null!;
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

        // Respawn truncates with CASCADE, which also empties system rows referenced by user or household data. Keep a
        // copy of the seeded system units and categories outside the reset schema and restore them after every reset.
        await ExecuteAsync(connection, "CREATE SCHEMA test_seed");
        _restoreSystemRowsSql = string.Join(
            ';',
            await CopySystemRowsAsync(connection, "units"),
            await CopySystemRowsAsync(connection, "categories"));

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
        await ExecuteAsync(connection, _restoreSystemRowsSql);
    }

    private static async Task<string> CopySystemRowsAsync(NpgsqlConnection connection, string table)
    {
        await using var columns = new NpgsqlCommand(
            """
            SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = @table AND is_generated = 'NEVER'
            """,
            connection);
        columns.Parameters.AddWithValue("table", table);
        var tableColumns = (string)(await columns.ExecuteScalarAsync())!;

        await ExecuteAsync(connection, $"CREATE TABLE test_seed.{table} AS SELECT * FROM {table} WHERE creator_type = 'system'");
        return $"INSERT INTO {table} ({tableColumns}) SELECT {tableColumns} FROM test_seed.{table}";
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
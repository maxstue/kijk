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
    private const string ResetWolverineSql =
        """
        DO $$
        DECLARE item record;
        BEGIN
            FOR item IN SELECT tablename FROM pg_tables WHERE schemaname = 'wolverine' LOOP
                EXECUTE format('TRUNCATE TABLE wolverine.%I CASCADE', item.tablename);
            END LOOP;
        END $$;
        """;

    private static Respawner _respawner = null!;
    private static string _restoreSystemRowsSql = null!;
    private static bool _started;

    internal static string ConnectionString => Container.GetConnectionString();

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

        // Respawn truncates with CASCADE, which also empties system rows referenced by user or space data. Keep a
        // copy of the seeded system units and categories outside the reset schema and restore them after every reset.
        await ExecuteAsync(connection, "CREATE SCHEMA test_seed");
        _restoreSystemRowsSql = string.Join(
            ';',
            // Every unit is a system unit right after the migrations.
            await CopySystemRowsAsync(connection, "units", "TRUE"),
            await CopySystemRowsAsync(connection, "categories", "creator_type = 'system'"));

        _respawner = await Respawner.CreateAsync(connection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
            SchemasToInclude = ["public"],
            // Space roles and permissions are reference data seeded by migrations.
            TablesToIgnore = ["__EFMigrationsHistory", "roles", "permissions", "roles_permissions", "data_protection_keys"]
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
        // Respawn only knows the tables that existed when it was created; Wolverine creates its schema with the first
        // host that runs background jobs. Empty it too, so no scheduled or failed envelope reaches a later test.
        await ExecuteAsync(connection, ResetWolverineSql);
    }

    private static async Task<string> CopySystemRowsAsync(NpgsqlConnection connection, string table, string systemRows)
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

        await ExecuteAsync(connection, $"CREATE TABLE test_seed.{table} AS SELECT * FROM {table} WHERE {systemRows}");
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
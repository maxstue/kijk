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
        _respawner = await Respawner.CreateAsync(connection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
            SchemasToInclude = ["public"],
            TablesToIgnore = ["__EFMigrationsHistory"]
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
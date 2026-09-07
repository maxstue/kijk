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

    internal static async Task StartAsync()
    {
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
    }

    internal static Task StopAsync() => Container.DisposeAsync().AsTask();

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
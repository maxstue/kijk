using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;

namespace Kijk.IntegrationTests.Persistence;

[NotInParallel]
public class InitialMigrationTests
{
    private static readonly string[] DefaultResourceNames = ["Electricity", "Gas", "Water"];

    private const string NamesQuery = """
        SELECT 'column ' || table_name || '.' || column_name FROM information_schema.columns WHERE table_schema = 'public'
        UNION ALL
        SELECT 'index ' || tablename || '.' || indexname FROM pg_indexes WHERE schemaname = 'public'
        UNION ALL
        SELECT 'constraint ' || conrelid::regclass || '.' || conname FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'public'
        """;

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Test]
    public async Task MigratedSchemaMatchesTheModel()
    {
        var migrated = await CreateDatabaseAsync("initial_migration");
        var created = await CreateDatabaseAsync("initial_model");
        await using (var dbContext = CreateDbContext(migrated))
        {
            await dbContext.Database.MigrateAsync();
        }

        await using (var dbContext = CreateDbContext(created))
        {
            await dbContext.Database.EnsureCreatedAsync();
        }

        await using (var dbContext = CreateDbContext(migrated))
        {
            var systemResources = await dbContext.Resources
                .Where(resource => resource.CreatorType == CreatorType.System)
                .Select(resource => resource.Name)
                .ToArrayAsync();
            await Assert.That(systemResources).IsEquivalentTo(DefaultResourceNames);
        }

        var migratedNames = await NamesAsync(migrated);
        var modelNames = await NamesAsync(created);
        // The migration history is EF's own bookkeeping and not part of the model.
        migratedNames.RemoveWhere(name => name.Contains("__EFMigrationsHistory", StringComparison.Ordinal) || name.Contains("ef_migrations_history", StringComparison.Ordinal));

        await Assert.That(migratedNames.Order()).IsEquivalentTo(modelNames.Order());
    }

    [Test]
    public async Task UniqueNameMigrationGivesExistingUsersFreeNumbers()
    {
        var database = await CreateDatabaseAsync("unique_name_migration");
        await using (var dbContext = CreateDbContext(database))
        {
            await dbContext.GetService<IMigrator>().MigrateAsync("20261125191937_AddSpaceInvitations");
        }

        await ExecuteAsync(database, """
            INSERT INTO users (id, auth_id, name, guide_completed_version, guide_completed_steps, ai_enabled)
            SELECT gen_random_uuid(), 'auth-' || n, CASE WHEN n % 2 = 0 THEN 'max' ELSE ' Max ' END, 0, '{}', false
            FROM generate_series(1, 50) AS n;
            INSERT INTO users (id, auth_id, name, guide_completed_version, guide_completed_steps, ai_enabled)
            VALUES (gen_random_uuid(), 'auth-other', 'Moritz', 0, '{}', false);
            """);

        await using (var dbContext = CreateDbContext(database))
        {
            await dbContext.Database.MigrateAsync();
            var users = await dbContext.Users.AsNoTracking().ToListAsync();

            await Assert.That(users.Count).IsEqualTo(51);
            await Assert.That(users.All(user => user.Tag is >= User.MinTag and <= User.MaxTag)).IsTrue();
            await Assert.That(users.Where(user => user.Name != "Moritz").All(user => user.Name is "max" or "Max")).IsTrue();
            await Assert.That(users.Select(user => user.UniqueName.ToUpperInvariant()).Distinct().Count()).IsEqualTo(51);
        }
    }

    private static async Task<HashSet<string>> NamesAsync(string connectionString)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(NamesQuery, connection);
        await using var reader = await command.ExecuteReaderAsync();
        var names = new HashSet<string>(StringComparer.Ordinal);
        while (await reader.ReadAsync())
        {
            names.Add(reader.GetString(0));
        }

        return names;
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
            .Options);

    private static async Task ExecuteAsync(string connectionString, string sql)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }

}
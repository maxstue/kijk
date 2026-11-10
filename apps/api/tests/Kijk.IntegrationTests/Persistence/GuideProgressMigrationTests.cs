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
public class GuideProgressMigrationTests
{
    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Test]
    public async Task CleanupPreservesChecklistButDoesNotTurnConsumptionTimeIntoTourCompletion()
    {
        const string database = "guide_progress_cleanup";
        await using (var connection = new NpgsqlConnection(PostgreSqlTestDatabase.ConnectionString))
        {
            await connection.OpenAsync();
            await using var command = new NpgsqlCommand($"DROP DATABASE IF EXISTS {database} WITH (FORCE); CREATE DATABASE {database};", connection);
            await command.ExecuteNonQueryAsync();
        }
        var connectionString = new NpgsqlConnectionStringBuilder(PostgreSqlTestDatabase.ConnectionString) { Database = database }.ConnectionString;
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString, postgres => postgres.MapEnum<CreatorType>())
            .UseSnakeCaseNamingConvention()
            .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning))
            .Options);
        var migrator = db.GetInfrastructure().GetRequiredService<IMigrator>();
        await migrator.MigrateAsync("20261109210838_AddGuideSteps");
        var id = Guid.NewGuid();
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO users (id, auth_id, name, created_at, guide_hidden, guide_first_consumption_at, guide_completed_version, guide_completed_steps)
            VALUES ({id}, 'guide-migration', 'Guide migration', now(), TRUE, now(), 1, ARRAY['dashboard', 'finances']::text[])
            """);

        await migrator.MigrateAsync("20261110063712_SimplifyGuideProgress");

        var user = await db.Users.SingleAsync(item => item.Id == id);
        await Assert.That(user.GuideCompletedVersion).IsEqualTo(1);
        await Assert.That(user.GuideCompletedSteps).IsEquivalentTo(["dashboard", "finances"]);
        await Assert.That(user.GuideCompletedAt).IsNull();
        var obsoleteColumns = await db.Database.SqlQueryRaw<int>("""
            SELECT count(*)::int AS "Value" FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users'
              AND column_name IN ('guide_hidden', 'guide_first_consumption_at')
            """).SingleAsync();
        await Assert.That(obsoleteColumns).IsEqualTo(0);

        await migrator.MigrateAsync("20261109210838_AddGuideSteps");
        await migrator.MigrateAsync("20261110063712_SimplifyGuideProgress");
        db.ChangeTracker.Clear();
        var restored = await db.Users.SingleAsync(item => item.Id == id);
        await Assert.That(restored.GuideCompletedSteps).IsEquivalentTo(["dashboard", "finances"]);
        await Assert.That(restored.GuideCompletedAt).IsNull();
    }
}
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
public class SystemUnitCatalogMigrationTests
{
    private const string Previous = "20261115175251_AddLengthUnits";
    private const string Catalog = "20261115183344_UseSystemUnitCatalog";
    private static readonly Guid Liter = new("11111111-1111-4111-8111-111111111111");
    private static readonly Guid Kilometer = new("44444444-4444-4444-8444-444444444442");
    private static readonly Guid Piece = new("55555555-5555-4555-8555-555555555551");

    [Before(Class)]
    public static Task StartDatabase() => PostgreSqlTestDatabase.StartAsync();

    [Test]
    public async Task CustomAndLegacyUnitsMoveToSystemUnits()
    {
        const string database = "system_unit_catalog";
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
        await migrator.MigrateAsync(Previous);
        Guid userId = Guid.NewGuid(), spaceId = Guid.NewGuid();
        Guid barrel = Guid.NewGuid(), pieces = Guid.NewGuid(), kilometers = Guid.NewGuid();
        Guid barrelWater = Guid.NewGuid(), literWater = Guid.NewGuid(), laundry = Guid.NewGuid(), car = Guid.NewGuid();
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO users (id, auth_id, name, ai_enabled, guide_completed_version) VALUES ({userId}, 'units-migration', 'Units migration', FALSE, 0);
            INSERT INTO spaces (id, name, is_personal, ai_data_sharing, minimize_data, purpose_retention) VALUES ({spaceId}, 'Home', FALSE, 0, FALSE, 0);
            INSERT INTO units (id, name, symbol, creator_type, conversion_type, quantity_key, owner_user_id, reference_unit_id, conversion_factor, created_at) VALUES
                ({barrel}, 'Barrel', 'barrel', 'user', 'Factor', 'Volume', {userId}, {Liter}, 159, now()),
                ({pieces}, 'Stk', 'Stk', 'user', 'None', 'Legacy:pieces', {userId}, NULL, NULL, now()),
                ({kilometers}, 'KM', 'KM', 'user', 'None', 'Legacy:km', {userId}, NULL, NULL, now());
            INSERT INTO unit_spaces (unit_id, space_id, shared_by_user_id, shared_at) VALUES ({barrel}, {spaceId}, {userId}, now());
            INSERT INTO resources (id, name, unit_id, creator_type, space_id, created_at) VALUES
                ({barrelWater}, 'Water', {barrel}, 'user', {spaceId}, now()),
                ({literWater}, 'Water', {Liter}, 'user', {spaceId}, now()),
                ({laundry}, 'Laundry', {pieces}, 'user', {spaceId}, now()),
                ({car}, 'Car', {kilometers}, 'user', {spaceId}, now());
            INSERT INTO consumptions (id, name, value, calculated_consumption, value_type, starts_new_meter_segment, date, resource_id, space_id) VALUES
                ({Guid.NewGuid()}, 'Barrels', 2, 1, 'Absolute', FALSE, now(), {barrelWater}, {spaceId});
            INSERT INTO limits (id, name, threshold, period, active, resource_id, space_id, created_by_id) VALUES
                ({Guid.NewGuid()}, 'Barrels', 3, 0, TRUE, {barrelWater}, {spaceId}, {userId});
            """);

        await migrator.MigrateAsync(Catalog);

        var resources = await db.Resources.AsNoTracking().ToDictionaryAsync(item => item.Id);
        await Assert.That(resources[barrelWater].UnitId).IsEqualTo(Liter);
        await Assert.That(resources[barrelWater].Name).IsEqualTo("Water (barrel)");
        await Assert.That(resources[literWater].Name).IsEqualTo("Water");
        await Assert.That(resources[laundry].UnitId).IsEqualTo(Piece);
        await Assert.That(resources[car].UnitId).IsEqualTo(Kilometer);
        var consumption = await db.Consumptions.AsNoTracking().SingleAsync();
        await Assert.That(consumption.Value).IsEqualTo(318m);
        await Assert.That(consumption.CalculatedConsumption).IsEqualTo(159m);
        await Assert.That((await db.Limits.AsNoTracking().SingleAsync()).Threshold).IsEqualTo(477m);
        await Assert.That(await db.Units.CountAsync()).IsEqualTo(12);
        await Assert.That(await db.Units.AnyAsync(unit => unit.Id == Piece && unit.QuantityKey == "Count")).IsTrue();
        await Assert.That(await db.Permissions.AnyAsync(permission => permission.Name == "units:share")).IsFalse();

        await migrator.MigrateAsync(Previous);
        await migrator.MigrateAsync(Catalog);
        await Assert.That(await db.Units.AnyAsync(unit => unit.Id == Piece && unit.QuantityKey == "Count")).IsTrue();
    }
}
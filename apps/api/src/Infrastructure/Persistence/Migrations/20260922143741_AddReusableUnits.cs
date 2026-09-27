using System;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReusableUnits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_resources_household_id_normalized_name_normalized_unit",
                table: "resources");

            migrationBuilder.DropIndex(
                name: "ix_resources_normalized_name_normalized_unit",
                table: "resources");

            migrationBuilder.AddColumn<Guid>(
                name: "unit_id",
                table: "resources",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "units",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    symbol = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    creator_type = table.Column<CreatorType>(type: "creator_type", nullable: false),
                    conversion_type = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    quantity_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    units_net_unit_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    reference_unit_id = table.Column<Guid>(type: "uuid", nullable: true),
                    conversion_factor = table.Column<decimal>(type: "numeric(28,12)", precision: 28, scale: 12, nullable: true),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    archived_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    normalized_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true, computedColumnSql: "lower(btrim(name))", stored: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_units", x => x.id);
                    table.ForeignKey(
                        name: "fk_units_units_reference_unit_id",
                        column: x => x.reference_unit_id,
                        principalTable: "units",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_units_users_owner_user_id",
                        column: x => x.owner_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "unit_households",
                columns: table => new
                {
                    unit_id = table.Column<Guid>(type: "uuid", nullable: false),
                    household_id = table.Column<Guid>(type: "uuid", nullable: false),
                    shared_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    shared_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_unit_households", x => new { x.unit_id, x.household_id });
                    table.ForeignKey(
                        name: "fk_unit_households_households_household_id",
                        column: x => x.household_id,
                        principalTable: "households",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_unit_households_units_unit_id",
                        column: x => x.unit_id,
                        principalTable: "units",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_unit_households_users_shared_by_user_id",
                        column: x => x.shared_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "units",
                columns: new[] { "id", "archived_at", "conversion_factor", "conversion_type", "created_at", "creator_type", "deleted_at", "name", "owner_user_id", "quantity_key", "reference_unit_id", "symbol", "units_net_unit_name", "updated_at" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-4111-8111-111111111111"), null, null, "UnitsNet", new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "Liter", null, "Volume", null, "l", "Liter", null },
                    { new Guid("11111111-1111-4111-8111-111111111112"), null, null, "UnitsNet", new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "Milliliter", null, "Volume", null, "ml", "Milliliter", null },
                    { new Guid("11111111-1111-4111-8111-111111111113"), null, null, "UnitsNet", new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "Cubic meter", null, "Volume", null, "m³", "CubicMeter", null },
                    { new Guid("22222222-2222-4222-8222-222222222221"), null, null, "UnitsNet", new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "Watt hour", null, "Energy", null, "Wh", "WattHour", null },
                    { new Guid("22222222-2222-4222-8222-222222222222"), null, null, "UnitsNet", new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "Kilowatt hour", null, "Energy", null, "kWh", "KilowattHour", null },
                    { new Guid("22222222-2222-4222-8222-222222222223"), null, null, "UnitsNet", new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "Megawatt hour", null, "Energy", null, "MWh", "MegawattHour", null },
                    { new Guid("33333333-3333-4333-8333-333333333331"), null, null, "UnitsNet", new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "Gram", null, "Mass", null, "g", "Gram", null },
                    { new Guid("33333333-3333-4333-8333-333333333332"), null, null, "UnitsNet", new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "Kilogram", null, "Mass", null, "kg", "Kilogram", null },
                    { new Guid("33333333-3333-4333-8333-333333333333"), null, null, "UnitsNet", new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "Tonne", null, "Mass", null, "t", "Tonne", null }
                });

            migrationBuilder.Sql("""
                UPDATE resources
                SET unit_id = CASE lower(btrim(unit))
                    WHEN 'l' THEN '11111111-1111-4111-8111-111111111111'::uuid
                    WHEN 'liter' THEN '11111111-1111-4111-8111-111111111111'::uuid
                    WHEN 'ml' THEN '11111111-1111-4111-8111-111111111112'::uuid
                    WHEN 'milliliter' THEN '11111111-1111-4111-8111-111111111112'::uuid
                    WHEN 'm3' THEN '11111111-1111-4111-8111-111111111113'::uuid
                    WHEN 'm³' THEN '11111111-1111-4111-8111-111111111113'::uuid
                    WHEN 'kubikmeter' THEN '11111111-1111-4111-8111-111111111113'::uuid
                    WHEN 'wh' THEN '22222222-2222-4222-8222-222222222221'::uuid
                    WHEN 'kwh' THEN '22222222-2222-4222-8222-222222222222'::uuid
                    WHEN 'mwh' THEN '22222222-2222-4222-8222-222222222223'::uuid
                    WHEN 'g' THEN '33333333-3333-4333-8333-333333333331'::uuid
                    WHEN 'gramm' THEN '33333333-3333-4333-8333-333333333331'::uuid
                    WHEN 'kg' THEN '33333333-3333-4333-8333-333333333332'::uuid
                    WHEN 'kilogramm' THEN '33333333-3333-4333-8333-333333333332'::uuid
                    WHEN 't' THEN '33333333-3333-4333-8333-333333333333'::uuid
                    WHEN 'tonne' THEN '33333333-3333-4333-8333-333333333333'::uuid
                    ELSE NULL
                END;

                INSERT INTO units (
                    id, name, symbol, creator_type, conversion_type, quantity_key,
                    owner_user_id, created_at)
                SELECT legacy_id, source.unit, source.unit,
                    CASE WHEN source.household_id IS NULL THEN 'system'::creator_type ELSE 'user'::creator_type END,
                    'None', 'Legacy:' || legacy_id::text, owner_user_id, now()
                FROM (
                    SELECT DISTINCT ON (lower(btrim(resource.unit)), resource.household_id)
                        resource.unit,
                        resource.household_id,
                        md5('legacy:' || lower(btrim(resource.unit)) || ':' || coalesce(resource.household_id::text, 'system'))::uuid AS legacy_id,
                        (SELECT link.user_id
                         FROM user_households link
                         WHERE link.household_id = resource.household_id
                         ORDER BY link.created_at, link.user_id
                         LIMIT 1) AS owner_user_id
                    FROM resources resource
                    WHERE resource.unit_id IS NULL
                    ORDER BY lower(btrim(resource.unit)), resource.household_id
                ) source;

                UPDATE resources
                SET unit_id = md5('legacy:' || lower(btrim(unit)) || ':' || coalesce(household_id::text, 'system'))::uuid
                WHERE unit_id IS NULL;

                INSERT INTO unit_households (unit_id, household_id, shared_by_user_id, shared_at)
                SELECT DISTINCT resource.unit_id, resource.household_id, unit.owner_user_id, now()
                FROM resources resource
                JOIN units unit ON unit.id = resource.unit_id
                WHERE resource.household_id IS NOT NULL
                  AND unit.conversion_type = 'None'
                  AND unit.owner_user_id IS NOT NULL;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "unit_id",
                table: "resources",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.DropColumn(
                name: "normalized_unit",
                table: "resources");

            migrationBuilder.DropColumn(
                name: "unit",
                table: "resources");

            migrationBuilder.CreateIndex(
                name: "ix_resources_household_id_normalized_name_unit_id",
                table: "resources",
                columns: new[] { "household_id", "normalized_name", "unit_id" },
                unique: true,
                filter: "household_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_resources_normalized_name_unit_id",
                table: "resources",
                columns: new[] { "normalized_name", "unit_id" },
                unique: true,
                filter: "household_id IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_resources_unit_id",
                table: "resources",
                column: "unit_id");

            migrationBuilder.CreateIndex(
                name: "ix_unit_households_household_id",
                table: "unit_households",
                column: "household_id");

            migrationBuilder.CreateIndex(
                name: "ix_unit_households_shared_by_user_id",
                table: "unit_households",
                column: "shared_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_units_owner_user_id_normalized_name",
                table: "units",
                columns: new[] { "owner_user_id", "normalized_name" },
                unique: true,
                filter: "creator_type = 'user' AND archived_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_units_quantity_key_units_net_unit_name",
                table: "units",
                columns: new[] { "quantity_key", "units_net_unit_name" },
                unique: true,
                filter: "creator_type = 'system'");

            migrationBuilder.CreateIndex(
                name: "ix_units_reference_unit_id",
                table: "units",
                column: "reference_unit_id");

            migrationBuilder.AddForeignKey(
                name: "fk_resources_units_unit_id",
                table: "resources",
                column: "unit_id",
                principalTable: "units",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_resources_units_unit_id",
                table: "resources");

            migrationBuilder.DropIndex(
                name: "ix_resources_household_id_normalized_name_unit_id",
                table: "resources");

            migrationBuilder.DropIndex(
                name: "ix_resources_normalized_name_unit_id",
                table: "resources");

            migrationBuilder.DropIndex(
                name: "ix_resources_unit_id",
                table: "resources");

            migrationBuilder.AddColumn<string>(
                name: "unit",
                table: "resources",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "normalized_unit",
                table: "resources",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true,
                computedColumnSql: "lower(btrim(unit))",
                stored: true);

            migrationBuilder.Sql("""
                UPDATE resources
                SET unit = units.symbol
                FROM units
                WHERE units.id = resources.unit_id;
                """);

            migrationBuilder.DropColumn(
                name: "unit_id",
                table: "resources");

            migrationBuilder.DropTable(
                name: "unit_households");

            migrationBuilder.DropTable(
                name: "units");

            migrationBuilder.CreateIndex(
                name: "ix_resources_household_id_normalized_name_normalized_unit",
                table: "resources",
                columns: new[] { "household_id", "normalized_name", "normalized_unit" },
                unique: true,
                filter: "household_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_resources_normalized_name_normalized_unit",
                table: "resources",
                columns: new[] { "normalized_name", "normalized_unit" },
                unique: true,
                filter: "household_id IS NULL");
        }
    }
}

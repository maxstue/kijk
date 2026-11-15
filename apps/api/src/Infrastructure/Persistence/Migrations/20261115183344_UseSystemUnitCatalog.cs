using System;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UseSystemUnitCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Resources move from custom and legacy units to system units before the custom units are removed:
            // factor units become their reference unit with converted values, legacy free-text units the system unit
            // with the same symbol or name, and anything else Piece. A resource whose name and new unit collide with
            // another resource of its space gets its old symbol in the name, numbered until the name is free.
            migrationBuilder.Sql("""
                INSERT INTO units (id, name, symbol, creator_type, conversion_type, quantity_key, created_at)
                VALUES ('55555555-5555-4555-8555-555555555551', 'Piece', 'pcs', 'system', 'None', 'Count',
                    '2026-09-22T00:00:00Z')
                ON CONFLICT (id) DO UPDATE SET quantity_key = excluded.quantity_key;

                CREATE TEMP TABLE unit_replacements ON COMMIT DROP AS
                SELECT unit.id AS unit_id,
                    unit.symbol,
                    CASE WHEN unit.conversion_type = 'Factor' THEN unit.reference_unit_id
                        ELSE coalesce(
                            (SELECT system_unit.id
                             FROM units system_unit
                             WHERE system_unit.creator_type = 'system'
                               AND system_unit.conversion_type = 'UnitsNet'
                               AND (lower(system_unit.symbol) = lower(btrim(unit.symbol))
                                    OR lower(system_unit.name) = lower(btrim(unit.name)))
                             ORDER BY lower(system_unit.symbol) = lower(btrim(unit.symbol)) DESC
                             LIMIT 1),
                            '55555555-5555-4555-8555-555555555551'::uuid)
                    END AS replacement_id,
                    CASE WHEN unit.conversion_type = 'Factor' THEN unit.conversion_factor ELSE 1 END AS factor
                FROM units unit
                WHERE unit.id <> '55555555-5555-4555-8555-555555555551'
                  AND NOT (unit.creator_type = 'system' AND unit.conversion_type = 'UnitsNet');

                UPDATE consumptions consumption
                SET value = consumption.value * replacement.factor,
                    calculated_consumption = consumption.calculated_consumption * replacement.factor
                FROM resources resource
                JOIN unit_replacements replacement ON replacement.unit_id = resource.unit_id
                WHERE consumption.resource_id = resource.id AND replacement.factor <> 1;

                UPDATE limits limit_row
                SET threshold = limit_row.threshold * replacement.factor
                FROM resources resource
                JOIN unit_replacements replacement ON replacement.unit_id = resource.unit_id
                WHERE limit_row.resource_id = resource.id AND replacement.factor <> 1;

                DO $$
                DECLARE
                    resource_row record;
                    candidate text;
                    suffix text;
                    attempt int;
                BEGIN
                    FOR resource_row IN
                        SELECT resource.id, resource.name, resource.space_id, replacement.symbol, replacement.replacement_id
                        FROM resources resource
                        JOIN unit_replacements replacement ON replacement.unit_id = resource.unit_id
                        ORDER BY resource.created_at, resource.id
                    LOOP
                        candidate := resource_row.name;
                        attempt := 0;
                        WHILE EXISTS (
                            SELECT 1
                            FROM resources other
                            LEFT JOIN unit_replacements other_replacement ON other_replacement.unit_id = other.unit_id
                            WHERE other.id <> resource_row.id
                              AND other.space_id IS NOT DISTINCT FROM resource_row.space_id
                              AND other.name = candidate COLLATE case_insensitive
                              AND coalesce(other_replacement.replacement_id, other.unit_id) = resource_row.replacement_id)
                        LOOP
                            attempt := attempt + 1;
                            suffix := ' (' || resource_row.symbol || CASE WHEN attempt > 1 THEN ' ' || attempt ELSE '' END || ')';
                            candidate := rtrim(left(resource_row.name, 30 - length(suffix))) || suffix;
                        END LOOP;

                        IF candidate <> resource_row.name THEN
                            UPDATE resources SET name = candidate WHERE id = resource_row.id;
                        END IF;
                    END LOOP;
                END $$;

                UPDATE resources resource
                SET unit_id = replacement.replacement_id
                FROM unit_replacements replacement
                WHERE resource.unit_id = replacement.unit_id;

                DELETE FROM units WHERE id IN (SELECT unit_id FROM unit_replacements);
                """);

            migrationBuilder.DropForeignKey(
                name: "fk_units_units_reference_unit_id",
                table: "units");

            migrationBuilder.DropForeignKey(
                name: "fk_units_users_owner_user_id",
                table: "units");

            migrationBuilder.DropTable(
                name: "unit_spaces");

            migrationBuilder.DropIndex(
                name: "ix_units_owner_user_id_name",
                table: "units");

            migrationBuilder.DropIndex(
                name: "ix_units_quantity_key_units_net_unit_name",
                table: "units");

            migrationBuilder.DropIndex(
                name: "ix_units_reference_unit_id",
                table: "units");

            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("57820fa1-c443-458d-b8d3-40ef527720d4"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") });

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("57820fa1-c443-458d-b8d3-40ef527720d4"));

            migrationBuilder.DropColumn(
                name: "archived_at",
                table: "units");

            migrationBuilder.DropColumn(
                name: "conversion_factor",
                table: "units");

            migrationBuilder.DropColumn(
                name: "conversion_type",
                table: "units");

            migrationBuilder.DropColumn(
                name: "creator_type",
                table: "units");

            migrationBuilder.DropColumn(
                name: "owner_user_id",
                table: "units");

            migrationBuilder.DropColumn(
                name: "reference_unit_id",
                table: "units");

            migrationBuilder.AlterColumn<string>(
                name: "symbol",
                table: "units",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                collation: "case_insensitive",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.CreateIndex(
                name: "ix_units_name",
                table: "units",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_units_symbol",
                table: "units",
                column: "symbol",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_units_name",
                table: "units");

            migrationBuilder.DropIndex(
                name: "ix_units_symbol",
                table: "units");

            migrationBuilder.AlterColumn<string>(
                name: "symbol",
                table: "units",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldCollation: "case_insensitive");

            migrationBuilder.AddColumn<DateTime>(
                name: "archived_at",
                table: "units",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "conversion_factor",
                table: "units",
                type: "numeric(28,12)",
                precision: 28,
                scale: 12,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "conversion_type",
                table: "units",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<CreatorType>(
                name: "creator_type",
                table: "units",
                type: "creator_type",
                nullable: false,
                defaultValue: CreatorType.System);

            migrationBuilder.AddColumn<Guid>(
                name: "owner_user_id",
                table: "units",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "reference_unit_id",
                table: "units",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "unit_spaces",
                columns: table => new
                {
                    unit_id = table.Column<Guid>(type: "uuid", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    shared_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    shared_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_unit_spaces", x => new { x.unit_id, x.space_id });
                    table.ForeignKey(
                        name: "fk_unit_spaces_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_unit_spaces_units_unit_id",
                        column: x => x.unit_id,
                        principalTable: "units",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_unit_spaces_users_shared_by_user_id",
                        column: x => x.shared_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "permissions",
                columns: new[] { "id", "created_at", "deleted_at", "name", "updated_at" },
                values: new object[] { new Guid("57820fa1-c443-458d-b8d3-40ef527720d4"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "units:share", null });

            migrationBuilder.UpdateData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("11111111-1111-4111-8111-111111111111"),
                columns: new[] { "archived_at", "conversion_factor", "conversion_type", "creator_type", "owner_user_id", "reference_unit_id" },
                values: new object[] { null, null, "UnitsNet", CreatorType.System, null, null });

            migrationBuilder.UpdateData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("11111111-1111-4111-8111-111111111112"),
                columns: new[] { "archived_at", "conversion_factor", "conversion_type", "creator_type", "owner_user_id", "reference_unit_id" },
                values: new object[] { null, null, "UnitsNet", CreatorType.System, null, null });

            migrationBuilder.UpdateData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("11111111-1111-4111-8111-111111111113"),
                columns: new[] { "archived_at", "conversion_factor", "conversion_type", "creator_type", "owner_user_id", "reference_unit_id" },
                values: new object[] { null, null, "UnitsNet", CreatorType.System, null, null });

            migrationBuilder.UpdateData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("22222222-2222-4222-8222-222222222221"),
                columns: new[] { "archived_at", "conversion_factor", "conversion_type", "creator_type", "owner_user_id", "reference_unit_id" },
                values: new object[] { null, null, "UnitsNet", CreatorType.System, null, null });

            migrationBuilder.UpdateData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("22222222-2222-4222-8222-222222222222"),
                columns: new[] { "archived_at", "conversion_factor", "conversion_type", "creator_type", "owner_user_id", "reference_unit_id" },
                values: new object[] { null, null, "UnitsNet", CreatorType.System, null, null });

            migrationBuilder.UpdateData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("22222222-2222-4222-8222-222222222223"),
                columns: new[] { "archived_at", "conversion_factor", "conversion_type", "creator_type", "owner_user_id", "reference_unit_id" },
                values: new object[] { null, null, "UnitsNet", CreatorType.System, null, null });

            migrationBuilder.UpdateData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("33333333-3333-4333-8333-333333333331"),
                columns: new[] { "archived_at", "conversion_factor", "conversion_type", "creator_type", "owner_user_id", "reference_unit_id" },
                values: new object[] { null, null, "UnitsNet", CreatorType.System, null, null });

            migrationBuilder.UpdateData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("33333333-3333-4333-8333-333333333332"),
                columns: new[] { "archived_at", "conversion_factor", "conversion_type", "creator_type", "owner_user_id", "reference_unit_id" },
                values: new object[] { null, null, "UnitsNet", CreatorType.System, null, null });

            migrationBuilder.UpdateData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("33333333-3333-4333-8333-333333333333"),
                columns: new[] { "archived_at", "conversion_factor", "conversion_type", "creator_type", "owner_user_id", "reference_unit_id" },
                values: new object[] { null, null, "UnitsNet", CreatorType.System, null, null });

            migrationBuilder.UpdateData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("44444444-4444-4444-8444-444444444441"),
                columns: new[] { "archived_at", "conversion_factor", "conversion_type", "creator_type", "owner_user_id", "reference_unit_id" },
                values: new object[] { null, null, "UnitsNet", CreatorType.System, null, null });

            migrationBuilder.UpdateData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("44444444-4444-4444-8444-444444444442"),
                columns: new[] { "archived_at", "conversion_factor", "conversion_type", "creator_type", "owner_user_id", "reference_unit_id" },
                values: new object[] { null, null, "UnitsNet", CreatorType.System, null, null });

            // Custom units are not restored; Piece stays as a non-convertible unit because resources may use it.
            migrationBuilder.Sql("""
                UPDATE units
                SET conversion_type = 'None', quantity_key = 'Legacy:' || id::text
                WHERE id = '55555555-5555-4555-8555-555555555551';
                """);

            migrationBuilder.InsertData(
                table: "roles_permissions",
                columns: new[] { "permissions_id", "roles_id" },
                values: new object[] { new Guid("57820fa1-c443-458d-b8d3-40ef527720d4"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") });

            migrationBuilder.CreateIndex(
                name: "ix_units_owner_user_id_name",
                table: "units",
                columns: new[] { "owner_user_id", "name" },
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

            migrationBuilder.CreateIndex(
                name: "ix_unit_spaces_shared_by_user_id",
                table: "unit_spaces",
                column: "shared_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_unit_spaces_space_id",
                table: "unit_spaces",
                column: "space_id");

            migrationBuilder.AddForeignKey(
                name: "fk_units_units_reference_unit_id",
                table: "units",
                column: "reference_unit_id",
                principalTable: "units",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_units_users_owner_user_id",
                table: "units",
                column: "owner_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}

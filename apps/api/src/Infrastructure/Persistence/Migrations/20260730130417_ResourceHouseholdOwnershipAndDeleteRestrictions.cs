using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ResourceHouseholdOwnershipAndDeleteRestrictions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_consumptions_resources_resource_id",
                table: "consumptions");

            migrationBuilder.DropForeignKey(
                name: "fk_consumptions_limits_resources_resource_id",
                table: "consumptions_limits");

            migrationBuilder.DropIndex(
                name: "ix_resources_name_unit",
                table: "resources");

            migrationBuilder.AlterColumn<string>(
                name: "unit",
                table: "resources",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "resources",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "color",
                table: "resources",
                type: "character varying(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "#89CEA4",
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "#89CEA4");

            migrationBuilder.AddColumn<Guid>(
                name: "household_id",
                table: "resources",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "normalized_name",
                table: "resources",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true,
                computedColumnSql: "lower(btrim(name))",
                stored: true);

            migrationBuilder.AddColumn<string>(
                name: "normalized_unit",
                table: "resources",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true,
                computedColumnSql: "lower(btrim(unit))",
                stored: true);

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

            migrationBuilder.AddForeignKey(
                name: "fk_consumptions_resources_resource_id",
                table: "consumptions",
                column: "resource_id",
                principalTable: "resources",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_consumptions_limits_resources_resource_id",
                table: "consumptions_limits",
                column: "resource_id",
                principalTable: "resources",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_resources_households_household_id",
                table: "resources",
                column: "household_id",
                principalTable: "households",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_consumptions_resources_resource_id",
                table: "consumptions");

            migrationBuilder.DropForeignKey(
                name: "fk_consumptions_limits_resources_resource_id",
                table: "consumptions_limits");

            migrationBuilder.DropForeignKey(
                name: "fk_resources_households_household_id",
                table: "resources");

            migrationBuilder.DropIndex(
                name: "ix_resources_household_id_normalized_name_normalized_unit",
                table: "resources");

            migrationBuilder.DropIndex(
                name: "ix_resources_normalized_name_normalized_unit",
                table: "resources");

            migrationBuilder.DropColumn(
                name: "normalized_name",
                table: "resources");

            migrationBuilder.DropColumn(
                name: "normalized_unit",
                table: "resources");

            migrationBuilder.DropColumn(
                name: "household_id",
                table: "resources");

            migrationBuilder.AlterColumn<string>(
                name: "unit",
                table: "resources",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10);

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "resources",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);

            migrationBuilder.AlterColumn<string>(
                name: "color",
                table: "resources",
                type: "text",
                nullable: false,
                defaultValue: "#89CEA4",
                oldClrType: typeof(string),
                oldType: "character varying(7)",
                oldMaxLength: 7,
                oldDefaultValue: "#89CEA4");

            migrationBuilder.CreateIndex(
                name: "ix_resources_name_unit",
                table: "resources",
                columns: new[] { "name", "unit" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_consumptions_resources_resource_id",
                table: "consumptions",
                column: "resource_id",
                principalTable: "resources",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_consumptions_limits_resources_resource_id",
                table: "consumptions_limits",
                column: "resource_id",
                principalTable: "resources",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

using Kijk.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(AppDbContext))]
[Migration("20260908205000_AddDailyConsumptionValues")]
public partial class AddDailyConsumptionValues : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>(
            name: "calculated_consumption",
            table: "consumptions",
            type: "numeric",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "value_type",
            table: "consumptions",
            type: "character varying(16)",
            maxLength: 16,
            nullable: true);

        // Existing values represented monthly consumption amounts. Preserve that meaning during the backfill.
        migrationBuilder.Sql(
            "UPDATE consumptions SET calculated_consumption = value, value_type = 'Relative'");

        migrationBuilder.AlterColumn<decimal>(
            name: "calculated_consumption",
            table: "consumptions",
            type: "numeric",
            nullable: false,
            oldClrType: typeof(decimal),
            oldType: "numeric",
            oldNullable: true);

        migrationBuilder.AlterColumn<string>(
            name: "value_type",
            table: "consumptions",
            type: "character varying(16)",
            maxLength: 16,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(16)",
            oldMaxLength: 16,
            oldNullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "calculated_consumption", table: "consumptions");
        migrationBuilder.DropColumn(name: "value_type", table: "consumptions");
    }
}

using Kijk.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(AppDbContext))]
[Migration("20260831212000_AddConsumptionLimitUniqueIndex")]
public partial class AddConsumptionLimitUniqueIndex : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateIndex(
            name: "ix_consumptions_limits_household_id_resource_id_period",
            table: "consumptions_limits",
            columns: ["household_id", "resource_id", "period"],
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "ix_consumptions_limits_household_id_resource_id_period",
            table: "consumptions_limits");
    }
}

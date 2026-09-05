using Kijk.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(AppDbContext))]
[Migration("20260905120000_RemoveConsumptionLimitStoredEvaluation")]
public partial class RemoveConsumptionLimitStoredEvaluation : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "actual_value", table: "consumptions_limits");
        migrationBuilder.DropColumn(name: "last_occurrence", table: "consumptions_limits");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Restore the previous placeholder fields; historical values cannot be recovered.
        migrationBuilder.AddColumn<decimal>(
            name: "actual_value",
            table: "consumptions_limits",
            type: "numeric",
            nullable: false,
            defaultValue: 0m);

        migrationBuilder.AddColumn<DateTime>(
            name: "last_occurrence",
            table: "consumptions_limits",
            type: "timestamp with time zone",
            nullable: false,
            defaultValue: DateTime.UnixEpoch);

        migrationBuilder.Sql("UPDATE consumptions_limits SET last_occurrence = date_trunc('month', created_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'");
    }
}

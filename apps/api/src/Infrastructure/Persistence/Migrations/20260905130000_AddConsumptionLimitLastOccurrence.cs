using Kijk.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(AppDbContext))]
[Migration("20260905130000_AddConsumptionLimitLastOccurrence")]
public partial class AddConsumptionLimitLastOccurrence : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "last_occurrence",
            table: "consumptions_limits",
            type: "timestamp with time zone",
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "last_occurrence", table: "consumptions_limits");
    }
}

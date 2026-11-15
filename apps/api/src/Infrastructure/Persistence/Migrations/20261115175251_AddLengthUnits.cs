using System;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLengthUnits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "units",
                columns: new[] { "id", "archived_at", "conversion_factor", "conversion_type", "created_at", "creator_type", "deleted_at", "name", "owner_user_id", "quantity_key", "reference_unit_id", "symbol", "units_net_unit_name", "updated_at" },
                values: new object[,]
                {
                    { new Guid("44444444-4444-4444-8444-444444444441"), null, null, "UnitsNet", new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "Meter", null, "Length", null, "m", "Meter", null },
                    { new Guid("44444444-4444-4444-8444-444444444442"), null, null, "UnitsNet", new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "Kilometer", null, "Length", null, "km", "Kilometer", null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("44444444-4444-4444-8444-444444444441"));

            migrationBuilder.DeleteData(
                table: "units",
                keyColumn: "id",
                keyValue: new Guid("44444444-4444-4444-8444-444444444442"));
        }
    }
}

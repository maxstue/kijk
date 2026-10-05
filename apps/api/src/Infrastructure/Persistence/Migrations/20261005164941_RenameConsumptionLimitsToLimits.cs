using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameConsumptionLimitsToLimits : Migration
    {
        // Renames only: the generated drop and re-create would have deleted every existing limit.
        private static readonly string[] Indexes = ["created_by_id", "household_id_resource_id_period", "name", "resource_id"];

        private static readonly (string Old, string New)[] ForeignKeys =
        [
            ("fk_consumptions_limits_households_household_id", "fk_limits_households_household_id"),
            ("fk_consumptions_limits_resources_resource_id", "fk_limits_resources_resource_id"),
            ("fk_consumptions_limits_users_created_by_id", "fk_limits_users_created_by_id")
        ];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(name: "consumptions_limits", newName: "limits");
            migrationBuilder.RenameColumn(name: "limit", table: "limits", newName: "threshold");
            migrationBuilder.Sql("""ALTER TABLE "limits" RENAME CONSTRAINT "pk_consumptions_limits" TO "pk_limits";""");
            foreach (var (oldName, newName) in ForeignKeys)
            {
                migrationBuilder.Sql($"""ALTER TABLE "limits" RENAME CONSTRAINT "{oldName}" TO "{newName}";""");
            }

            foreach (var index in Indexes)
            {
                migrationBuilder.RenameIndex(name: $"ix_consumptions_limits_{index}", table: "limits", newName: $"ix_limits_{index}");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var index in Indexes)
            {
                migrationBuilder.RenameIndex(name: $"ix_limits_{index}", table: "limits", newName: $"ix_consumptions_limits_{index}");
            }

            foreach (var (oldName, newName) in ForeignKeys)
            {
                migrationBuilder.Sql($"""ALTER TABLE "limits" RENAME CONSTRAINT "{newName}" TO "{oldName}";""");
            }

            migrationBuilder.Sql("""ALTER TABLE "limits" RENAME CONSTRAINT "pk_limits" TO "pk_consumptions_limits";""");
            migrationBuilder.RenameColumn(name: "threshold", table: "limits", newName: "limit");
            migrationBuilder.RenameTable(name: "limits", newName: "consumptions_limits");
        }
    }
}

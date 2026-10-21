using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceExportPermission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "permissions",
                columns: new[] { "id", "created_at", "deleted_at", "name", "updated_at" },
                values: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a16"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "finances:export", null });

            migrationBuilder.InsertData(
                table: "roles_permissions",
                columns: new[] { "permissions_id", "roles_id" },
                values: new object[,]
                {
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a16"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a16"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a16"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") });

            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a16"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") });

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a16"));
        }
    }
}

using System;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBudgetsAndTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "accounts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    iban_last4 = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: true),
                    household_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_accounts", x => x.id);
                    table.ForeignKey(
                        name: "fk_accounts_households_household_id",
                        column: x => x.household_id,
                        principalTable: "households",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "categories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    kind = table.Column<int>(type: "integer", nullable: false),
                    creator_type = table.Column<CreatorType>(type: "creator_type", nullable: false),
                    household_id = table.Column<Guid>(type: "uuid", nullable: true),
                    normalized_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true, computedColumnSql: "lower(btrim(name))", stored: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_categories", x => x.id);
                    table.ForeignKey(
                        name: "fk_categories_households_household_id",
                        column: x => x.household_id,
                        principalTable: "households",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "budgets",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    valid_from = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    household_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_budgets", x => x.id);
                    table.ForeignKey(
                        name: "fk_budgets_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_budgets_households_household_id",
                        column: x => x.household_id,
                        principalTable: "households",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_budgets_users_created_by_id",
                        column: x => x.created_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "transactions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    counterparty = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    purpose = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    is_transfer = table.Column<bool>(type: "boolean", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: true),
                    category_source = table.Column<int>(type: "integer", nullable: true),
                    account_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    household_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_transactions", x => x.id);
                    table.ForeignKey(
                        name: "fk_transactions_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_transactions_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_transactions_households_household_id",
                        column: x => x.household_id,
                        principalTable: "households",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_transactions_users_created_by_id",
                        column: x => x.created_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "categories",
                columns: new[] { "id", "color", "created_at", "creator_type", "deleted_at", "household_id", "icon", "kind", "name" },
                values: new object[,]
                {
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f01"), "#16a34a", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, null, "shopping-basket", 0, "Groceries" },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f02"), "#2563eb", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, null, "house", 0, "Housing" },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f03"), "#f59e0b", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, null, "zap", 0, "Utilities" },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f04"), "#0891b2", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, null, "car", 0, "Mobility" },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f05"), "#db2777", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, null, "party-popper", 0, "Leisure" },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f06"), "#dc2626", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, null, "heart-pulse", 0, "Health" },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f07"), "#9333ea", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, null, "shopping-bag", 0, "Shopping" },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f08"), "#475569", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, null, "shield", 0, "Insurance" },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f09"), "#71717a", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, null, "circle-ellipsis", 0, "Other" },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f10"), "#059669", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, null, "wallet", 1, "Income" }
                });

            migrationBuilder.InsertData(
                table: "permissions",
                columns: new[] { "id", "created_at", "deleted_at", "name", "updated_at" },
                values: new object[,]
                {
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "finances:view", null },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a12"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "finances:record", null },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a13"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "finances:import", null },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a14"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "finances:configure", null },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a15"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "budgets:plan", null }
                });

            migrationBuilder.InsertData(
                table: "roles_permissions",
                columns: new[] { "permissions_id", "roles_id" },
                values: new object[,]
                {
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"), new Guid("3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a12"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a12"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a13"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a13"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a14"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a15"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") }
                });

            migrationBuilder.CreateIndex(
                name: "ix_accounts_household_id",
                table: "accounts",
                column: "household_id");

            migrationBuilder.CreateIndex(
                name: "ix_budgets_category_id",
                table: "budgets",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "ix_budgets_created_by_id",
                table: "budgets",
                column: "created_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_budgets_household_id_category_id_valid_from",
                table: "budgets",
                columns: new[] { "household_id", "category_id", "valid_from" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_categories_household_id_normalized_name",
                table: "categories",
                columns: new[] { "household_id", "normalized_name" },
                unique: true,
                filter: "household_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_categories_normalized_name",
                table: "categories",
                column: "normalized_name",
                unique: true,
                filter: "household_id IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_transactions_account_id",
                table: "transactions",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "ix_transactions_category_id",
                table: "transactions",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "ix_transactions_created_by_id",
                table: "transactions",
                column: "created_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_transactions_household_id_booking_date",
                table: "transactions",
                columns: new[] { "household_id", "booking_date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "budgets");

            migrationBuilder.DropTable(
                name: "transactions");

            migrationBuilder.DropTable(
                name: "accounts");

            migrationBuilder.DropTable(
                name: "categories");

            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") });

            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") });

            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"), new Guid("3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75") });

            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a12"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") });

            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a12"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") });

            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a13"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") });

            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a13"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") });

            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a14"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") });

            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a15"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") });

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"));

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a12"));

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a13"));

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a14"));

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a15"));
        }
    }
}

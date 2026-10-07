using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCsvImports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_transactions_account_id",
                table: "transactions");

            migrationBuilder.AddColumn<string>(
                name: "booking_key",
                table: "transactions",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "counterparty_key",
                table: "transactions",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "import_job_id",
                table: "transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_merchant_payment",
                table: "transactions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "key_version",
                table: "transactions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "purpose_retention",
                table: "households",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "kind",
                table: "accounts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "category_rules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    scope = table.Column<int>(type: "integer", nullable: false),
                    key = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    origin = table.Column<int>(type: "integer", nullable: false),
                    priority = table.Column<int>(type: "integer", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: false),
                    household_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_category_rules", x => x.id);
                    table.ForeignKey(
                        name: "fk_category_rules_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_category_rules_households_household_id",
                        column: x => x.household_id,
                        principalTable: "households",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "data_protection_keys",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    friendly_name = table.Column<string>(type: "text", nullable: true),
                    xml = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_data_protection_keys", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "import_jobs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    file_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    row_count = table.Column<int>(type: "integer", nullable: false),
                    processed_rows = table.Column<int>(type: "integer", nullable: false),
                    error_count = table.Column<int>(type: "integer", nullable: false),
                    imported_count = table.Column<int>(type: "integer", nullable: false),
                    error = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    proposed_mapping = table.Column<string>(type: "jsonb", nullable: true),
                    proposed_mapping_source = table.Column<int>(type: "integer", nullable: true),
                    mapping = table.Column<string>(type: "jsonb", nullable: true),
                    full_months = table.Column<List<DateTime>>(type: "timestamp with time zone[]", nullable: false),
                    edge_months = table.Column<List<DateTime>>(type: "timestamp with time zone[]", nullable: false),
                    replaced_months = table.Column<List<DateTime>>(type: "timestamp with time zone[]", nullable: false),
                    skipped_months = table.Column<List<DateTime>>(type: "timestamp with time zone[]", nullable: false),
                    key_version = table.Column<int>(type: "integer", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    household_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_import_jobs", x => x.id);
                    table.ForeignKey(
                        name: "fk_import_jobs_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "accounts",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_import_jobs_households_household_id",
                        column: x => x.household_id,
                        principalTable: "households",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_import_jobs_users_created_by_id",
                        column: x => x.created_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "import_profiles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    header_fingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    mapping = table.Column<string>(type: "jsonb", nullable: false),
                    version = table.Column<int>(type: "integer", nullable: false),
                    confirmed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    household_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_import_profiles", x => x.id);
                    table.ForeignKey(
                        name: "fk_import_profiles_households_household_id",
                        column: x => x.household_id,
                        principalTable: "households",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "import_candidates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    row_number = table.Column<int>(type: "integer", nullable: false),
                    booking_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    counterparty = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    purpose = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    is_merchant_payment = table.Column<bool>(type: "boolean", nullable: false),
                    booking_key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    counterparty_key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    category_id = table.Column<Guid>(type: "uuid", nullable: true),
                    category_source = table.Column<int>(type: "integer", nullable: true),
                    errors = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    excluded = table.Column<bool>(type: "boolean", nullable: false),
                    import_job_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_import_candidates", x => x.id);
                    table.ForeignKey(
                        name: "fk_import_candidates_import_jobs_import_job_id",
                        column: x => x.import_job_id,
                        principalTable: "import_jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "import_files",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    content = table.Column<byte[]>(type: "bytea", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    import_job_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_import_files", x => x.id);
                    table.ForeignKey(
                        name: "fk_import_files_import_jobs_import_job_id",
                        column: x => x.import_job_id,
                        principalTable: "import_jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_transactions_account_id_booking_date",
                table: "transactions",
                columns: new[] { "account_id", "booking_date" });

            migrationBuilder.CreateIndex(
                name: "ix_transactions_counterparty_key",
                table: "transactions",
                column: "counterparty_key");

            migrationBuilder.CreateIndex(
                name: "ix_transactions_import_job_id",
                table: "transactions",
                column: "import_job_id");

            migrationBuilder.CreateIndex(
                name: "ix_accounts_household_id_cash",
                table: "accounts",
                column: "household_id",
                unique: true,
                filter: "kind = 1");

            migrationBuilder.CreateIndex(
                name: "ix_category_rules_category_id",
                table: "category_rules",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "ix_category_rules_household_id_scope_key",
                table: "category_rules",
                columns: new[] { "household_id", "scope", "key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_import_candidates_import_job_id_row_number",
                table: "import_candidates",
                columns: new[] { "import_job_id", "row_number" });

            migrationBuilder.CreateIndex(
                name: "ix_import_files_expires_at",
                table: "import_files",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "ix_import_files_import_job_id",
                table: "import_files",
                column: "import_job_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_import_jobs_account_id_status",
                table: "import_jobs",
                columns: new[] { "account_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_import_jobs_created_by_id",
                table: "import_jobs",
                column: "created_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_import_jobs_household_id_created_at",
                table: "import_jobs",
                columns: new[] { "household_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_import_profiles_household_id_header_fingerprint_version",
                table: "import_profiles",
                columns: new[] { "household_id", "header_fingerprint", "version" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_transactions_import_jobs_import_job_id",
                table: "transactions",
                column: "import_job_id",
                principalTable: "import_jobs",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            // Every existing household gets its cash account for manually recorded transactions.
            migrationBuilder.Sql("""
                INSERT INTO accounts (id, name, kind, household_id, created_at)
                SELECT gen_random_uuid(), 'Cash', 1, h.id, now()
                FROM households h
                WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE a.household_id = h.id AND a.kind = 1);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE transactions SET account_id = NULL WHERE account_id IN (SELECT id FROM accounts WHERE kind = 1);
                DELETE FROM accounts WHERE kind = 1;
                """);

            migrationBuilder.DropForeignKey(
                name: "fk_transactions_import_jobs_import_job_id",
                table: "transactions");

            migrationBuilder.DropTable(
                name: "category_rules");

            migrationBuilder.DropTable(
                name: "data_protection_keys");

            migrationBuilder.DropTable(
                name: "import_candidates");

            migrationBuilder.DropTable(
                name: "import_files");

            migrationBuilder.DropTable(
                name: "import_profiles");

            migrationBuilder.DropTable(
                name: "import_jobs");

            migrationBuilder.DropIndex(
                name: "ix_transactions_account_id_booking_date",
                table: "transactions");

            migrationBuilder.DropIndex(
                name: "ix_transactions_counterparty_key",
                table: "transactions");

            migrationBuilder.DropIndex(
                name: "ix_transactions_import_job_id",
                table: "transactions");

            migrationBuilder.DropIndex(
                name: "ix_accounts_household_id_cash",
                table: "accounts");

            migrationBuilder.DropColumn(
                name: "booking_key",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "counterparty_key",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "import_job_id",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "is_merchant_payment",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "key_version",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "purpose_retention",
                table: "households");

            migrationBuilder.DropColumn(
                name: "kind",
                table: "accounts");

            migrationBuilder.CreateIndex(
                name: "ix_transactions_account_id",
                table: "transactions",
                column: "account_id");
        }
    }
}

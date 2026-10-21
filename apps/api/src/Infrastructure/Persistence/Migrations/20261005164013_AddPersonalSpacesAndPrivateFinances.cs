using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonalSpacesAndPrivateFinances : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_budgets_household_id_category_id_valid_from",
                table: "budgets");

            migrationBuilder.AddColumn<bool>(
                name: "is_personal",
                table: "households",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "owner_id",
                table: "budgets",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "owner_id",
                table: "accounts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_budgets_household_id_category_id_valid_from",
                table: "budgets",
                columns: new[] { "household_id", "category_id", "valid_from" },
                unique: true,
                filter: "owner_id IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_budgets_household_id_owner_id_category_id_valid_from",
                table: "budgets",
                columns: new[] { "household_id", "owner_id", "category_id", "valid_from" },
                unique: true,
                filter: "owner_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_budgets_owner_id",
                table: "budgets",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_accounts_owner_id",
                table: "accounts",
                column: "owner_id");

            migrationBuilder.AddForeignKey(
                name: "fk_accounts_users_owner_id",
                table: "accounts",
                column: "owner_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_budgets_users_owner_id",
                table: "budgets",
                column: "owner_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            // Every user who completed onboarding gets a personal space with a cash account, like new users do.
            migrationBuilder.Sql("""
                WITH new_spaces AS (
                    SELECT u.id AS user_id, gen_random_uuid() AS household_id
                    FROM users u
                    WHERE u.onboarding_completed_at IS NOT NULL
                      AND NOT EXISTS (
                          SELECT 1 FROM user_households uh
                          JOIN households h ON h.id = uh.household_id
                          WHERE uh.user_id = u.id AND h.is_personal)
                ),
                inserted_households AS (
                    INSERT INTO households (id, name, is_personal, purpose_retention, ai_data_sharing, minimize_data)
                    SELECT household_id, 'Personal', TRUE, 0, 0, FALSE FROM new_spaces
                ),
                inserted_memberships AS (
                    INSERT INTO user_households (id, user_id, household_id, role_id, is_active)
                    SELECT gen_random_uuid(), user_id, household_id, '0195624d-5bd9-754c-a92b-5e0e82e1ede1', FALSE FROM new_spaces
                )
                INSERT INTO accounts (id, name, kind, household_id)
                SELECT gen_random_uuid(), 'Cash', 1, household_id FROM new_spaces;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Personal spaces only exist since this migration; their data cannot be kept without the column.
            migrationBuilder.Sql("DELETE FROM households WHERE is_personal;");

            migrationBuilder.DropForeignKey(
                name: "fk_accounts_users_owner_id",
                table: "accounts");

            migrationBuilder.DropForeignKey(
                name: "fk_budgets_users_owner_id",
                table: "budgets");

            migrationBuilder.DropIndex(
                name: "ix_budgets_household_id_category_id_valid_from",
                table: "budgets");

            migrationBuilder.DropIndex(
                name: "ix_budgets_household_id_owner_id_category_id_valid_from",
                table: "budgets");

            migrationBuilder.DropIndex(
                name: "ix_budgets_owner_id",
                table: "budgets");

            migrationBuilder.DropIndex(
                name: "ix_accounts_owner_id",
                table: "accounts");

            migrationBuilder.DropColumn(
                name: "is_personal",
                table: "households");

            migrationBuilder.DropColumn(
                name: "owner_id",
                table: "budgets");

            migrationBuilder.DropColumn(
                name: "owner_id",
                table: "accounts");

            migrationBuilder.CreateIndex(
                name: "ix_budgets_household_id_category_id_valid_from",
                table: "budgets",
                columns: new[] { "household_id", "category_id", "valid_from" },
                unique: true);
        }
    }
}

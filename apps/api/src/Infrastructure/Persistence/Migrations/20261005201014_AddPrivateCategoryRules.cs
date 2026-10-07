using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPrivateCategoryRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_category_rules_space_id_scope_key",
                table: "category_rules");

            migrationBuilder.AddColumn<Guid>(
                name: "owner_id",
                table: "category_rules",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_category_rules_owner_id",
                table: "category_rules",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_category_rules_space_id_owner_id_scope_key",
                table: "category_rules",
                columns: new[] { "space_id", "owner_id", "scope", "key" },
                unique: true,
                filter: "owner_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_category_rules_space_id_scope_key",
                table: "category_rules",
                columns: new[] { "space_id", "scope", "key" },
                unique: true,
                filter: "owner_id IS NULL");

            migrationBuilder.AddForeignKey(
                name: "fk_category_rules_users_owner_id",
                table: "category_rules",
                column: "owner_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_category_rules_users_owner_id",
                table: "category_rules");

            migrationBuilder.DropIndex(
                name: "ix_category_rules_owner_id",
                table: "category_rules");

            migrationBuilder.DropIndex(
                name: "ix_category_rules_space_id_owner_id_scope_key",
                table: "category_rules");

            migrationBuilder.DropIndex(
                name: "ix_category_rules_space_id_scope_key",
                table: "category_rules");

            migrationBuilder.DropColumn(
                name: "owner_id",
                table: "category_rules");

            migrationBuilder.CreateIndex(
                name: "ix_category_rules_space_id_scope_key",
                table: "category_rules",
                columns: new[] { "space_id", "scope", "key" },
                unique: true);
        }
    }
}

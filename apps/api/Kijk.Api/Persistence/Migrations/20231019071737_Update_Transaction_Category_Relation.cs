using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Update_Transaction_Category_Relation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "category_transaction");

            migrationBuilder.AddColumn<Guid>(
                name: "category_id",
                table: "transaction",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_transaction_category_id",
                table: "transaction",
                column: "category_id");

            migrationBuilder.AddForeignKey(
                name: "fk_transaction_categories_category_id",
                table: "transaction",
                column: "category_id",
                principalTable: "category",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_transaction_categories_category_id",
                table: "transaction");

            migrationBuilder.DropIndex(
                name: "ix_transaction_category_id",
                table: "transaction");

            migrationBuilder.DropColumn(
                name: "category_id",
                table: "transaction");

            migrationBuilder.CreateTable(
                name: "category_transaction",
                columns: table => new
                {
                    categories_id = table.Column<Guid>(type: "uuid", nullable: false),
                    transactions_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_category_transaction", x => new { x.categories_id, x.transactions_id });
                    table.ForeignKey(
                        name: "fk_category_transaction_categories_categories_id",
                        column: x => x.categories_id,
                        principalTable: "category",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_category_transaction_transactions_transactions_id",
                        column: x => x.transactions_id,
                        principalTable: "transaction",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_category_transaction_transactions_id",
                table: "category_transaction",
                column: "transactions_id");
        }
    }
}

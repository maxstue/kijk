using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Add_User_Auth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "auth_id",
                table: "user",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_auth_id",
                table: "user",
                column: "auth_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_user_auth_id",
                table: "user");

            migrationBuilder.DropColumn(
                name: "auth_id",
                table: "user");
        }
    }
}

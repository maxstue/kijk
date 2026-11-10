using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyGuideProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "guide_hidden",
                table: "users");

            migrationBuilder.DropColumn(
                name: "guide_first_consumption_at",
                table: "users");

            migrationBuilder.AddColumn<DateTime>(
                name: "guide_completed_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "guide_completed_at",
                table: "users");

            migrationBuilder.AddColumn<DateTime>(
                name: "guide_first_consumption_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "guide_hidden",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}

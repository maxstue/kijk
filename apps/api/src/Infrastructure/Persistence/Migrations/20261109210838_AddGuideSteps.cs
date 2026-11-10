using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGuideSteps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string[]>(
                name: "guide_completed_steps",
                table: "users",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            migrationBuilder.Sql("UPDATE users SET guide_completed_steps = ARRAY['dashboard']::text[] WHERE guide_completed_version > 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "guide_completed_steps",
                table: "users");
        }
    }
}

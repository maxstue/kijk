using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAiFormatDetection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ai_unavailable",
                table: "import_jobs",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ai_unavailable",
                table: "import_jobs");
        }
    }
}

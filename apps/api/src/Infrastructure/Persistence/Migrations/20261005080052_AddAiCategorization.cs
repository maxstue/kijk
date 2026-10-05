using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAiCategorization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ai_enabled",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "ai_categorization_unavailable",
                table: "import_jobs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ai_categorized_count",
                table: "import_jobs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ai_data_sharing",
                table: "import_jobs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "ai_excluded",
                table: "import_candidates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "counts_as_offset",
                table: "import_candidates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_card_settlement",
                table: "import_candidates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ai_data_sharing",
                table: "households",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "minimize_data",
                table: "households",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ai_enabled",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ai_categorization_unavailable",
                table: "import_jobs");

            migrationBuilder.DropColumn(
                name: "ai_categorized_count",
                table: "import_jobs");

            migrationBuilder.DropColumn(
                name: "ai_data_sharing",
                table: "import_jobs");

            migrationBuilder.DropColumn(
                name: "ai_excluded",
                table: "import_candidates");

            migrationBuilder.DropColumn(
                name: "counts_as_offset",
                table: "import_candidates");

            migrationBuilder.DropColumn(
                name: "is_card_settlement",
                table: "import_candidates");

            migrationBuilder.DropColumn(
                name: "ai_data_sharing",
                table: "households");

            migrationBuilder.DropColumn(
                name: "minimize_data",
                table: "households");
        }
    }
}

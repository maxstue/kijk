using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TurnAiOffByDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // AI features rely on consent, which nobody gave actively while they were on by default.
            migrationBuilder.Sql("UPDATE users SET ai_enabled = FALSE;");
            migrationBuilder.AlterColumn<bool>(
                name: "ai_enabled",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Consent cannot be restored; users turn AI on again themselves.
        }
    }
}

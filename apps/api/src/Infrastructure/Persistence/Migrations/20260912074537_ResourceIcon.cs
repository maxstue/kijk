using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ResourceIcon : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "icon",
                table: "resources",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "circle");

            migrationBuilder.Sql(
                """
                UPDATE resources
                SET icon = CASE id
                    WHEN '0195624d-9b3b-7a85-84ff-e4b906cfd0df' THEN 'droplets'
                    WHEN '0195624d-0a57-7a48-86b6-9b2bdac93e4f' THEN 'zap'
                    WHEN '0195624d-1a9b-7ad1-b9df-64e05622e324' THEN 'flame'
                    ELSE icon
                END
                WHERE id IN (
                    '0195624d-9b3b-7a85-84ff-e4b906cfd0df',
                    '0195624d-0a57-7a48-86b6-9b2bdac93e4f',
                    '0195624d-1a9b-7ad1-b9df-64e05622e324'
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "icon",
                table: "resources");
        }
    }
}

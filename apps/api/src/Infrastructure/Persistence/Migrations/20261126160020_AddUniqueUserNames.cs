using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueUserNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                collation: "case_insensitive",
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<int>(
                name: "tag",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Existing users get a free number. Users with the same name (ignoring case) take consecutive positions
            // from a random start in a shuffled list of all numbers, so their numbers differ and stay unpredictable.
            migrationBuilder.Sql("""
                UPDATE users SET name = btrim(name) WHERE name <> btrim(name);

                WITH ranked AS (
                    SELECT id,
                           row_number() OVER (PARTITION BY name ORDER BY random()) - 1 AS position,
                           first_value(floor(random() * 9999)::int) OVER (PARTITION BY name ORDER BY id) AS offset_start
                    FROM users
                ),
                pool AS (
                    SELECT number AS tag, row_number() OVER (ORDER BY random()) - 1 AS position
                    FROM generate_series(1, 9999) AS number
                )
                UPDATE users
                SET tag = pool.tag
                FROM ranked
                JOIN pool ON pool.position = (ranked.position + ranked.offset_start) % 9999
                WHERE users.id = ranked.id;

                ALTER TABLE users ALTER COLUMN tag DROP DEFAULT;
                """);

            migrationBuilder.CreateIndex(
                name: "ix_users_name_tag",
                table: "users",
                columns: new[] { "name", "tag" },
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_users_name_trimmed",
                table: "users",
                sql: "name = btrim(name)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_users_tag_range",
                table: "users",
                sql: "tag BETWEEN 1 AND 9999");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_users_name_tag",
                table: "users");

            migrationBuilder.DropCheckConstraint(
                name: "ck_users_name_trimmed",
                table: "users");

            migrationBuilder.DropCheckConstraint(
                name: "ck_users_tag_range",
                table: "users");

            migrationBuilder.DropColumn(
                name: "tag",
                table: "users");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldCollation: "case_insensitive");
        }
    }
}

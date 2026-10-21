using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UseDefaultSpace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_user_spaces_is_active",
                table: "user_spaces");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "user_spaces",
                newName: "is_default");

            // Postgres 18 keeps the NOT NULL constraint name of a renamed column; older versions have no such constraint.
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_spaces_is_active_not_null') THEN
                        ALTER TABLE user_spaces RENAME CONSTRAINT user_spaces_is_active_not_null TO user_spaces_is_default_not_null;
                    END IF;
                END $$;
                """);

            // The active space was the last switched one, not a choice; users pick their default space themselves.
            migrationBuilder.Sql("UPDATE user_spaces SET is_default = FALSE;");

            migrationBuilder.CreateIndex(
                name: "ix_user_spaces_default",
                table: "user_spaces",
                column: "user_id",
                unique: true,
                filter: "is_default");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_user_spaces_default",
                table: "user_spaces");

            migrationBuilder.RenameColumn(
                name: "is_default",
                table: "user_spaces",
                newName: "is_active");

            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_spaces_is_default_not_null') THEN
                        ALTER TABLE user_spaces RENAME CONSTRAINT user_spaces_is_default_not_null TO user_spaces_is_active_not_null;
                    END IF;
                END $$;
                """);

            migrationBuilder.CreateIndex(
                name: "ix_user_spaces_is_active",
                table: "user_spaces",
                column: "is_active");
        }
    }
}

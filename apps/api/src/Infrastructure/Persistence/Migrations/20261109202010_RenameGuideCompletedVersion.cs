using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameGuideCompletedVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "guide_dashboard_version",
                table: "users",
                newName: "guide_completed_version");

            migrationBuilder.Sql("""
                DO $$ BEGIN
                    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'users'::regclass AND conname = 'users_guide_dashboard_version_not_null') THEN
                        ALTER TABLE users RENAME CONSTRAINT users_guide_dashboard_version_not_null TO users_guide_completed_version_not_null;
                    END IF;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "guide_completed_version",
                table: "users",
                newName: "guide_dashboard_version");

            migrationBuilder.Sql("""
                DO $$ BEGIN
                    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'users'::regclass AND conname = 'users_guide_completed_version_not_null') THEN
                        ALTER TABLE users RENAME CONSTRAINT users_guide_completed_version_not_null TO users_guide_dashboard_version_not_null;
                    END IF;
                END $$;
                """);
        }
    }
}

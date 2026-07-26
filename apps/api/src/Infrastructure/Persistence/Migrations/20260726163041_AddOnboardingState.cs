using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOnboardingState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "analytics_consent",
                table: "users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "analytics_consent_updated_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "onboarding_completed_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "onboarding_version",
                table: "users",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE users
                SET onboarding_version = 1,
                    onboarding_completed_at = COALESCE(updated_at, created_at)
                WHERE first_time = FALSE;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "analytics_consent",
                table: "users");

            migrationBuilder.DropColumn(
                name: "analytics_consent_updated_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "onboarding_completed_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "onboarding_version",
                table: "users");
        }
    }
}

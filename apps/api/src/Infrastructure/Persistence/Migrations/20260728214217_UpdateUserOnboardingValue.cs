using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserOnboardingValue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "first_time",
                table: "users");

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

            migrationBuilder.AddColumn<bool>(
                name: "first_time",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }
    }
}

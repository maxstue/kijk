using Kijk.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(AppDbContext))]
[Migration("20260731170000_MakeUserAuthIdUnique")]
public partial class MakeUserAuthIdUnique : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT auth_id
                    FROM users
                    GROUP BY auth_id
                    HAVING count(*) > 1
                ) THEN
                    RAISE EXCEPTION 'Cannot make users.auth_id unique while duplicate identities exist.';
                END IF;
            END $$;
            """);

        migrationBuilder.DropIndex(
            name: "ix_users_auth_id",
            table: "users");

        migrationBuilder.CreateIndex(
            name: "ix_users_auth_id",
            table: "users",
            column: "auth_id",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "ix_users_auth_id",
            table: "users");

        migrationBuilder.CreateIndex(
            name: "ix_users_auth_id",
            table: "users",
            column: "auth_id");
    }
}

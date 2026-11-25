using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSpaceInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "space_invitations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<byte[]>(type: "bytea", maxLength: 32, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    accepted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    accepted_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    revoked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_space_invitations", x => x.id);
                    table.ForeignKey(
                        name: "fk_space_invitations_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_space_invitations_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_space_invitations_users_accepted_by_id",
                        column: x => x.accepted_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_space_invitations_users_created_by_id",
                        column: x => x.created_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "permissions",
                columns: new[] { "id", "created_at", "deleted_at", "name", "updated_at" },
                values: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a17"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "members:invite", null });

            migrationBuilder.InsertData(
                table: "roles_permissions",
                columns: new[] { "permissions_id", "roles_id" },
                values: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a17"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") });

            migrationBuilder.CreateIndex(
                name: "ix_space_invitations_accepted_by_id",
                table: "space_invitations",
                column: "accepted_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_space_invitations_created_by_id",
                table: "space_invitations",
                column: "created_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_space_invitations_role_id",
                table: "space_invitations",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "ix_space_invitations_space_id",
                table: "space_invitations",
                column: "space_id");

            migrationBuilder.CreateIndex(
                name: "ix_space_invitations_token_hash",
                table: "space_invitations",
                column: "token_hash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "space_invitations");

            migrationBuilder.DeleteData(
                table: "roles_permissions",
                keyColumns: new[] { "permissions_id", "roles_id" },
                keyValues: new object[] { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a17"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") });

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a17"));
        }
    }
}

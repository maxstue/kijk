using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class HouseholdRolesAndPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_households_permissions");

            migrationBuilder.DropIndex(
                name: "ix_roles_name",
                table: "roles");

            migrationBuilder.DropIndex(
                name: "ix_permissions_name",
                table: "permissions");

            // The previous Read/Write/Manage permissions were never checked. Replace them with the new catalog.
            migrationBuilder.Sql(
                """
                DELETE FROM roles_permissions;
                DELETE FROM permissions;
                """);

            migrationBuilder.InsertData(
                table: "permissions",
                columns: new[] { "id", "created_at", "deleted_at", "name", "updated_at" },
                values: new object[,]
                {
                    { new Guid("0e065002-1522-4138-a96b-52e657b7cbcc"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "household:configure", null },
                    { new Guid("39e9c646-8685-4fb5-a0d9-68233d3d605c"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "members:assign-role", null },
                    { new Guid("4ab7acac-5b5f-41b4-a3f7-7174694781b1"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "household:delete", null },
                    { new Guid("4c18ae0c-f592-4398-8226-b89f6150c314"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "consumptions:export", null },
                    { new Guid("51af63b7-f581-48a5-8987-937939b56dec"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "consumptions:view", null },
                    { new Guid("55d9913b-dcb6-43bc-b9b8-0b840508c795"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "members:view", null },
                    { new Guid("57820fa1-c443-458d-b8d3-40ef527720d4"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "units:share", null },
                    { new Guid("5ca7bb07-cf8b-4930-8047-e4c857c4fc65"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "limits:plan", null },
                    { new Guid("6a994db4-6fce-4538-bb38-1c8a2edca792"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "limits:view", null },
                    { new Guid("80abd19c-7609-40a6-a296-d4310d3771f0"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "consumptions:record", null },
                    { new Guid("af500b09-178e-4fd2-8e20-387b84c91fac"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "resources:configure", null },
                    { new Guid("c2d383b8-545f-43d1-b5bb-44a2f184934a"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "resources:view", null }
                });

            // Admin and the former "User" role (now "Member") already exist with these ids and are referenced by memberships.
            migrationBuilder.Sql(
                """
                INSERT INTO roles (id, created_at, name) VALUES
                    ('0195624d-3c82-73e8-bb7b-b3fac043f2cb', '2026-10-01T00:00:00Z', 'Member'),
                    ('0195624d-5bd9-754c-a92b-5e0e82e1ede1', '2026-10-01T00:00:00Z', 'Admin'),
                    ('3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75', '2026-10-01T00:00:00Z', 'Viewer')
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, created_at = EXCLUDED.created_at;
                """);

            migrationBuilder.InsertData(
                table: "roles_permissions",
                columns: new[] { "permissions_id", "roles_id" },
                values: new object[,]
                {
                    { new Guid("0e065002-1522-4138-a96b-52e657b7cbcc"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("39e9c646-8685-4fb5-a0d9-68233d3d605c"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("4ab7acac-5b5f-41b4-a3f7-7174694781b1"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("4c18ae0c-f592-4398-8226-b89f6150c314"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("4c18ae0c-f592-4398-8226-b89f6150c314"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("51af63b7-f581-48a5-8987-937939b56dec"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("51af63b7-f581-48a5-8987-937939b56dec"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("51af63b7-f581-48a5-8987-937939b56dec"), new Guid("3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75") },
                    { new Guid("55d9913b-dcb6-43bc-b9b8-0b840508c795"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("55d9913b-dcb6-43bc-b9b8-0b840508c795"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("55d9913b-dcb6-43bc-b9b8-0b840508c795"), new Guid("3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75") },
                    { new Guid("57820fa1-c443-458d-b8d3-40ef527720d4"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("5ca7bb07-cf8b-4930-8047-e4c857c4fc65"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("6a994db4-6fce-4538-bb38-1c8a2edca792"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("6a994db4-6fce-4538-bb38-1c8a2edca792"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("6a994db4-6fce-4538-bb38-1c8a2edca792"), new Guid("3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75") },
                    { new Guid("80abd19c-7609-40a6-a296-d4310d3771f0"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("80abd19c-7609-40a6-a296-d4310d3771f0"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("af500b09-178e-4fd2-8e20-387b84c91fac"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("c2d383b8-545f-43d1-b5bb-44a2f184934a"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("c2d383b8-545f-43d1-b5bb-44a2f184934a"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("c2d383b8-545f-43d1-b5bb-44a2f184934a"), new Guid("3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75") }
                });

            migrationBuilder.CreateIndex(
                name: "ix_roles_name",
                table: "roles",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_permissions_name",
                table: "permissions",
                column: "name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_roles_name",
                table: "roles");

            migrationBuilder.DropIndex(
                name: "ix_permissions_name",
                table: "permissions");

            migrationBuilder.Sql(
                """
                DELETE FROM roles_permissions;
                DELETE FROM permissions;
                UPDATE user_households SET role_id = '0195624d-3c82-73e8-bb7b-b3fac043f2cb'
                    WHERE role_id = '3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75';
                DELETE FROM roles WHERE id = '3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75';
                UPDATE roles SET name = 'User' WHERE id = '0195624d-3c82-73e8-bb7b-b3fac043f2cb';

                INSERT INTO permissions (id, name, created_at) VALUES
                    ('0195624d-6b3b-7085-84ff-e4b906cfd0df', 'Read', now()),
                    ('0195624d-7a57-7248-86b6-9b2bdac93e4f', 'Write', now()),
                    ('0195624d-8a9b-76d1-b9df-64e05622e324', 'Manage', now());

                INSERT INTO roles_permissions (roles_id, permissions_id) VALUES
                    ('0195624d-3c82-73e8-bb7b-b3fac043f2cb', '0195624d-6b3b-7085-84ff-e4b906cfd0df'),
                    ('0195624d-3c82-73e8-bb7b-b3fac043f2cb', '0195624d-7a57-7248-86b6-9b2bdac93e4f'),
                    ('0195624d-5bd9-754c-a92b-5e0e82e1ede1', '0195624d-6b3b-7085-84ff-e4b906cfd0df'),
                    ('0195624d-5bd9-754c-a92b-5e0e82e1ede1', '0195624d-7a57-7248-86b6-9b2bdac93e4f'),
                    ('0195624d-5bd9-754c-a92b-5e0e82e1ede1', '0195624d-8a9b-76d1-b9df-64e05622e324');
                """);

            migrationBuilder.CreateTable(
                name: "user_households_permissions",
                columns: table => new
                {
                    user_house_hold_extra_permissions_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_households_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_households_household_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_households_permissions", x => new { x.user_house_hold_extra_permissions_id, x.user_households_user_id, x.user_households_household_id });
                    table.ForeignKey(
                        name: "fk_user_households_permissions_permissions_user_house_hold_ext",
                        column: x => x.user_house_hold_extra_permissions_id,
                        principalTable: "permissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_user_households_permissions_user_households_user_households",
                        columns: x => new { x.user_households_user_id, x.user_households_household_id },
                        principalTable: "user_households",
                        principalColumns: new[] { "user_id", "household_id" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_roles_name",
                table: "roles",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_permissions_name",
                table: "permissions",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_user_households_permissions_user_households_user_id_user_ho",
                table: "user_households_permissions",
                columns: new[] { "user_households_user_id", "user_households_household_id" });
        }
    }
}

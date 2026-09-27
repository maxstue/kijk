using System;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:creator_type", "system,user");

            migrationBuilder.CreateTable(
                name: "households",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_households", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "permissions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_permissions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "resources",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    unit = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    color = table.Column<string>(type: "text", nullable: false, defaultValue: "#89CEA4"),
                    creator_type = table.Column<CreatorType>(type: "creator_type", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_resources", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    auth_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    image = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    first_time = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "consumptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    value = table.Column<decimal>(type: "numeric", nullable: false),
                    resource_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    household_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_consumptions", x => x.id);
                    table.ForeignKey(
                        name: "fk_consumptions_households_household_id",
                        column: x => x.household_id,
                        principalTable: "households",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_consumptions_resources_resource_id",
                        column: x => x.resource_id,
                        principalTable: "resources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "roles_permissions",
                columns: table => new
                {
                    permissions_id = table.Column<Guid>(type: "uuid", nullable: false),
                    roles_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_roles_permissions", x => new { x.permissions_id, x.roles_id });
                    table.ForeignKey(
                        name: "fk_roles_permissions_permissions_permissions_id",
                        column: x => x.permissions_id,
                        principalTable: "permissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_roles_permissions_roles_roles_id",
                        column: x => x.roles_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "consumptions_limits",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    limit = table.Column<decimal>(type: "numeric", nullable: false),
                    period = table.Column<int>(type: "integer", nullable: false),
                    actual_value = table.Column<decimal>(type: "numeric", nullable: false),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    resource_id = table.Column<Guid>(type: "uuid", nullable: false),
                    last_occurrence = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    household_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_consumptions_limits", x => x.id);
                    table.ForeignKey(
                        name: "fk_consumptions_limits_households_household_id",
                        column: x => x.household_id,
                        principalTable: "households",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_consumptions_limits_resources_resource_id",
                        column: x => x.resource_id,
                        principalTable: "resources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_consumptions_limits_users_created_by_id",
                        column: x => x.created_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_households",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    household_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_households", x => new { x.user_id, x.household_id });
                    table.ForeignKey(
                        name: "fk_user_households_households_household_id",
                        column: x => x.household_id,
                        principalTable: "households",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_user_households_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_user_households_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "users_resources",
                columns: table => new
                {
                    resources_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users_resources", x => new { x.resources_id, x.user_id });
                    table.ForeignKey(
                        name: "fk_users_resources_resources_resources_id",
                        column: x => x.resources_id,
                        principalTable: "resources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_users_resources_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                name: "ix_consumptions_household_id",
                table: "consumptions",
                column: "household_id");

            migrationBuilder.CreateIndex(
                name: "ix_consumptions_name",
                table: "consumptions",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_consumptions_resource_id",
                table: "consumptions",
                column: "resource_id");

            migrationBuilder.CreateIndex(
                name: "ix_consumptions_limits_created_by_id",
                table: "consumptions_limits",
                column: "created_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_consumptions_limits_household_id",
                table: "consumptions_limits",
                column: "household_id");

            migrationBuilder.CreateIndex(
                name: "ix_consumptions_limits_name",
                table: "consumptions_limits",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_consumptions_limits_resource_id",
                table: "consumptions_limits",
                column: "resource_id");

            migrationBuilder.CreateIndex(
                name: "ix_households_name",
                table: "households",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_permissions_name",
                table: "permissions",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_resources_name",
                table: "resources",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_resources_name_unit",
                table: "resources",
                columns: new[] { "name", "unit" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_roles_name",
                table: "roles",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_roles_permissions_roles_id",
                table: "roles_permissions",
                column: "roles_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_households_household_id",
                table: "user_households",
                column: "household_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_households_is_active",
                table: "user_households",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_user_households_role_id",
                table: "user_households",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_households_permissions_user_households_user_id_user_ho",
                table: "user_households_permissions",
                columns: new[] { "user_households_user_id", "user_households_household_id" });

            migrationBuilder.CreateIndex(
                name: "ix_users_auth_id",
                table: "users",
                column: "auth_id");

            migrationBuilder.CreateIndex(
                name: "ix_users_resources_user_id",
                table: "users_resources",
                column: "user_id");

            // The initial schema predates the icon column. ResourceIcon assigns the
            // corresponding icons when that column is introduced later.
            migrationBuilder.Sql(
                """
                INSERT INTO roles (id, name, created_at) VALUES
                    ('0195624d-3c82-73e8-bb7b-b3fac043f2cb', 'User', now()),
                    ('0195624d-5bd9-754c-a92b-5e0e82e1ede1', 'Admin', now());

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

                INSERT INTO resources (id, name, color, unit, creator_type, created_at) VALUES
                    ('0195624d-9b3b-7a85-84ff-e4b906cfd0df', 'Water', '#3498db', 'L', 'system', now()),
                    ('0195624d-0a57-7a48-86b6-9b2bdac93e4f', 'Electricity', '#f1c40f', 'kWh', 'system', now()),
                    ('0195624d-1a9b-7ad1-b9df-64e05622e324', 'Gas', '#e74c3c', 'm3', 'system', now());
                """);

            migrationBuilder.Sql(
                """
                CREATE FUNCTION "Update_DateTime_Function"() RETURNS TRIGGER
                    LANGUAGE PLPGSQL AS
                $$
                BEGIN
                    NEW.updated_at := now();
                    RETURN NEW;
                END;
                $$;

                CREATE TRIGGER "UpdateTimestamp" BEFORE UPDATE ON consumptions
                    FOR EACH ROW EXECUTE FUNCTION "Update_DateTime_Function"();
                CREATE TRIGGER "UpdateTimestamp" BEFORE UPDATE ON consumptions_limits
                    FOR EACH ROW EXECUTE FUNCTION "Update_DateTime_Function"();
                CREATE TRIGGER "UpdateTimestamp" BEFORE UPDATE ON households
                    FOR EACH ROW EXECUTE FUNCTION "Update_DateTime_Function"();
                CREATE TRIGGER "UpdateTimestamp" BEFORE UPDATE ON permissions
                    FOR EACH ROW EXECUTE FUNCTION "Update_DateTime_Function"();
                CREATE TRIGGER "UpdateTimestamp" BEFORE UPDATE ON resources
                    FOR EACH ROW EXECUTE FUNCTION "Update_DateTime_Function"();
                CREATE TRIGGER "UpdateTimestamp" BEFORE UPDATE ON roles
                    FOR EACH ROW EXECUTE FUNCTION "Update_DateTime_Function"();
                CREATE TRIGGER "UpdateTimestamp" BEFORE UPDATE ON user_households
                    FOR EACH ROW EXECUTE FUNCTION "Update_DateTime_Function"();
                CREATE TRIGGER "UpdateTimestamp" BEFORE UPDATE ON users
                    FOR EACH ROW EXECUTE FUNCTION "Update_DateTime_Function"();
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP TRIGGER IF EXISTS "UpdateTimestamp" ON consumptions;
                DROP TRIGGER IF EXISTS "UpdateTimestamp" ON consumptions_limits;
                DROP TRIGGER IF EXISTS "UpdateTimestamp" ON households;
                DROP TRIGGER IF EXISTS "UpdateTimestamp" ON permissions;
                DROP TRIGGER IF EXISTS "UpdateTimestamp" ON resources;
                DROP TRIGGER IF EXISTS "UpdateTimestamp" ON roles;
                DROP TRIGGER IF EXISTS "UpdateTimestamp" ON user_households;
                DROP TRIGGER IF EXISTS "UpdateTimestamp" ON users;
                DROP FUNCTION IF EXISTS "Update_DateTime_Function"();
                """);

            migrationBuilder.DropTable(
                name: "consumptions");

            migrationBuilder.DropTable(
                name: "consumptions_limits");

            migrationBuilder.DropTable(
                name: "roles_permissions");

            migrationBuilder.DropTable(
                name: "user_households_permissions");

            migrationBuilder.DropTable(
                name: "users_resources");

            migrationBuilder.DropTable(
                name: "permissions");

            migrationBuilder.DropTable(
                name: "user_households");

            migrationBuilder.DropTable(
                name: "resources");

            migrationBuilder.DropTable(
                name: "households");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}

using System;
using System.Collections.Generic;
using Kijk.Shared;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:CollationDefinition:case_insensitive", "und-u-ks-level2,und-u-ks-level2,icu,False")
                .Annotation("Npgsql:Enum:creator_type", "system,user");

            migrationBuilder.CreateTable(
                name: "data_protection_keys",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    friendly_name = table.Column<string>(type: "text", nullable: true),
                    xml = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_data_protection_keys", x => x.id);
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
                name: "spaces",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    purpose_retention = table.Column<int>(type: "integer", nullable: false),
                    ai_data_sharing = table.Column<int>(type: "integer", nullable: false),
                    minimize_data = table.Column<bool>(type: "boolean", nullable: false),
                    is_personal = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_spaces", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "units",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, collation: "case_insensitive"),
                    symbol = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, collation: "case_insensitive"),
                    quantity_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    units_net_unit_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_units", x => x.id);
                    table.CheckConstraint("ck_units_name_trimmed", "name = btrim(name)");
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
                    analytics_consent = table.Column<int>(type: "integer", nullable: true),
                    analytics_consent_updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    onboarding_completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    guide_completed_version = table.Column<int>(type: "integer", nullable: false),
                    guide_completed_steps = table.Column<string[]>(type: "text[]", nullable: false),
                    guide_completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ai_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    sensitive_data_consent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deletion_requested_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
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
                name: "categories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, collation: "case_insensitive"),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    kind = table.Column<int>(type: "integer", nullable: false),
                    creator_type = table.Column<CreatorType>(type: "creator_type", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_categories", x => x.id);
                    table.CheckConstraint("ck_categories_name_trimmed", "name = btrim(name)");
                    table.ForeignKey(
                        name: "fk_categories_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "import_profiles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    header_fingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    mapping = table.Column<string>(type: "jsonb", nullable: false),
                    version = table.Column<int>(type: "integer", nullable: false),
                    confirmed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_import_profiles", x => x.id);
                    table.ForeignKey(
                        name: "fk_import_profiles_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "resources",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, collation: "case_insensitive"),
                    unit_id = table.Column<Guid>(type: "uuid", nullable: false),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false, defaultValue: "#89CEA4"),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "circle"),
                    creator_type = table.Column<CreatorType>(type: "creator_type", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_resources", x => x.id);
                    table.CheckConstraint("ck_resources_name_trimmed", "name = btrim(name)");
                    table.ForeignKey(
                        name: "fk_resources_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_resources_units_unit_id",
                        column: x => x.unit_id,
                        principalTable: "units",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "accounts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    iban_last4 = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: true),
                    kind = table.Column<int>(type: "integer", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_accounts", x => x.id);
                    table.ForeignKey(
                        name: "fk_accounts_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_accounts_users_owner_id",
                        column: x => x.owner_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_spaces",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_spaces", x => new { x.user_id, x.space_id });
                    table.ForeignKey(
                        name: "fk_user_spaces_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_user_spaces_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_user_spaces_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "budgets",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    valid_from = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_budgets", x => x.id);
                    table.ForeignKey(
                        name: "fk_budgets_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_budgets_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_budgets_users_created_by_id",
                        column: x => x.created_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_budgets_users_owner_id",
                        column: x => x.owner_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "category_rules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    scope = table.Column<int>(type: "integer", nullable: false),
                    key = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    origin = table.Column<int>(type: "integer", nullable: false),
                    priority = table.Column<int>(type: "integer", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_category_rules", x => x.id);
                    table.ForeignKey(
                        name: "fk_category_rules_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_category_rules_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_category_rules_users_owner_id",
                        column: x => x.owner_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "consumptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    value = table.Column<decimal>(type: "numeric", nullable: false),
                    value_type = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    starts_new_meter_segment = table.Column<bool>(type: "boolean", nullable: false),
                    calculated_consumption = table.Column<decimal>(type: "numeric", nullable: false),
                    resource_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_consumptions", x => x.id);
                    table.ForeignKey(
                        name: "fk_consumptions_resources_resource_id",
                        column: x => x.resource_id,
                        principalTable: "resources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_consumptions_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "limits",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    threshold = table.Column<decimal>(type: "numeric", nullable: false),
                    period = table.Column<int>(type: "integer", nullable: false),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    last_occurrence = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    resource_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_limits", x => x.id);
                    table.ForeignKey(
                        name: "fk_limits_resources_resource_id",
                        column: x => x.resource_id,
                        principalTable: "resources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_limits_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_limits_users_created_by_id",
                        column: x => x.created_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
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
                name: "import_jobs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    file_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    row_count = table.Column<int>(type: "integer", nullable: false),
                    processed_rows = table.Column<int>(type: "integer", nullable: false),
                    error_count = table.Column<int>(type: "integer", nullable: false),
                    imported_count = table.Column<int>(type: "integer", nullable: false),
                    error = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    proposed_mapping = table.Column<string>(type: "jsonb", nullable: true),
                    proposed_mapping_source = table.Column<int>(type: "integer", nullable: true),
                    ai_unavailable = table.Column<bool>(type: "boolean", nullable: false),
                    ai_data_sharing = table.Column<int>(type: "integer", nullable: false),
                    ai_categorized_count = table.Column<int>(type: "integer", nullable: false),
                    ai_categorization_unavailable = table.Column<bool>(type: "boolean", nullable: false),
                    mapping = table.Column<string>(type: "jsonb", nullable: true),
                    full_months = table.Column<List<DateTime>>(type: "timestamp with time zone[]", nullable: false),
                    edge_months = table.Column<List<DateTime>>(type: "timestamp with time zone[]", nullable: false),
                    replaced_months = table.Column<List<DateTime>>(type: "timestamp with time zone[]", nullable: false),
                    skipped_months = table.Column<List<DateTime>>(type: "timestamp with time zone[]", nullable: false),
                    key_version = table.Column<int>(type: "integer", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_import_jobs", x => x.id);
                    table.ForeignKey(
                        name: "fk_import_jobs_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "accounts",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_import_jobs_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_import_jobs_users_created_by_id",
                        column: x => x.created_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "import_candidates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    row_number = table.Column<int>(type: "integer", nullable: false),
                    booking_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    counterparty = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    purpose = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    is_merchant_payment = table.Column<bool>(type: "boolean", nullable: false),
                    booking_key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    counterparty_key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    is_card_settlement = table.Column<bool>(type: "boolean", nullable: false),
                    counts_as_offset = table.Column<bool>(type: "boolean", nullable: false),
                    ai_excluded = table.Column<bool>(type: "boolean", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: true),
                    category_source = table.Column<int>(type: "integer", nullable: true),
                    errors = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    excluded = table.Column<bool>(type: "boolean", nullable: false),
                    import_job_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_import_candidates", x => x.id);
                    table.ForeignKey(
                        name: "fk_import_candidates_import_jobs_import_job_id",
                        column: x => x.import_job_id,
                        principalTable: "import_jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "import_files",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    content = table.Column<byte[]>(type: "bytea", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    import_job_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_import_files", x => x.id);
                    table.ForeignKey(
                        name: "fk_import_files_import_jobs_import_job_id",
                        column: x => x.import_job_id,
                        principalTable: "import_jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "transactions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    counterparty = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    purpose = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    is_merchant_payment = table.Column<bool>(type: "boolean", nullable: false),
                    is_transfer = table.Column<bool>(type: "boolean", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: true),
                    category_source = table.Column<int>(type: "integer", nullable: true),
                    booking_key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    counterparty_key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    key_version = table.Column<int>(type: "integer", nullable: true),
                    import_job_id = table.Column<Guid>(type: "uuid", nullable: true),
                    account_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_transactions", x => x.id);
                    table.ForeignKey(
                        name: "fk_transactions_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_transactions_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_transactions_import_jobs_import_job_id",
                        column: x => x.import_job_id,
                        principalTable: "import_jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_transactions_spaces_space_id",
                        column: x => x.space_id,
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_transactions_users_created_by_id",
                        column: x => x.created_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "categories",
                columns: new[] { "id", "color", "created_at", "creator_type", "deleted_at", "icon", "kind", "name", "space_id" },
                values: new object[,]
                {
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f01"), "#16a34a", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "shopping-basket", 0, "Groceries", null },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f02"), "#2563eb", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "house", 0, "Housing", null },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f03"), "#f59e0b", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "zap", 0, "Utilities", null },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f04"), "#0891b2", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "car", 0, "Mobility", null },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f05"), "#db2777", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "party-popper", 0, "Leisure", null },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f06"), "#dc2626", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "heart-pulse", 0, "Health", null },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f07"), "#9333ea", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "shopping-bag", 0, "Shopping", null },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f08"), "#475569", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "shield", 0, "Insurance", null },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f09"), "#71717a", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "circle-ellipsis", 0, "Other", null },
                    { new Guid("7d1f3b0e-2c4a-4f8e-9b61-0a5c3e7d9f10"), "#059669", new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), CreatorType.System, null, "wallet", 1, "Income", null }
                });

            migrationBuilder.InsertData(
                table: "permissions",
                columns: new[] { "id", "created_at", "deleted_at", "name", "updated_at" },
                values: new object[,]
                {
                    { new Guid("0e065002-1522-4138-a96b-52e657b7cbcc"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "space:configure", null },
                    { new Guid("39e9c646-8685-4fb5-a0d9-68233d3d605c"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "members:assign-role", null },
                    { new Guid("4ab7acac-5b5f-41b4-a3f7-7174694781b1"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "space:delete", null },
                    { new Guid("4c18ae0c-f592-4398-8226-b89f6150c314"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "consumptions:export", null },
                    { new Guid("51af63b7-f581-48a5-8987-937939b56dec"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "consumptions:view", null },
                    { new Guid("55d9913b-dcb6-43bc-b9b8-0b840508c795"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "members:view", null },
                    { new Guid("5ca7bb07-cf8b-4930-8047-e4c857c4fc65"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "limits:plan", null },
                    { new Guid("6a994db4-6fce-4538-bb38-1c8a2edca792"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "limits:view", null },
                    { new Guid("80abd19c-7609-40a6-a296-d4310d3771f0"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "consumptions:record", null },
                    { new Guid("af500b09-178e-4fd2-8e20-387b84c91fac"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "resources:configure", null },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "finances:view", null },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a12"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "finances:record", null },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a13"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "finances:import", null },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a14"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "finances:configure", null },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a15"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "budgets:plan", null },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a16"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "finances:export", null },
                    { new Guid("c2d383b8-545f-43d1-b5bb-44a2f184934a"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "resources:view", null }
                });

            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "id", "created_at", "deleted_at", "name", "updated_at" },
                values: new object[,]
                {
                    { new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Member", null },
                    { new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Admin", null },
                    { new Guid("3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75"), new DateTime(2026, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Viewer", null }
                });

            migrationBuilder.InsertData(
                table: "units",
                columns: new[] { "id", "created_at", "deleted_at", "name", "quantity_key", "symbol", "units_net_unit_name", "updated_at" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-4111-8111-111111111111"), new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, "Liter", "Volume", "l", "Liter", null },
                    { new Guid("11111111-1111-4111-8111-111111111112"), new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, "Milliliter", "Volume", "ml", "Milliliter", null },
                    { new Guid("11111111-1111-4111-8111-111111111113"), new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, "Cubic meter", "Volume", "m³", "CubicMeter", null },
                    { new Guid("22222222-2222-4222-8222-222222222221"), new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, "Watt hour", "Energy", "Wh", "WattHour", null },
                    { new Guid("22222222-2222-4222-8222-222222222222"), new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, "Kilowatt hour", "Energy", "kWh", "KilowattHour", null },
                    { new Guid("22222222-2222-4222-8222-222222222223"), new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, "Megawatt hour", "Energy", "MWh", "MegawattHour", null },
                    { new Guid("33333333-3333-4333-8333-333333333331"), new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, "Gram", "Mass", "g", "Gram", null },
                    { new Guid("33333333-3333-4333-8333-333333333332"), new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, "Kilogram", "Mass", "kg", "Kilogram", null },
                    { new Guid("33333333-3333-4333-8333-333333333333"), new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, "Tonne", "Mass", "t", "Tonne", null },
                    { new Guid("44444444-4444-4444-8444-444444444441"), new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, "Meter", "Length", "m", "Meter", null },
                    { new Guid("44444444-4444-4444-8444-444444444442"), new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, "Kilometer", "Length", "km", "Kilometer", null },
                    { new Guid("55555555-5555-4555-8555-555555555551"), new DateTime(2026, 9, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, "Piece", "Count", "pcs", null, null }
                });

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
                    { new Guid("5ca7bb07-cf8b-4930-8047-e4c857c4fc65"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("6a994db4-6fce-4538-bb38-1c8a2edca792"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("6a994db4-6fce-4538-bb38-1c8a2edca792"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("6a994db4-6fce-4538-bb38-1c8a2edca792"), new Guid("3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75") },
                    { new Guid("80abd19c-7609-40a6-a296-d4310d3771f0"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("80abd19c-7609-40a6-a296-d4310d3771f0"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("af500b09-178e-4fd2-8e20-387b84c91fac"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a11"), new Guid("3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a12"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a12"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a13"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a13"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a14"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a15"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a16"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("b3f0d6a2-6c1e-4f57-9a0d-2e8c4b7f1a16"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("c2d383b8-545f-43d1-b5bb-44a2f184934a"), new Guid("0195624d-3c82-73e8-bb7b-b3fac043f2cb") },
                    { new Guid("c2d383b8-545f-43d1-b5bb-44a2f184934a"), new Guid("0195624d-5bd9-754c-a92b-5e0e82e1ede1") },
                    { new Guid("c2d383b8-545f-43d1-b5bb-44a2f184934a"), new Guid("3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75") }
                });

            migrationBuilder.CreateIndex(
                name: "ix_accounts_owner_id",
                table: "accounts",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_accounts_space_id",
                table: "accounts",
                column: "space_id");

            migrationBuilder.CreateIndex(
                name: "ix_accounts_space_id_cash",
                table: "accounts",
                column: "space_id",
                unique: true,
                filter: "kind = 1");

            migrationBuilder.CreateIndex(
                name: "ix_budgets_category_id",
                table: "budgets",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "ix_budgets_created_by_id",
                table: "budgets",
                column: "created_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_budgets_owner_id",
                table: "budgets",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_budgets_space_id_category_id_valid_from",
                table: "budgets",
                columns: new[] { "space_id", "category_id", "valid_from" },
                unique: true,
                filter: "owner_id IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_budgets_space_id_owner_id_category_id_valid_from",
                table: "budgets",
                columns: new[] { "space_id", "owner_id", "category_id", "valid_from" },
                unique: true,
                filter: "owner_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_categories_name",
                table: "categories",
                column: "name",
                unique: true,
                filter: "space_id IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_categories_space_id_name",
                table: "categories",
                columns: new[] { "space_id", "name" },
                unique: true,
                filter: "space_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_category_rules_category_id",
                table: "category_rules",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "ix_category_rules_owner_id",
                table: "category_rules",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_category_rules_space_id_owner_id_scope_key",
                table: "category_rules",
                columns: new[] { "space_id", "owner_id", "scope", "key" },
                unique: true,
                filter: "owner_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_category_rules_space_id_scope_key",
                table: "category_rules",
                columns: new[] { "space_id", "scope", "key" },
                unique: true,
                filter: "owner_id IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_consumptions_name",
                table: "consumptions",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_consumptions_resource_id",
                table: "consumptions",
                column: "resource_id");

            migrationBuilder.CreateIndex(
                name: "ix_consumptions_space_id",
                table: "consumptions",
                column: "space_id");

            migrationBuilder.CreateIndex(
                name: "ix_import_candidates_import_job_id_row_number",
                table: "import_candidates",
                columns: new[] { "import_job_id", "row_number" });

            migrationBuilder.CreateIndex(
                name: "ix_import_files_expires_at",
                table: "import_files",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "ix_import_files_import_job_id",
                table: "import_files",
                column: "import_job_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_import_jobs_account_id_status",
                table: "import_jobs",
                columns: new[] { "account_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_import_jobs_created_by_id",
                table: "import_jobs",
                column: "created_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_import_jobs_space_id_created_at",
                table: "import_jobs",
                columns: new[] { "space_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_import_profiles_space_id_header_fingerprint_version",
                table: "import_profiles",
                columns: new[] { "space_id", "header_fingerprint", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_limits_created_by_id",
                table: "limits",
                column: "created_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_limits_name",
                table: "limits",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_limits_resource_id",
                table: "limits",
                column: "resource_id");

            migrationBuilder.CreateIndex(
                name: "ix_limits_space_id_resource_id_period",
                table: "limits",
                columns: new[] { "space_id", "resource_id", "period" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_permissions_name",
                table: "permissions",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_resources_name",
                table: "resources",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_resources_name_unit_id",
                table: "resources",
                columns: new[] { "name", "unit_id" },
                unique: true,
                filter: "space_id IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_resources_space_id_name_unit_id",
                table: "resources",
                columns: new[] { "space_id", "name", "unit_id" },
                unique: true,
                filter: "space_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_resources_unit_id",
                table: "resources",
                column: "unit_id");

            migrationBuilder.CreateIndex(
                name: "ix_roles_name",
                table: "roles",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_roles_permissions_roles_id",
                table: "roles_permissions",
                column: "roles_id");

            migrationBuilder.CreateIndex(
                name: "ix_spaces_name",
                table: "spaces",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_transactions_account_id_booking_date",
                table: "transactions",
                columns: new[] { "account_id", "booking_date" });

            migrationBuilder.CreateIndex(
                name: "ix_transactions_category_id",
                table: "transactions",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "ix_transactions_counterparty_key",
                table: "transactions",
                column: "counterparty_key");

            migrationBuilder.CreateIndex(
                name: "ix_transactions_created_by_id",
                table: "transactions",
                column: "created_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_transactions_import_job_id",
                table: "transactions",
                column: "import_job_id");

            migrationBuilder.CreateIndex(
                name: "ix_transactions_space_id_booking_date",
                table: "transactions",
                columns: new[] { "space_id", "booking_date" });

            migrationBuilder.CreateIndex(
                name: "ix_units_name",
                table: "units",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_units_symbol",
                table: "units",
                column: "symbol",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_spaces_default",
                table: "user_spaces",
                column: "user_id",
                unique: true,
                filter: "is_default");

            migrationBuilder.CreateIndex(
                name: "ix_user_spaces_role_id",
                table: "user_spaces",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_spaces_space_id",
                table: "user_spaces",
                column: "space_id");

            migrationBuilder.CreateIndex(
                name: "ix_users_auth_id",
                table: "users",
                column: "auth_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_resources_user_id",
                table: "users_resources",
                column: "user_id");

            migrationBuilder.Sql("""
                INSERT INTO resources (id, name, color, icon, unit_id, creator_type, created_at)
                VALUES ('0195624d-9b3b-7a85-84ff-e4b906cfd0df', 'Water', '#3498db', 'droplets', '11111111-1111-4111-8111-111111111111', 'system', now()),
                       ('0195624d-0a57-7a48-86b6-9b2bdac93e4f', 'Electricity', '#f1c40f', 'zap', '22222222-2222-4222-8222-222222222222', 'system', now()),
                       ('0195624d-1a9b-7ad1-b9df-64e05622e324', 'Gas', '#e74c3c', 'flame', '11111111-1111-4111-8111-111111111113', 'system', now());
                """);

            migrationBuilder.Sql("""
                CREATE FUNCTION "Update_DateTime_Function"() RETURNS TRIGGER
                    LANGUAGE PLPGSQL AS
                $$
                BEGIN
                    NEW.updated_at := now();
                    RETURN NEW;
                END;
                $$;

                -- Add Trigger to the consumptions table
                CREATE TRIGGER "UpdateTimestamp"
                    BEFORE UPDATE
                    ON "consumptions"
                    FOR EACH ROW
                EXECUTE FUNCTION "Update_DateTime_Function"();

                -- Add Trigger to the limits table
                CREATE TRIGGER "UpdateTimestamp"
                    BEFORE UPDATE
                    ON "limits"
                    FOR EACH ROW
                EXECUTE FUNCTION "Update_DateTime_Function"();

                -- Add Trigger to the spaces table
                CREATE TRIGGER "UpdateTimestamp"
                    BEFORE UPDATE
                    ON "spaces"
                    FOR EACH ROW
                EXECUTE FUNCTION "Update_DateTime_Function"();

                -- Add Trigger to the permissions table
                CREATE TRIGGER "UpdateTimestamp"
                    BEFORE UPDATE
                    ON "permissions"
                    FOR EACH ROW
                EXECUTE FUNCTION "Update_DateTime_Function"();

                -- Add Trigger to the resources table
                CREATE TRIGGER "UpdateTimestamp"
                    BEFORE UPDATE
                    ON "resources"
                    FOR EACH ROW
                EXECUTE FUNCTION "Update_DateTime_Function"();

                -- Add Trigger to the roles table
                CREATE TRIGGER "UpdateTimestamp"
                    BEFORE UPDATE
                    ON "roles"
                    FOR EACH ROW
                EXECUTE FUNCTION "Update_DateTime_Function"();

                -- Add Trigger to the user_spaces table
                CREATE TRIGGER "UpdateTimestamp"
                    BEFORE UPDATE
                    ON "user_spaces"
                    FOR EACH ROW
                EXECUTE FUNCTION "Update_DateTime_Function"();

                -- Add Trigger to the users table
                CREATE TRIGGER "UpdateTimestamp"
                    BEFORE UPDATE
                    ON "users"
                    FOR EACH ROW
                EXECUTE FUNCTION "Update_DateTime_Function"();
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "budgets");

            migrationBuilder.DropTable(
                name: "category_rules");

            migrationBuilder.DropTable(
                name: "consumptions");

            migrationBuilder.DropTable(
                name: "data_protection_keys");

            migrationBuilder.DropTable(
                name: "import_candidates");

            migrationBuilder.DropTable(
                name: "import_files");

            migrationBuilder.DropTable(
                name: "import_profiles");

            migrationBuilder.DropTable(
                name: "limits");

            migrationBuilder.DropTable(
                name: "roles_permissions");

            migrationBuilder.DropTable(
                name: "transactions");

            migrationBuilder.DropTable(
                name: "user_spaces");

            migrationBuilder.DropTable(
                name: "users_resources");

            migrationBuilder.DropTable(
                name: "permissions");

            migrationBuilder.DropTable(
                name: "categories");

            migrationBuilder.DropTable(
                name: "import_jobs");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "resources");

            migrationBuilder.DropTable(
                name: "accounts");

            migrationBuilder.DropTable(
                name: "units");

            migrationBuilder.DropTable(
                name: "spaces");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.Sql("""DROP FUNCTION "Update_DateTime_Function"();""");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:CollationDefinition:case_insensitive", "und-u-ks-level2,und-u-ks-level2,icu,False")
                .OldAnnotation("Npgsql:Enum:creator_type", "system,user");
        }
    }
}

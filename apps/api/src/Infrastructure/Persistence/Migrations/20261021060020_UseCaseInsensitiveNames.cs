using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UseCaseInsensitiveNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:CollationDefinition:case_insensitive", "und-u-ks-level2,und-u-ks-level2,icu,False")
                .Annotation("Npgsql:Enum:creator_type", "system,user")
                .OldAnnotation("Npgsql:Enum:creator_type", "system,user");

            // ICU also equates canonically equivalent Unicode names. Abort rather than merge existing records.
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM categories
                        GROUP BY space_id, btrim(name) COLLATE case_insensitive HAVING count(*) > 1
                    ) OR EXISTS (
                        SELECT 1 FROM resources
                        GROUP BY space_id, unit_id, btrim(name) COLLATE case_insensitive HAVING count(*) > 1
                    ) OR EXISTS (
                        SELECT 1 FROM units
                        WHERE creator_type = 'user' AND archived_at IS NULL AND owner_user_id IS NOT NULL
                        GROUP BY owner_user_id, btrim(name) COLLATE case_insensitive HAVING count(*) > 1
                    ) THEN
                        RAISE EXCEPTION 'Cannot apply case-insensitive names: resolve names that collide under the new collation first.';
                    END IF;
                END $$;
                """);

            migrationBuilder.DropIndex(
                name: "ix_units_owner_user_id_normalized_name",
                table: "units");

            migrationBuilder.DropIndex(
                name: "ix_resources_normalized_name_unit_id",
                table: "resources");

            migrationBuilder.DropIndex(
                name: "ix_resources_space_id_normalized_name_unit_id",
                table: "resources");

            migrationBuilder.DropIndex(
                name: "ix_categories_normalized_name",
                table: "categories");

            migrationBuilder.DropIndex(
                name: "ix_categories_space_id_normalized_name",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "normalized_name",
                table: "units");

            migrationBuilder.DropColumn(
                name: "normalized_name",
                table: "resources");

            migrationBuilder.DropColumn(
                name: "normalized_name",
                table: "categories");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "units",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                collation: "case_insensitive",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "resources",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                collation: "case_insensitive",
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "categories",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                collation: "case_insensitive",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.Sql("""
                UPDATE units SET name = btrim(name) WHERE name <> btrim(name);
                UPDATE categories SET name = btrim(name) WHERE name <> btrim(name);
                UPDATE resources SET name = btrim(name) WHERE name <> btrim(name);
                """);

            migrationBuilder.CreateIndex(
                name: "ix_units_owner_user_id_name",
                table: "units",
                columns: new[] { "owner_user_id", "name" },
                unique: true,
                filter: "creator_type = 'user' AND archived_at IS NULL");

            migrationBuilder.AddCheckConstraint(
                name: "ck_units_name_trimmed",
                table: "units",
                sql: "name = btrim(name)");

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

            migrationBuilder.AddCheckConstraint(
                name: "ck_resources_name_trimmed",
                table: "resources",
                sql: "name = btrim(name)");

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

            migrationBuilder.AddCheckConstraint(
                name: "ck_categories_name_trimmed",
                table: "categories",
                sql: "name = btrim(name)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_units_owner_user_id_name",
                table: "units");

            migrationBuilder.DropCheckConstraint(
                name: "ck_units_name_trimmed",
                table: "units");

            migrationBuilder.DropIndex(
                name: "ix_resources_name_unit_id",
                table: "resources");

            migrationBuilder.DropIndex(
                name: "ix_resources_space_id_name_unit_id",
                table: "resources");

            migrationBuilder.DropCheckConstraint(
                name: "ck_resources_name_trimmed",
                table: "resources");

            migrationBuilder.DropIndex(
                name: "ix_categories_name",
                table: "categories");

            migrationBuilder.DropIndex(
                name: "ix_categories_space_id_name",
                table: "categories");

            migrationBuilder.DropCheckConstraint(
                name: "ck_categories_name_trimmed",
                table: "categories");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "units",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldCollation: "case_insensitive");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "resources",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldCollation: "case_insensitive");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "categories",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldCollation: "case_insensitive");

            migrationBuilder.AddColumn<string>(
                name: "normalized_name",
                table: "units",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                computedColumnSql: "lower(btrim(name))",
                stored: true);

            migrationBuilder.AddColumn<string>(
                name: "normalized_name",
                table: "resources",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true,
                computedColumnSql: "lower(btrim(name))",
                stored: true);

            migrationBuilder.AddColumn<string>(
                name: "normalized_name",
                table: "categories",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                computedColumnSql: "lower(btrim(name))",
                stored: true);

            migrationBuilder.CreateIndex(
                name: "ix_units_owner_user_id_normalized_name",
                table: "units",
                columns: new[] { "owner_user_id", "normalized_name" },
                unique: true,
                filter: "creator_type = 'user' AND archived_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_resources_normalized_name_unit_id",
                table: "resources",
                columns: new[] { "normalized_name", "unit_id" },
                unique: true,
                filter: "space_id IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_resources_space_id_normalized_name_unit_id",
                table: "resources",
                columns: new[] { "space_id", "normalized_name", "unit_id" },
                unique: true,
                filter: "space_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_categories_normalized_name",
                table: "categories",
                column: "normalized_name",
                unique: true,
                filter: "space_id IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_categories_space_id_normalized_name",
                table: "categories",
                columns: new[] { "space_id", "normalized_name" },
                unique: true,
                filter: "space_id IS NOT NULL");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:creator_type", "system,user")
                .OldAnnotation("Npgsql:CollationDefinition:case_insensitive", "und-u-ks-level2,und-u-ks-level2,icu,False")
                .OldAnnotation("Npgsql:Enum:creator_type", "system,user");
        }
    }
}

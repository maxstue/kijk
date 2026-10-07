using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameHouseholdsToSpaces : Migration
    {
        // Renames only: the generated migration dropped and re-created the tables and household_id columns, which
        // would have deleted all data. Keys and indexes follow EF's naming, so replacing the word renames them all.
        private static readonly string[] Tables = ["households", "user_households", "unit_households"];

        private static readonly string[] TablesWithSpaceColumn =
        [
            "accounts", "budgets", "categories", "category_rules", "consumptions", "import_jobs", "import_profiles",
            "limits", "resources", "transactions", "unit_households", "user_households"
        ];

        private static readonly (string Id, string Old, string New)[] Permissions =
        [
            ("0e065002-1522-4138-a96b-52e657b7cbcc", "household:configure", "space:configure"),
            ("4ab7acac-5b5f-41b4-a3f7-7174694781b1", "household:delete", "space:delete")
        ];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            foreach (var table in TablesWithSpaceColumn)
            {
                migrationBuilder.RenameColumn(name: "household_id", table: table, newName: "space_id");
            }

            foreach (var table in Tables)
            {
                migrationBuilder.RenameTable(name: table, newName: table.Replace("household", "space", StringComparison.Ordinal));
            }

            RenameKeysAndIndexes(migrationBuilder, "household", "space");
            foreach (var (id, _, newName) in Permissions)
            {
                migrationBuilder.Sql($"UPDATE permissions SET name = '{newName}' WHERE id = '{id}';");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var (id, oldName, _) in Permissions)
            {
                migrationBuilder.Sql($"UPDATE permissions SET name = '{oldName}' WHERE id = '{id}';");
            }

            RenameKeysAndIndexes(migrationBuilder, "space", "household");
            foreach (var table in TablesWithSpaceColumn)
            {
                migrationBuilder.RenameColumn(name: "space_id", table: table.Replace("household", "space", StringComparison.Ordinal), newName: "household_id");
            }

            foreach (var table in Tables)
            {
                migrationBuilder.RenameTable(name: table.Replace("household", "space", StringComparison.Ordinal), newName: table);
            }
        }

        // Primary and foreign keys first; renaming a primary key also renames its index. Then the remaining indexes.
        private static void RenameKeysAndIndexes(MigrationBuilder migrationBuilder, string from, string to) =>
            migrationBuilder.Sql($"""
                DO $$
                DECLARE item record;
                BEGIN
                    FOR item IN
                        SELECT c.conname AS name, c.conrelid::regclass AS owner
                        FROM pg_constraint c
                        JOIN pg_namespace n ON n.oid = c.connamespace
                        WHERE n.nspname = current_schema() AND c.conname LIKE '%{from}%'
                    LOOP
                        EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', item.owner, item.name, replace(item.name, '{from}', '{to}'));
                    END LOOP;
                    FOR item IN
                        SELECT indexname AS name FROM pg_indexes WHERE schemaname = current_schema() AND indexname LIKE '%{from}%'
                    LOOP
                        EXECUTE format('ALTER INDEX %I RENAME TO %I', item.name, replace(item.name, '{from}', '{to}'));
                    END LOOP;
                END $$;
                """);
    }
}

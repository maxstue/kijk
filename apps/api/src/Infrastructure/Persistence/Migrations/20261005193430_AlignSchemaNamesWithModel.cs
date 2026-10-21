using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AlignSchemaNamesWithModel : Migration
    {
        // Earlier table and column renames left two kinds of names behind that the model does not know:
        // - Postgres 18 names NOT NULL constraints after table and column when they are created and keeps the name on
        //   a rename (e.g. consumptions_limits_limit_not_null instead of limits_threshold_not_null). Older Postgres
        //   versions have no such constraints, so the loop finds nothing there.
        // - A single-column index on the limits' space, created by an early migration, is covered by the composite
        //   index (space_id, resource_id, period) of the model and was never dropped.
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$
                DECLARE item record;
                BEGIN
                    FOR item IN
                        SELECT c.conname AS name, c.conrelid::regclass AS owner, cl.relname || '_' || a.attname || '_not_null' AS expected
                        FROM pg_constraint c
                        JOIN pg_class cl ON cl.oid = c.conrelid
                        JOIN pg_namespace n ON n.oid = c.connamespace
                        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
                        WHERE n.nspname = current_schema()
                          AND c.contype = 'n'
                          AND c.conname <> cl.relname || '_' || a.attname || '_not_null'
                          AND length(cl.relname || '_' || a.attname || '_not_null') <= 63
                    LOOP
                        EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', item.owner, item.name, item.expected);
                    END LOOP;
                END $$;
                """);
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_consumptions_limits_space_id;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // The constraint names only describe the constraints and are not restored.
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS ix_consumptions_limits_space_id ON limits (space_id);");
        }
    }
}

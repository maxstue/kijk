using Kijk.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kijk.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(AppDbContext))]
[Migration("20260919090000_FixSystemResourceIcons")]
public sealed class FixSystemResourceIcons : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE resources
            SET icon = CASE LOWER(name)
                WHEN 'water' THEN 'droplets'
                WHEN 'electricity' THEN 'zap'
                WHEN 'gas' THEN 'flame'
                ELSE icon
            END
            WHERE creator_type = 'system'
              AND LOWER(name) IN ('water', 'electricity', 'gas');
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE resources
            SET icon = 'circle'
            WHERE creator_type = 'system'
              AND LOWER(name) IN ('water', 'electricity', 'gas');
            """);
    }
}

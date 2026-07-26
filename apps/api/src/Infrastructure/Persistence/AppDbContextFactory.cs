using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Kijk.Infrastructure.Persistence;

/// <summary>
/// Creates the application database context for Entity Framework design-time commands.
/// </summary>
public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    /// <summary>
    /// Creates a context without starting the API web host.
    /// </summary>
    /// <param name="args">Arguments supplied by the Entity Framework tooling.</param>
    /// <returns>A context configured for model and migration generation.</returns>
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(
                "Host=localhost;Database=kijk_design_time",
                postgresOptions => postgresOptions.MapEnum<CreatorType>())
            .UseSnakeCaseNamingConvention()
            .Options;

        return new(options);
    }
}
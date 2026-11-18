using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Kijk.Infrastructure.Persistence;

/// <summary>
/// Provides the context for EF migration tooling and bundles without starting the API.
/// </summary>
public sealed class DesignTimeAppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    /// <inheritdoc />
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=kijk", options => options.MapEnum<CreatorType>())
            .UseSnakeCaseNamingConvention()
            .Options;
        return new AppDbContext(options);
    }
}
using Kijk.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Kijk.Infrastructure.Persistence;

/// <summary>
/// Creates the application context for Entity Framework design-time tooling.
/// </summary>
public sealed class DesignTimeAppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=kijk", options => options.MapEnum<CreatorType>())
            .UseSnakeCaseNamingConvention()
            .Options;
        return new AppDbContext(options);
    }
}
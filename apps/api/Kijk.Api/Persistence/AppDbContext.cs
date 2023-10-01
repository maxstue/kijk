using EntityFramework.Exceptions.PostgreSQL;

using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence.Configs;

namespace Kijk.Api.Persistence;

public class AppDbContext : DbContext
{
    private readonly IConfiguration _configuration;

    public DbSet<Weather> Weathers => Set<Weather>();

    public AppDbContext(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new WeatherConfig());
    }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
    {
        options.UseExceptionProcessor();
        options.UseNpgsql(_configuration.GetConnectionString("DefaultConnection"));
    }
}

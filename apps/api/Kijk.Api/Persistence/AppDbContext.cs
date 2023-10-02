using EntityFramework.Exceptions.PostgreSQL;

using Kijk.Api.Domain;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence.Configs;

namespace Kijk.Api.Persistence;

public class AppDbContext : DbContext
{
    private readonly IConfiguration _configuration;

    public DbSet<User> Users => Set<User>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Category> Categories => Set<Category>();

    public AppDbContext(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserConfig());
        modelBuilder.ApplyConfiguration(new TransactionConfig());
        modelBuilder.ApplyConfiguration(new CategoryConfig());

        base.OnModelCreating(modelBuilder);
    }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
    {        
        options.UseNpgsql(_configuration.GetConnectionString("DefaultConnection"))
            .UseExceptionProcessor()
            .UseSnakeCaseNamingConvention();
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder
            .Properties<DateTime>()
            .HaveConversion(typeof(UtcDateTimeConverter));

        base.ConfigureConventions(configurationBuilder);
    }
}

using EntityFramework.Exceptions.PostgreSQL;

using Kijk.Api.Common.Options;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence.Configs;

using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Kijk.Api.Persistence;

public class AppDbContext : DbContext
{
    private readonly IConfiguration _configuration;
    private readonly IServiceProvider _serviceProvider;

    public DbSet<User> Users => Set<User>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Category> Categories => Set<Category>();

    public AppDbContext(IConfiguration configuration, IServiceProvider serviceProvider)
    {
        _configuration = configuration;
        _serviceProvider = serviceProvider;
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
        options.UseNpgsql(_configuration.GetConnectionString(ConnectionStringsOptions.DefaultConnectionStringPath))
            .UseExceptionProcessor()
            .UseSnakeCaseNamingConvention()
            .AddInterceptors(_serviceProvider.GetServices<ISaveChangesInterceptor>());

    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder
            .Properties<DateTime>()
            .HaveConversion(typeof(UtcDateTimeConverter));

        base.ConfigureConventions(configurationBuilder);
    }
}

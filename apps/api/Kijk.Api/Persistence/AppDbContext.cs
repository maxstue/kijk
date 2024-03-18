using EntityFramework.Exceptions.PostgreSQL;
using Kijk.Api.Common.Options;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence.Configs;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Kijk.Api.Persistence;

public class AppDbContext(IConfiguration configuration, IServiceProvider serviceProvider) : DbContext
{
    public DbSet<Household> Households => Set<Household>();
    public DbSet<UserHousehold> UserHouseholds => Set<UserHousehold>();
    public DbSet<EnergyConsumption> EnergyConsumptions => Set<EnergyConsumption>();
    public DbSet<EnergyConsumptionLimit> EnergyConsumptionLimits => Set<EnergyConsumptionLimit>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<RecurringTransactions> RecurringTransactions => Set<RecurringTransactions>();
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new HouseholdConfig());
        modelBuilder.ApplyConfiguration(new UserHouseholdConfig());
        modelBuilder.ApplyConfiguration(new EnergyConsumptionConfig());
        modelBuilder.ApplyConfiguration(new EnergyConsumptionLimitConfig());
        modelBuilder.ApplyConfiguration(new UserConfig());
        modelBuilder.ApplyConfiguration(new AccountConfig());
        modelBuilder.ApplyConfiguration(new BudgetConfig());
        modelBuilder.ApplyConfiguration(new TransactionConfig());
        modelBuilder.ApplyConfiguration(new RecurringTransactionConfig());
        modelBuilder.ApplyConfiguration(new CategoryConfig());

        base.OnModelCreating(modelBuilder);
    }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
    {
        options.UseNpgsql(configuration.GetConnectionString(ConnectionStringsOptions.DefaultConnectionStringPath))
            .UseExceptionProcessor()
            .UseSnakeCaseNamingConvention()
            .AddInterceptors(serviceProvider.GetServices<ISaveChangesInterceptor>());
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder
            .Properties<DateTime>()
            .HaveConversion(typeof(UtcDateTimeConverter));

        base.ConfigureConventions(configurationBuilder);
    }
}

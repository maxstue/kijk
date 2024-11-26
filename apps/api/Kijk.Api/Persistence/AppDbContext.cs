using Kijk.Api.Domain.Entities;

namespace Kijk.Api.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
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
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder
            .Properties<DateTime>()
            .HaveConversion<UtcDateTimeConverter>();

        base.ConfigureConventions(configurationBuilder);
    }
}
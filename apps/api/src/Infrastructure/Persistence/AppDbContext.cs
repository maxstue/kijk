using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kijk.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Household> Households => Set<Household>();
    public DbSet<UserHousehold> UserHouseholds => Set<UserHousehold>();
    public DbSet<Consumption> Consumptions => Set<Consumption>();
    public DbSet<ConsumptionLimit> ConsumptionsLimits => Set<ConsumptionLimit>();
    public DbSet<Resource> Resources => Set<Resource>();
    public DbSet<User> Users => Set<User>();

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();

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
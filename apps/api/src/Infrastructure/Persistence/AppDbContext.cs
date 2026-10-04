using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Kijk.Infrastructure.Persistence;

/// <summary>The EF Core database context of Kijk (PostgreSQL).</summary>
public class AppDbContext : DbContext, IAppDbContext
{
    /// <summary>Creates a context for tooling such as the EF migration bundle.</summary>
    public AppDbContext()
    {

    }
    /// <summary>Creates a context with the configured options.</summary>
    /// <param name="options">The context options.</param>
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    /// <inheritdoc />
    public DbSet<Household> Households { get; set; }
    /// <inheritdoc />
    public DbSet<UserHousehold> UserHouseholds { get; set; }
    /// <inheritdoc />
    public DbSet<Consumption> Consumptions { get; set; }
    /// <inheritdoc />
    public DbSet<ConsumptionLimit> ConsumptionsLimits { get; set; }
    /// <inheritdoc />
    public DbSet<Resource> Resources { get; set; }
    /// <inheritdoc />
    public DbSet<Unit> Units { get; set; }
    /// <inheritdoc />
    public DbSet<UnitHousehold> UnitHouseholds { get; set; }
    /// <inheritdoc />
    public DbSet<User> Users { get; set; }
    /// <inheritdoc />
    public DbSet<Category> Categories { get; set; }
    /// <inheritdoc />
    public DbSet<Budget> Budgets { get; set; }
    /// <inheritdoc />
    public DbSet<Account> Accounts { get; set; }
    /// <inheritdoc />
    public DbSet<Transaction> Transactions { get; set; }

    /// <inheritdoc />
    public DbSet<Role> Roles { get; set; }
    /// <inheritdoc />
    public DbSet<Permission> Permissions { get; set; }

    /// <inheritdoc />
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // This is only needed to be able to run the efbundle script
        if (!optionsBuilder.IsConfigured)
        {
            // This is a placeholder string because it will be replaced with the action one via the cli.
            optionsBuilder.UseNpgsql("DefaultConnection");
            optionsBuilder.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
        }
    }

    /// <inheritdoc />
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    /// <summary>Stores all <see cref="DateTime" /> values as UTC.</summary>
    /// <param name="configurationBuilder">The convention builder.</param>
    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder
            .Properties<DateTime>()
            .HaveConversion<UtcDateTimeConverter>();

        base.ConfigureConventions(configurationBuilder);
    }
}
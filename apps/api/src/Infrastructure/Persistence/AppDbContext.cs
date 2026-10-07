using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Kijk.Infrastructure.Persistence;

/// <summary>The EF Core database context of Kijk (PostgreSQL).</summary>
public class AppDbContext : DbContext, IAppDbContext, IDataProtectionKeyContext
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
    public DbSet<Space> Spaces { get; set; }
    /// <inheritdoc />
    public DbSet<UserSpace> UserSpaces { get; set; }
    /// <inheritdoc />
    public DbSet<Consumption> Consumptions { get; set; }
    /// <inheritdoc />
    public DbSet<Limit> Limits { get; set; }
    /// <inheritdoc />
    public DbSet<Resource> Resources { get; set; }
    /// <inheritdoc />
    public DbSet<Unit> Units { get; set; }
    /// <inheritdoc />
    public DbSet<UnitSpace> UnitSpaces { get; set; }
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
    public DbSet<CategoryRule> CategoryRules { get; set; }
    /// <inheritdoc />
    public DbSet<ImportJob> ImportJobs { get; set; }
    /// <inheritdoc />
    public DbSet<ImportFile> ImportFiles { get; set; }
    /// <inheritdoc />
    public DbSet<ImportCandidate> ImportCandidates { get; set; }
    /// <inheritdoc />
    public DbSet<ImportProfile> ImportProfiles { get; set; }

    /// <inheritdoc />
    public DbSet<DataProtectionKey> DataProtectionKeys { get; set; }

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
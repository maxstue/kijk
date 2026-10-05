using Kijk.Domain.Entities;

namespace Kijk.Application.Shared.Persistence;

/// <summary>
/// Persistence abstraction used by application handlers.
/// </summary>
public interface IAppDbContext
{
    /// <summary>Gets the spaces.</summary>
    DbSet<Space> Spaces { get; }
    /// <summary>Gets the space memberships.</summary>
    DbSet<UserSpace> UserSpaces { get; }
    /// <summary>Gets the consumptions.</summary>
    DbSet<Consumption> Consumptions { get; }
    /// <summary>Gets the consumption limits.</summary>
    DbSet<Limit> Limits { get; }
    /// <summary>Gets the resources.</summary>
    DbSet<Resource> Resources { get; }
    /// <summary>Gets the units.</summary>
    DbSet<Unit> Units { get; }
    /// <summary>Gets the units shared with spaces.</summary>
    DbSet<UnitSpace> UnitSpaces { get; }
    /// <summary>Gets the users.</summary>
    DbSet<User> Users { get; }
    /// <summary>Gets the transaction categories.</summary>
    DbSet<Category> Categories { get; }
    /// <summary>Gets the budgets.</summary>
    DbSet<Budget> Budgets { get; }
    /// <summary>Gets the bank accounts.</summary>
    DbSet<Account> Accounts { get; }
    /// <summary>Gets the transactions.</summary>
    DbSet<Transaction> Transactions { get; }
    /// <summary>Gets the category rules.</summary>
    DbSet<CategoryRule> CategoryRules { get; }
    /// <summary>Gets the imports.</summary>
    DbSet<ImportJob> ImportJobs { get; }
    /// <summary>Gets the encrypted files of open imports.</summary>
    DbSet<ImportFile> ImportFiles { get; }
    /// <summary>Gets the rows of imports waiting for review.</summary>
    DbSet<ImportCandidate> ImportCandidates { get; }
    /// <summary>Gets the confirmed import mappings.</summary>
    DbSet<ImportProfile> ImportProfiles { get; }
    /// <summary>Gets the space roles.</summary>
    DbSet<Role> Roles { get; }
    /// <summary>Gets the space permissions.</summary>
    DbSet<Permission> Permissions { get; }

    /// <summary>Saves all tracked changes.</summary>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>The number of written entries.</returns>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
using Kijk.Domain.Entities;

namespace Kijk.Application.Shared.Persistence;

/// <summary>
/// Persistence abstraction used by application handlers.
/// </summary>
public interface IAppDbContext
{
    /// <summary>Gets the households.</summary>
    DbSet<Household> Households { get; }
    /// <summary>Gets the household memberships.</summary>
    DbSet<UserHousehold> UserHouseholds { get; }
    /// <summary>Gets the consumptions.</summary>
    DbSet<Consumption> Consumptions { get; }
    /// <summary>Gets the consumption limits.</summary>
    DbSet<ConsumptionLimit> ConsumptionsLimits { get; }
    /// <summary>Gets the resources.</summary>
    DbSet<Resource> Resources { get; }
    /// <summary>Gets the units.</summary>
    DbSet<Unit> Units { get; }
    /// <summary>Gets the units shared with households.</summary>
    DbSet<UnitHousehold> UnitHouseholds { get; }
    /// <summary>Gets the users.</summary>
    DbSet<User> Users { get; }
    /// <summary>Gets the household roles.</summary>
    DbSet<Role> Roles { get; }
    /// <summary>Gets the household permissions.</summary>
    DbSet<Permission> Permissions { get; }

    /// <summary>Saves all tracked changes.</summary>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>The number of written entries.</returns>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
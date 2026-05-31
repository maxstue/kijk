using Kijk.Domain.Entities;

namespace Kijk.Application.Abstractions.Persistence;

/// <summary>
/// Persistence abstraction used by application handlers.
/// </summary>
public interface IAppDbContext
{
    DbSet<Household> Households { get; }
    DbSet<UserHousehold> UserHouseholds { get; }
    DbSet<Consumption> Consumptions { get; }
    DbSet<ConsumptionLimit> ConsumptionsLimits { get; }
    DbSet<Resource> Resources { get; }
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
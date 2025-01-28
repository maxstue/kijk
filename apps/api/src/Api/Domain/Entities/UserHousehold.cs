using Kijk.Api.Common.Models;

namespace Kijk.Api.Domain.Entities;

public sealed class UserHousehold : BaseEntity
{
    public Guid UserId { get; set; }
    public required User User { get; set; }

    public Guid HouseholdId { get; set; }
    public required Household Household { get; set; }
    public required Role Role { get; set; }

    /// <summary>
    ///     A boolean which represents if the household is the default for the user.
    /// </summary>
    public bool IsDefault { get; set; }

    public static UserHousehold Create(User user, Household household, Role role, bool isDefault = false) =>
        new()
        {
            Id = Guid.NewGuid(),
            User = user,
            Household = household,
            Role = role,
            IsDefault = isDefault,
        };
}
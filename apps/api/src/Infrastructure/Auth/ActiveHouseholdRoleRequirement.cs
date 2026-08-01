using Microsoft.AspNetCore.Authorization;

namespace Kijk.Infrastructure.Auth;

/// <summary>
/// Requires the current user to have one of the allowed roles in the active household.
/// </summary>
public sealed class ActiveHouseholdRoleRequirement : IAuthorizationRequirement
{
    /// <summary>
    /// Initializes a new active-household role requirement.
    /// </summary>
    /// <param name="allowedRoles">The household roles that satisfy the requirement.</param>
    public ActiveHouseholdRoleRequirement(params string[] allowedRoles)
    {
        ArgumentNullException.ThrowIfNull(allowedRoles);
        if (allowedRoles.Length == 0)
        {
            throw new ArgumentException("At least one allowed household role is required.", nameof(allowedRoles));
        }

        AllowedRoles = Array.AsReadOnly([.. allowedRoles]);
    }

    /// <summary>
    /// Gets the household roles that satisfy the requirement.
    /// </summary>
    public IReadOnlyCollection<string> AllowedRoles { get; }
}

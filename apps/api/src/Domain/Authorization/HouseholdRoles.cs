using static Kijk.Domain.Authorization.HouseholdPermissions;

namespace Kijk.Domain.Authorization;

/// <summary>
/// Defines a fixed household role and the permissions it grants.
/// </summary>
/// <param name="Id">The stable database identifier.</param>
/// <param name="Name">The role name.</param>
/// <param name="Permissions">The permission names granted by the role.</param>
public sealed record RoleDefinition(Guid Id, string Name, IReadOnlyList<string> Permissions);

/// <summary>
/// The fixed roles a household member can have. The same roles exist for every household.
/// </summary>
public static class HouseholdRoles
{
    /// <summary>The name of the administrator role.</summary>
    public const string AdminName = "Admin";

    /// <summary>The name of the member role.</summary>
    public const string MemberName = "Member";

    /// <summary>The name of the read-only viewer role.</summary>
    public const string ViewerName = "Viewer";

    /// <summary>
    /// Manages the household and its members. The user who creates a household becomes its administrator.
    /// </summary>
    public static RoleDefinition Admin { get; } = new(
        new("0195624d-5bd9-754c-a92b-5e0e82e1ede1"),
        AdminName,
        [.. HouseholdPermissions.All.Select(permission => permission.Name)]);

    /// <summary>
    /// Records and analyses consumptions and transactions. This is the default role for other household members.
    /// </summary>
    public static RoleDefinition Member { get; } = new(
        new("0195624d-3c82-73e8-bb7b-b3fac043f2cb"),
        MemberName,
        [
            Consumptions.View,
            Consumptions.Record,
            Consumptions.Export,
            Limits.View,
            Resources.View,
            Members.View,
            Finances.View,
            Finances.Record,
            Finances.Import
        ]);

    /// <summary>
    /// Can only view household data.
    /// </summary>
    public static RoleDefinition Viewer { get; } = new(
        new("3e42fa02-77ac-4bb9-a9a8-d031a3b8ea75"),
        ViewerName,
        [
            Consumptions.View,
            Limits.View,
            Resources.View,
            Members.View,
            Finances.View
        ]);

    /// <summary>
    /// Gets all household roles.
    /// </summary>
    public static IReadOnlyList<RoleDefinition> All { get; } = [Admin, Member, Viewer];
}
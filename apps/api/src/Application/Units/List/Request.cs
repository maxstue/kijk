namespace Kijk.Application.Units.List;

/// <summary>
/// Which units a unit list contains. System units are part of every scope.
/// </summary>
public enum UnitScope
{
    /// <summary>System units and the units shared with a space.</summary>
    Space,
    /// <summary>System units and the units owned by the current user.</summary>
    Personal,
    /// <summary>Only the system units.</summary>
    System
}

/// <summary>
/// Filters and pages a unit list.
/// </summary>
/// <param name="Scope">Which units to list.</param>
/// <param name="SpaceId">The space of <see cref="UnitScope.Space" />; required for that scope.</param>
/// <param name="IncludeArchived">Whether archived units are included.</param>
/// <param name="Search">An optional name or symbol filter.</param>
/// <param name="Page">The 1-based page number.</param>
/// <param name="PageSize">The page size (1-100); without a page size, all units are returned.</param>
public sealed record GetUnitsRequest(
    UnitScope Scope = UnitScope.Space,
    Guid? SpaceId = null,
    bool IncludeArchived = false,
    string? Search = null,
    int? Page = null,
    int? PageSize = null);
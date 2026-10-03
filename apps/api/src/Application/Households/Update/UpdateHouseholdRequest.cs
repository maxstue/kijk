namespace Kijk.Application.Households.Update;

/// <summary>
/// Contains the editable details for a household.
/// </summary>
/// <param name="Name">The household name.</param>
/// <param name="Description">An optional household description.</param>
public sealed record UpdateHouseholdRequest(string Name, string? Description);
namespace Kijk.Application.Units.Shared;

/// <summary>
/// A server-side page of units for settings views.
/// </summary>
public sealed record UnitPageResponse(IReadOnlyList<UnitResponse> Items, int TotalCount, int CustomCount, int Page, int PageSize);
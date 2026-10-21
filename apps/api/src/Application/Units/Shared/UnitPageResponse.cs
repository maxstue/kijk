namespace Kijk.Application.Units.Shared;

/// <summary>
/// A list of units; a page of it when a page size was requested.
/// </summary>
public sealed record UnitPageResponse(IReadOnlyList<UnitResponse> Items, int TotalCount, int CustomCount, int Page, int PageSize);
using Kijk.Shared;

namespace Kijk.Application.Limits.Update;

/// <summary>
/// Request for replacing the editable properties of a consumption limit.
/// </summary>
public sealed record UpdateLimitRequest(
    string Name,
    string? Description,
    decimal Limit,
    Period Period,
    bool Active);
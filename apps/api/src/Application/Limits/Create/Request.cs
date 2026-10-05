using Kijk.Shared;

namespace Kijk.Application.Limits.Create;

/// <summary>
/// Request for creating a consumption limit.
/// </summary>
public sealed record CreateLimitRequest(
    string Name,
    string? Description,
    decimal Limit,
    Period Period,
    bool Active,
    Guid ResourceId);
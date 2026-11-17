namespace Kijk.Application.Limits.Queries;

/// <summary>The columns of the consumption limit list.</summary>
public enum LimitSort
{
    /// <summary>Resource name, then period.</summary>
    Resource,
    /// <summary>Limit name.</summary>
    Name,
    /// <summary>Recurring period.</summary>
    Period
}
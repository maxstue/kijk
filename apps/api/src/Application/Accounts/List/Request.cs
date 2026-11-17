namespace Kijk.Application.Accounts.List;

/// <summary>
/// The columns the account list can be sorted by.
/// </summary>
public enum AccountSort
{
    /// <summary>By name.</summary>
    Name,
    /// <summary>By kind (bank accounts first), then by name.</summary>
    Kind
}
using Kijk.Domain.Entities;
using Kijk.Shared;

namespace Kijk.Application.Accounts.Shared;

/// <summary>A bank account of the household.</summary>
/// <param name="Id">The account id.</param>
/// <param name="Name">The display name.</param>
/// <param name="IbanLast4">The last four characters of the IBAN, if known.</param>
/// <param name="Kind">Whether it is a bank account or the cash account.</param>
public sealed record AccountResponse(Guid Id, string Name, string? IbanLast4, AccountKind Kind, Visibility Visibility);

/// <summary>
/// Maps account entities to API responses.
/// </summary>
public static class AccountResponseMapper
{
    /// <summary>Maps an account to a response.</summary>
    /// <param name="source">The account.</param>
    /// <returns>The response.</returns>
    public static AccountResponse ToResponse(this Account source) => new(source.Id, source.Name, source.IbanLast4, source.Kind, source.Visibility);
}

/// <summary>
/// Defines validation constraints shared by account create and update requests.
/// </summary>
public static class AccountValidationRules
{
    /// <summary>Maximum allowed account name length.</summary>
    public const int NameMaximumLength = 100;

    /// <summary>Pattern accepted for the last four IBAN characters.</summary>
    public const string IbanLast4Pattern = "^[0-9A-Za-z]{4}$";
}
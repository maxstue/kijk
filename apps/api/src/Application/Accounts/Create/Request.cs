namespace Kijk.Application.Accounts.Create;

/// <summary>
/// Request for creating an account.
/// </summary>
public sealed record CreateAccountRequest(string Name, string? IbanLast4);
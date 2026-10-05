using Kijk.Shared;

namespace Kijk.Application.Accounts.Update;

/// <summary>
/// Request for replacing the editable properties of an account.
/// </summary>
public sealed record UpdateAccountRequest(string Name, string? IbanLast4, Visibility? Visibility = null);
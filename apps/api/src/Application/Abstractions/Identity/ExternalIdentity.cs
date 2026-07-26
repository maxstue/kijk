namespace Kijk.Application.Abstractions.Identity;

/// <summary>
/// Represents identity data managed by the external authentication provider.
/// </summary>
/// <param name="FullName">The user's full name.</param>
/// <param name="Email">The user's primary email address.</param>
/// <param name="ImageUrl">The user's uploaded or provider-supplied profile image.</param>
/// <param name="Provider">The primary sign-in provider.</param>
/// <param name="UseProfileInKijk">Whether Kijk may use the optional name and profile image.</param>
public sealed record ExternalIdentity(
    string? FullName,
    string? Email,
    string? ImageUrl,
    string Provider,
    bool? UseProfileInKijk);
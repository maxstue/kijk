using Kijk.Shared;

namespace Kijk.Infrastructure.Auth;

/// <summary>
/// Binds the Auth configuration section to the AuthOptions class.
/// </summary>
public class AuthOptions : IConfigOptions
{
    /// <inheritdoc />
    public static string SectionName => "Auth";

    /// <summary>Gets or sets the Clerk instance URL that issues the access tokens.</summary>
    public string Authority { get; set; } = null!;

    /// <summary>Gets or sets the Clerk secret key for the Backend API.</summary>
    public string SecretKey { get; set; } = null!;

    /// <summary>Gets or sets the allowed frontend origins, checked against the token's <c>azp</c> claim.</summary>
    public string[] AuthorizedParties { get; set; } = [];

    /// <summary>Gets or sets the tolerated clock skew when validating token lifetimes.</summary>
    public int ClockSkewInSeconds { get; set; } = 5;
}
using Kijk.Shared;

namespace Kijk.Infrastructure.Auth;

/// <summary>
/// Binds the Auth configuration section to the AuthOptions class.
/// </summary>
public class AuthOptions : IConfigOptions
{
    public static string SectionName => "Auth";

    public string Authority { get; set; } = null!;

    public string SecretKey { get; set; } = null!;

    public string[] AuthorizedParties { get; set; } = [];

    public int ClockSkewInSeconds { get; set; } = 5;
}
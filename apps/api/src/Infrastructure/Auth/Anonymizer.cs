namespace Kijk.Infrastructure.Auth;

/// <summary>Creates pseudonymous identifiers, e.g. for telemetry, without exposing the original value.</summary>
public static class Anonymizer
{
    /// <summary>Creates a stable, non-reversible id as lowercase hex SHA-256 of <c>salt:raw</c>.</summary>
    /// <param name="raw">The value to pseudonymize.</param>
    /// <param name="salt">A secret salt.</param>
    /// <returns>The pseudonymous id.</returns>
    public static string PseudoId(string raw, string salt)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes($"{salt}:{raw}"));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
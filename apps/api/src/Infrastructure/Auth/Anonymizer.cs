namespace Kijk.Infrastructure.Auth;

public static class Anonymizer
{
    public static string PseudoId(string raw, string salt)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes($"{salt}:{raw}"));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
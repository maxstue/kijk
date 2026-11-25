using System.Buffers.Text;
using System.Security.Cryptography;

namespace Kijk.Application.Spaces.Shared;

/// <summary>
/// Creates and hashes invitation tokens. A token is 32 random bytes, encoded as base64url; only its SHA-256 hash is
/// stored, so a database leak does not reveal usable invitation links.
/// </summary>
public static class InvitationToken
{
    private const int TokenBytes = 32;

    /// <summary>Creates a new token and its hash.</summary>
    /// <returns>The token to hand out once and the hash to store.</returns>
    public static (string Token, byte[] Hash) Create()
    {
        var bytes = RandomNumberGenerator.GetBytes(TokenBytes);
        return (Base64Url.EncodeToString(bytes), SHA256.HashData(bytes));
    }

    /// <summary>Builds the app link for a token. The token is in the fragment, which browsers never send to a server.</summary>
    /// <param name="token">The token.</param>
    /// <returns>The relative link to the invitation page.</returns>
    public static string Link(string token) => $"/invite#{token}";
}
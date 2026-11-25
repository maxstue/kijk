using System.Buffers;
using System.Buffers.Text;
using System.Diagnostics.CodeAnalysis;
using System.Security.Cryptography;

namespace Kijk.Application.Spaces.Shared;

/// <summary>
/// Creates and hashes invitation tokens. A token is 32 random bytes, encoded as base64url; only its SHA-256 hash is
/// stored, so a database leak does not reveal usable invitation links.
/// </summary>
public static class InvitationToken
{
    private const int TokenBytes = 32;

    /// <summary>The longest token a request may contain; a real token has 43 characters.</summary>
    public const int MaxLength = 64;

    /// <summary>Creates a new token and its hash.</summary>
    /// <returns>The token to hand out once and the hash to store.</returns>
    public static (string Token, byte[] Hash) Create()
    {
        var bytes = RandomNumberGenerator.GetBytes(TokenBytes);
        return (Base64Url.EncodeToString(bytes), SHA256.HashData(bytes));
    }

    /// <summary>Hashes a token received from a client.</summary>
    /// <param name="token">The token.</param>
    /// <param name="hash">The SHA-256 hash of the decoded token.</param>
    /// <returns><see langword="false" /> when the value cannot be a token.</returns>
    public static bool TryHash(string token, [NotNullWhen(true)] out byte[]? hash)
    {
        // Unlike TryDecodeFromChars, this overload reports malformed input instead of throwing.
        Span<byte> bytes = stackalloc byte[Base64Url.GetMaxDecodedLength(MaxLength)];
        if (token.Length > MaxLength
            || Base64Url.DecodeFromChars(token, bytes, out _, out var written) != OperationStatus.Done
            || written != TokenBytes)
        {
            hash = null;
            return false;
        }

        hash = SHA256.HashData(bytes[..TokenBytes]);
        return true;
    }

    /// <summary>Builds the app link for a token. The token is in the fragment, which browsers never send to a server.</summary>
    /// <param name="token">The token.</param>
    /// <returns>The relative link to the invitation page.</returns>
    public static string Link(string token) => $"/invite#{token}";
}
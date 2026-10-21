using System.Security.Cryptography;
using System.Text;

namespace Kijk.Application.Imports.Csv;

/// <summary>
/// Identifies a bank export format by its header row, delimiter and encoding.
/// </summary>
public static class HeaderFingerprint
{
    /// <summary>Computes the fingerprint.</summary>
    /// <param name="headers">The header fields.</param>
    /// <param name="delimiter">The delimiter.</param>
    /// <param name="encoding">The encoding name.</param>
    /// <returns>A hex SHA-256 hash.</returns>
    public static string Compute(IEnumerable<string> headers, string delimiter, string encoding)
    {
        var normalized = string.Join('\u001f', headers.Select(header => header.Trim().ToLowerInvariant()));
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes($"{normalized}\u001e{delimiter}\u001e{encoding}"));
        return Convert.ToHexStringLower(bytes);
    }
}
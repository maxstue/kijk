using System.ComponentModel.DataAnnotations;
using Kijk.Shared;
using Wolverine;

namespace Kijk.Infrastructure.Imports;

/// <summary>
/// The secret for pseudonymous keys (HMAC). It comes from Infisical as <c>Fingerprint__MasterKey</c> and is never stored
/// in the database, its backups or Git.
/// </summary>
public sealed class FingerprintOptions : IConfigOptions
{
    /// <inheritdoc />
    public static string SectionName => "Fingerprint";

    /// <summary>Gets or sets 32 random bytes, Base64-encoded.</summary>
    [Required]
    public string MasterKey { get; set; } = string.Empty;

    /// <summary>Gets or sets the version of <see cref="MasterKey" />; increase it only when the key is rotated.</summary>
    [Range(1, int.MaxValue)]
    public int KeyVersion { get; set; } = 1;
}

/// <summary>
/// The key that encrypts the ASP.NET Data Protection key ring stored in Postgres. It comes from Infisical as
/// <c>DataProtection__KeyEncryptionKey</c>.
/// </summary>
public sealed class KeyRingOptions : IConfigOptions
{
    /// <inheritdoc />
    public static string SectionName => "DataProtection";

    /// <summary>Gets or sets 32 random bytes, Base64-encoded.</summary>
    [Required]
    public string KeyEncryptionKey { get; set; } = string.Empty;
}

/// <summary>
/// Settings of the background job processing.
/// </summary>
public sealed class JobsOptions : IConfigOptions
{
    /// <inheritdoc />
    public static string SectionName => "Jobs";

    /// <summary>Gets or sets whether background jobs run. Only tests that do not need imports turn them off.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Gets or sets how Wolverine coordinates durable messages between nodes.</summary>
    public DurabilityMode DurabilityMode { get; set; } = DurabilityMode.Balanced;
}

/// <summary>
/// Decodes the Base64 secrets of the import options.
/// </summary>
internal static class SecretKey
{
    private const int KeyLength = 32;

    /// <summary>Decodes a 32-byte key.</summary>
    /// <param name="value">The Base64 value.</param>
    /// <param name="name">The configuration key, for the error message.</param>
    /// <returns>The key.</returns>
    /// <exception cref="InvalidOperationException">The value is missing or not 32 bytes long.</exception>
    public static byte[] Decode(string value, string name)
    {
        Span<byte> buffer = stackalloc byte[64];
        if (string.IsNullOrWhiteSpace(value) || !Convert.TryFromBase64String(value, buffer, out var length) || length != KeyLength)
        {
            throw new InvalidOperationException($"'{name}' must be {KeyLength} random bytes, Base64-encoded (e.g. 'openssl rand -base64 32').");
        }

        return buffer[..length].ToArray();
    }

    /// <summary>Returns whether a value is a valid 32-byte key.</summary>
    /// <param name="value">The Base64 value.</param>
    /// <returns><see langword="true" /> if valid.</returns>
    public static bool IsValid(string value)
    {
        Span<byte> buffer = stackalloc byte[64];
        return !string.IsNullOrWhiteSpace(value) && Convert.TryFromBase64String(value, buffer, out var length) && length == KeyLength;
    }
}
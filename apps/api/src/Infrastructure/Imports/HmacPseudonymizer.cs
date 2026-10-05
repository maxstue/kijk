using System.Buffers.Text;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Kijk.Application.Shared.Security;
using Microsoft.Extensions.Options;

namespace Kijk.Infrastructure.Imports;

/// <summary>
/// Computes HMAC-SHA256 keys with a per-household key derived by HKDF from the master key. The derived keys are never
/// stored.
/// </summary>
internal sealed class HmacPseudonymizer : IPseudonymizer
{
    private readonly byte[] _masterKey;
    private readonly ConcurrentDictionary<Guid, byte[]> _householdKeys = new();

    /// <summary>Creates the service from the configured master key.</summary>
    /// <param name="options">The fingerprint options.</param>
    public HmacPseudonymizer(IOptions<FingerprintOptions> options)
    {
        _masterKey = SecretKey.Decode(options.Value.MasterKey, "Fingerprint__MasterKey");
        KeyVersion = options.Value.KeyVersion;
    }

    /// <inheritdoc />
    public int KeyVersion { get; }

    /// <inheritdoc />
    public string Compute(Guid householdId, string purpose, string value)
    {
        var key = _householdKeys.GetOrAdd(householdId, id => HKDF.DeriveKey(
            HashAlgorithmName.SHA256,
            _masterKey,
            outputLength: 32,
            salt: [],
            info: Encoding.UTF8.GetBytes($"kijk-fingerprint-v{KeyVersion}:{id:N}")));
        var hash = HMACSHA256.HashData(key, Encoding.UTF8.GetBytes($"{purpose}\u001f{value}"));
        return Base64Url.EncodeToString(hash);
    }
}
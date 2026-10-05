using System.Security.Cryptography;
using System.Text;
using System.Xml.Linq;
using Microsoft.AspNetCore.DataProtection.XmlEncryption;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Kijk.Infrastructure.Imports;

/// <summary>
/// Encrypts Data Protection keys with AES-GCM before they are stored in Postgres, so the database alone cannot decrypt
/// uploaded files.
/// </summary>
/// <param name="options">The key ring options; the key is read when a key is encrypted, not at startup.</param>
internal sealed class AesGcmXmlEncryptor(IOptions<KeyRingOptions> options) : IXmlEncryptor
{
    private const int NonceSize = 12;
    private const int TagSize = 16;

    /// <inheritdoc />
    public EncryptedXmlInfo Encrypt(XElement plaintextElement)
    {
        var plaintext = Encoding.UTF8.GetBytes(plaintextElement.ToString(SaveOptions.DisableFormatting));
        var payload = new byte[NonceSize + TagSize + plaintext.Length];
        var nonce = payload.AsSpan(0, NonceSize);
        RandomNumberGenerator.Fill(nonce);
        using var aes = new AesGcm(SecretKey.Decode(options.Value.KeyEncryptionKey, "DataProtection__KeyEncryptionKey"), TagSize);
        aes.Encrypt(nonce, plaintext, payload.AsSpan(NonceSize + TagSize), payload.AsSpan(NonceSize, TagSize));

        var element = new XElement("encryptedKey",
            new XComment(" This key is encrypted with AES-256-GCM and the key from DataProtection__KeyEncryptionKey. "),
            new XElement("value", Convert.ToBase64String(payload)));
        return new EncryptedXmlInfo(element, typeof(AesGcmXmlDecryptor));
    }
}

/// <summary>
/// Decrypts Data Protection keys encrypted by <see cref="AesGcmXmlEncryptor" />. Data Protection creates it with the
/// service provider.
/// </summary>
/// <param name="services">The service provider.</param>
public sealed class AesGcmXmlDecryptor(IServiceProvider services) : IXmlDecryptor
{
    private const int NonceSize = 12;
    private const int TagSize = 16;

    /// <inheritdoc />
    public XElement Decrypt(XElement encryptedElement)
    {
        var options = services.GetRequiredService<IOptions<KeyRingOptions>>().Value;
        var key = SecretKey.Decode(options.KeyEncryptionKey, "DataProtection__KeyEncryptionKey");
        var payload = Convert.FromBase64String((string?)encryptedElement.Element("value") ?? string.Empty);
        var plaintext = new byte[payload.Length - NonceSize - TagSize];
        using var aes = new AesGcm(key, TagSize);
        aes.Decrypt(payload.AsSpan(0, NonceSize), payload.AsSpan(NonceSize + TagSize), payload.AsSpan(NonceSize, TagSize), plaintext);
        return XElement.Parse(Encoding.UTF8.GetString(plaintext));
    }
}
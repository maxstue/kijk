using System.Text;

namespace Kijk.Application.Imports.Csv;

/// <summary>
/// Detects the text encoding of a bank export and decodes it.
/// </summary>
public static class CsvDecoder
{
    /// <summary>The name of UTF-8, with or without byte order mark.</summary>
    public const string Utf8 = "utf-8";

    /// <summary>The name of Windows-1252, the superset of ISO-8859-1 that German banks use for older exports.</summary>
    public const string Windows1252 = "windows-1252";

    private static readonly UTF8Encoding StrictUtf8 = new(encoderShouldEmitUTF8Identifier: false, throwOnInvalidBytes: true);

    static CsvDecoder() => Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

    /// <summary>Detects the encoding: UTF-8 when the bytes are valid UTF-8, otherwise Windows-1252.</summary>
    /// <param name="content">The file content.</param>
    /// <returns>The encoding name.</returns>
    public static string DetectEncoding(byte[] content)
    {
        if (HasUtf8Bom(content))
        {
            return Utf8;
        }

        try
        {
            StrictUtf8.GetString(content);
            return Utf8;
        }
        catch (DecoderFallbackException)
        {
            return Windows1252;
        }
    }

    /// <summary>Decodes the file content.</summary>
    /// <param name="content">The file content.</param>
    /// <param name="encoding">The encoding name.</param>
    /// <returns>The text without byte order mark.</returns>
    /// <exception cref="ArgumentException">The encoding is not supported.</exception>
    public static string Decode(byte[] content, string encoding) => encoding switch
    {
        Utf8 when HasUtf8Bom(content) => Encoding.UTF8.GetString(content, 3, content.Length - 3),
        Utf8 => Encoding.UTF8.GetString(content),
        Windows1252 => Encoding.GetEncoding(1252).GetString(content),
        _ => throw new ArgumentException($"Encoding '{encoding}' is not supported.", nameof(encoding))
    };

    private static bool HasUtf8Bom(byte[] content) =>
        content.Length >= 3 && content[0] == 0xEF && content[1] == 0xBB && content[2] == 0xBF;
}
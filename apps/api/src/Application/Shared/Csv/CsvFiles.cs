using System.Text;

namespace Kijk.Application.Shared.Csv;

/// <summary>
/// Shared rules for CSV downloads: UTF-8 with BOM and CRLF line endings, so spreadsheet apps detect the encoding, and
/// text cells that cannot start a formula.
/// </summary>
public static class CsvFiles
{
    private static readonly UTF8Encoding Utf8WithBom = new(encoderShouldEmitUTF8Identifier: true);

    /// <summary>Encodes CSV text for download.</summary>
    /// <param name="csv">The CSV text.</param>
    /// <returns>The UTF-8 bytes with BOM and CRLF line endings.</returns>
    public static byte[] Encode(string csv)
    {
        var content = Utf8WithBom.GetBytes(csv.ReplaceLineEndings("\r\n"));
        var preamble = Utf8WithBom.GetPreamble();
        var result = new byte[preamble.Length + content.Length];
        preamble.CopyTo(result, 0);
        content.CopyTo(result, preamble.Length);
        return result;
    }

    /// <summary>
    /// Prefixes text that a spreadsheet would read as a formula (starting with =, +, - or @) with an apostrophe.
    /// Use it for free text only, never for numbers.
    /// </summary>
    /// <param name="value">The text.</param>
    /// <returns>The safe text, or an empty string.</returns>
    public static string SanitizeText(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        var trimmed = value.AsSpan().TrimStart();
        return !trimmed.IsEmpty && trimmed[0] is '=' or '+' or '-' or '@' ? $"'{value}" : value;
    }
}
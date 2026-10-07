using Kijk.Application.Imports.Csv;
using Kijk.Application.Shared.Persistence;

namespace Kijk.Application.Imports.Shared;

/// <summary>
/// Loads and decrypts the stored file of an import.
/// </summary>
public sealed class ImportFileReader(IAppDbContext dbContext, IImportFileProtector protector) : IHandler
{
    /// <summary>Loads the decrypted file.</summary>
    /// <param name="importJobId">The import.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>The plain content, or <see langword="null" /> when the file was deleted or expired.</returns>
    public async Task<byte[]?> LoadAsync(Guid importJobId, CancellationToken cancellationToken)
    {
        var encrypted = await dbContext.ImportFiles
            .Where(file => file.ImportJobId == importJobId && file.ExpiresAt > DateTime.UtcNow)
            .Select(file => file.Content)
            .FirstOrDefaultAsync(cancellationToken);

        return encrypted is null ? null : protector.Unprotect(encrypted);
    }

    /// <summary>Decodes and splits a file with the given mapping.</summary>
    /// <param name="content">The plain content.</param>
    /// <param name="mapping">The mapping.</param>
    /// <returns>All non-empty records.</returns>
    public static CsvTable ReadTable(byte[] content, CsvImportMapping mapping) =>
        CsvTable.Read(CsvDecoder.Decode(content, mapping.Encoding), mapping.Delimiter[0]);
}
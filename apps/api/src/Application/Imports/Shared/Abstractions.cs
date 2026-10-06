using Kijk.Application.Shared.Jobs;

namespace Kijk.Application.Imports.Shared;

/// <summary>
/// Encrypts uploaded files before they are stored. The key is kept apart from the database.
/// </summary>
public interface IImportFileProtector
{
    /// <summary>Encrypts a file.</summary>
    /// <param name="content">The plain file content.</param>
    /// <returns>The encrypted content.</returns>
    byte[] Protect(byte[] content);

    /// <summary>Decrypts a file.</summary>
    /// <param name="content">The encrypted file content.</param>
    /// <returns>The plain content.</returns>
    byte[] Unprotect(byte[] content);
}

/// <summary>Detects the format of an uploaded file and proposes a mapping.</summary>
/// <param name="ImportJobId">The import.</param>
public sealed record AnalyzeImport(Guid ImportJobId);

/// <summary>Reads the whole file with the confirmed mapping into candidates.</summary>
/// <param name="ImportJobId">The import.</param>
public sealed record ReadImport(Guid ImportJobId);

/// <summary>Proposes categories with the AI for the candidates that have none.</summary>
/// <param name="ImportJobId">The import.</param>
public sealed record CategorizeImport(Guid ImportJobId);
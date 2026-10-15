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
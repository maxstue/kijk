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

/// <summary>
/// Queues background work for imports. The message is stored in the same database transaction as the pending
/// changes, so a crash can neither lose the work nor run it for changes that were never saved.
/// </summary>
public interface IImportJobQueue
{
    /// <summary>Saves all pending changes and queues the message atomically.</summary>
    /// <typeparam name="TMessage">One of the import message types.</typeparam>
    /// <param name="message">The message.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when both are stored.</returns>
    Task SaveChangesAndEnqueueAsync<TMessage>(TMessage message, CancellationToken cancellationToken)
        where TMessage : class;
}

/// <summary>Detects the format of an uploaded file and proposes a mapping.</summary>
/// <param name="ImportJobId">The import.</param>
public sealed record AnalyzeImport(Guid ImportJobId);

/// <summary>Reads the whole file with the confirmed mapping into candidates.</summary>
/// <param name="ImportJobId">The import.</param>
public sealed record ReadImport(Guid ImportJobId);
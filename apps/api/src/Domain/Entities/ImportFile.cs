namespace Kijk.Domain.Entities;

/// <summary>
/// The encrypted content of an uploaded CSV file. It only exists while its import is open and at most until
/// <see cref="ExpiresAt" />.
/// </summary>
public sealed class ImportFile : BaseEntity
{
    /// <summary>How long an uploaded file is kept at most.</summary>
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(24);

    /// <summary>Gets the encrypted file content.</summary>
    public required byte[] Content { get; init; }

    /// <summary>Gets when the file is deleted at the latest (UTC).</summary>
    public required DateTime ExpiresAt { get; init; }

    /// <summary>Gets or sets the id of <see cref="ImportJob" />.</summary>
    public Guid ImportJobId { get; set; }

    /// <summary>Gets or sets the import the file belongs to.</summary>
    public required ImportJob ImportJob { get; set; }

    /// <summary>Creates the stored file of an import.</summary>
    /// <param name="encryptedContent">The encrypted file content.</param>
    /// <param name="importJob">The import.</param>
    /// <param name="utcNow">The current time.</param>
    /// <returns>The new file.</returns>
    public static ImportFile Create(byte[] encryptedContent, ImportJob importJob, DateTime utcNow) =>
        new()
        {
            Content = encryptedContent,
            ExpiresAt = utcNow.Add(Lifetime),
            ImportJob = importJob
        };
}
using Kijk.Application.Imports.Cleanup;

// Keep message namespaces stable: persisted Wolverine envelopes refer to these type identities.
namespace Kijk.Infrastructure.Imports;

/// <summary>Recurring trigger for the import cleanup, scheduled in <see cref="Jobs.JobsDependencyInjection" />.</summary>
/// <param name="Occurrence">The scheduled time this run belongs to.</param>
public sealed record CleanupImports(DateTimeOffset Occurrence);

/// <summary>
/// Wolverine handler for <see cref="CleanupImports" />. It only delegates to <see cref="CleanupImportsHandler" />.
/// </summary>
public static class CleanupImportsMessageHandler
{
    /// <summary>Deletes expired upload files and leftover review rows.</summary>
    /// <param name="_">The occurrence; Wolverine routes by its type.</param>
    /// <param name="handler">The import cleanup.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the cleanup is done.</returns>
    public static Task Handle(CleanupImports _, CleanupImportsHandler handler, CancellationToken cancellationToken) =>
        handler.CleanupAsync(cancellationToken);
}
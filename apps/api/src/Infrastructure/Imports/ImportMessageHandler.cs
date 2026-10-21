using Kijk.Application.Imports.Processing;
using Kijk.Application.Imports.Shared;

namespace Kijk.Infrastructure.Imports;

/// <summary>
/// Wolverine handlers for import messages. They only delegate to <see cref="ImportJobProcessor" />.
/// </summary>
public static class ImportMessageHandler
{
    /// <summary>Analyzes an uploaded file.</summary>
    /// <param name="message">The message.</param>
    /// <param name="processor">The import processor.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the step is done.</returns>
    public static Task Handle(AnalyzeImport message, ImportJobProcessor processor, CancellationToken cancellationToken) =>
        processor.AnalyzeAsync(message.ImportJobId, cancellationToken);

    /// <summary>Reads a file with its confirmed mapping.</summary>
    /// <param name="message">The message.</param>
    /// <param name="processor">The import processor.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the step is done.</returns>
    public static Task Handle(ReadImport message, ImportJobProcessor processor, CancellationToken cancellationToken) =>
        processor.ReadAsync(message.ImportJobId, cancellationToken);

    /// <summary>Proposes categories for the rows of an import.</summary>
    /// <param name="message">The message.</param>
    /// <param name="processor">The import processor.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the step is done.</returns>
    public static Task Handle(CategorizeImport message, ImportCategorizationProcessor processor, CancellationToken cancellationToken) =>
        processor.CategorizeAsync(message.ImportJobId, cancellationToken);
}
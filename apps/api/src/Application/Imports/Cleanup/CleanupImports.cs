using Kijk.Application.Shared.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Imports.Cleanup;

/// <summary>
/// Deletes expired upload files and leftover review rows, and fails imports whose file expired. Runs at startup and
/// periodically, so files never outlive their expiry even after a restart or an abandoned upload.
/// </summary>
public sealed class CleanupImportsHandler(IAppDbContext dbContext, TimeProvider timeProvider, ILogger<CleanupImportsHandler> logger) : IHandler
{
    /// <summary>Runs the cleanup.</summary>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>The number of deleted files.</returns>
    public async Task<int> CleanupAsync(CancellationToken cancellationToken)
    {
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var closed = new[] { ImportJobStatus.Done, ImportJobStatus.Failed, ImportJobStatus.Cancelled };
        var expiredJobIds = dbContext.ImportFiles.Where(item => item.ExpiresAt <= utcNow).Select(item => item.ImportJobId);
        var closedJobIds = dbContext.ImportJobs.Where(item => closed.Contains(item.Status)).Select(item => item.Id);

        var failed = await dbContext.ImportJobs
            .Where(item => expiredJobIds.Contains(item.Id) && !closed.Contains(item.Status))
            .ExecuteUpdateAsync(setters => setters
                    .SetProperty(item => item.Status, ImportJobStatus.Failed)
                    .SetProperty(item => item.Error, "The uploaded file expired")
                    .SetProperty(item => item.CompletedAt, utcNow),
                cancellationToken);
        var candidates = await dbContext.ImportCandidates
            .Where(item => closedJobIds.Contains(item.ImportJobId))
            .ExecuteDeleteAsync(cancellationToken);
        var files = await dbContext.ImportFiles
            .Where(item => item.ExpiresAt <= utcNow || closedJobIds.Contains(item.ImportJobId))
            .ExecuteDeleteAsync(cancellationToken);

        if (failed + candidates + files > 0 && logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation(
                "Import cleanup failed {FailedImports} expired imports and deleted {Files} files and {Candidates} rows",
                failed,
                files,
                candidates);
        }

        return files;
    }
}
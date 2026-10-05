using Kijk.Application.Imports.Cleanup;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Kijk.Infrastructure.Imports;

/// <summary>
/// Runs the import cleanup right after startup, so expired files from before a restart or a backup restore are gone
/// first, and then every hour.
/// </summary>
/// <param name="scopeFactory">Creates a scope per run.</param>
/// <param name="logger">The logger.</param>
internal sealed class ImportCleanupService(IServiceScopeFactory scopeFactory, ILogger<ImportCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<CleanupImportsHandler>().CleanupAsync(stoppingToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                logger.LogError(exception, "Import cleanup failed");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
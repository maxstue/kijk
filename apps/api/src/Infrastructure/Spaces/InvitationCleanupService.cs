using Kijk.Application.Spaces.CleanupInvitations;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Kijk.Infrastructure.Spaces;

/// <summary>
/// Runs the invitation cleanup right after startup and then every hour, so closed invitations never outlive their
/// retention, even after a restart.
/// </summary>
/// <param name="scopeFactory">Creates a scope per run.</param>
/// <param name="logger">The logger.</param>
internal sealed class InvitationCleanupService(IServiceScopeFactory scopeFactory, ILogger<InvitationCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        try
        {
            do
            {
                try
                {
                    await using var scope = scopeFactory.CreateAsyncScope();
                    await scope.ServiceProvider.GetRequiredService<CleanupInvitationsHandler>().CleanupAsync(stoppingToken);
                }
                catch (Exception exception) when (exception is not OperationCanceledException)
                {
                    logger.LogError(exception, "Invitation cleanup failed");
                }
            }
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // The host is shutting down; the next start runs the cleanup again.
        }
    }
}
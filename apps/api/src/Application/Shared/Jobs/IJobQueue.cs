namespace Kijk.Application.Shared.Jobs;

/// <summary>
/// Queues background work such as imports or account deletions. The message is stored in the same database transaction as the pending
/// changes, so a crash can neither lose the work nor run it for changes that were never saved.
/// </summary>
public interface IJobQueue
{
    /// <summary>Saves all pending changes and queues the message atomically.</summary>
    /// <typeparam name="TMessage">A message type with a Wolverine handler.</typeparam>
    /// <param name="message">The message.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when both are stored.</returns>
    Task SaveChangesAndEnqueueAsync<TMessage>(TMessage message, CancellationToken cancellationToken)
        where TMessage : class;
}
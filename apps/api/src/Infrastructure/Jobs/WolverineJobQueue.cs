using Kijk.Application.Shared.Jobs;
using Kijk.Infrastructure.Persistence;
using Wolverine.EntityFrameworkCore;

namespace Kijk.Infrastructure.Jobs;

/// <summary>
/// Stores background jobs through Wolverine's EF Core outbox: the message is written in the same transaction as the
/// pending changes and delivered by the durable local queue, also after a restart.
/// </summary>
/// <param name="outbox">The outbox bound to the request's <see cref="AppDbContext" />.</param>
internal sealed class WolverineJobQueue(IDbContextOutbox<AppDbContext> outbox) : IJobQueue
{
    /// <inheritdoc />
    public async Task SaveChangesAndEnqueueAsync<TMessage>(TMessage message, CancellationToken cancellationToken)
        where TMessage : class
    {
        await outbox.PublishAsync(message);
        await outbox.SaveChangesAndFlushMessagesAsync(cancellationToken);
    }
}
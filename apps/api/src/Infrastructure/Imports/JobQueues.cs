using Kijk.Application.Imports.Shared;
using Kijk.Application.Shared.Jobs;
using Kijk.Application.Shared.Persistence;
using Kijk.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;
using Wolverine.EntityFrameworkCore;

namespace Kijk.Infrastructure.Imports;

/// <summary>
/// Stores import messages through Wolverine's EF Core outbox: the message is written in the same transaction as the
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

/// <summary>
/// Used when background jobs are disabled, e.g. in tests that do not cover imports: saves the changes and drops the
/// message.
/// </summary>
/// <param name="dbContext">The database context.</param>
/// <param name="logger">The logger.</param>
internal sealed class DisabledJobQueue(IAppDbContext dbContext, ILogger<DisabledJobQueue> logger) : IJobQueue
{
    /// <inheritdoc />
    public async Task SaveChangesAndEnqueueAsync<TMessage>(TMessage message, CancellationToken cancellationToken)
        where TMessage : class
    {
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogWarning("Background jobs are disabled; {MessageType} was not queued", typeof(TMessage).Name);
    }
}
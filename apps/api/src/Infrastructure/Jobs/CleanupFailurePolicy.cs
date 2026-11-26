using JasperFx;
using JasperFx.CodeGeneration;
using Kijk.Infrastructure.Imports;
using Kijk.Infrastructure.Spaces;
using Wolverine.Configuration;
using Wolverine.ErrorHandling;
using Wolverine.Runtime.Handlers;

namespace Kijk.Infrastructure.Jobs;

/// <summary>
/// Error handling of the recurring cleanups: a failed occurrence is retried briefly and then discarded instead of
/// dead-lettered, because the next occurrence deletes the same data. Wolverine logs every failure.
/// </summary>
internal sealed class CleanupFailurePolicy : IHandlerPolicy
{
    private static readonly HashSet<Type> CleanupMessages = [typeof(CleanupInvitations), typeof(CleanupImports)];

    /// <inheritdoc />
    public void Apply(IReadOnlyList<HandlerChain> chains, GenerationRules rules, IServiceContainer container)
    {
        foreach (var chain in chains.Where(chain => CleanupMessages.Contains(chain.MessageType)))
        {
            chain.OnAnyException()
                .RetryWithCooldown(TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(60))
                .Then.Discard();
        }
    }
}
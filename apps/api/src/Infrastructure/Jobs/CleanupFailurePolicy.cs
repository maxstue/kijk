using JasperFx;
using JasperFx.CodeGeneration;
using Kijk.Infrastructure.Imports;
using Kijk.Infrastructure.Spaces;
using Wolverine.Configuration;
using Wolverine.ErrorHandling;
using Wolverine.Runtime.Handlers;

namespace Kijk.Infrastructure.Jobs;

/// <summary>
/// Error handling of the recurring cleanups: a failed occurrence is discarded instead of retried or dead-lettered,
/// because the next occurrence deletes the same data an hour later. Wolverine logs every failure. Chain rules are
/// evaluated before the global retry rules, which <c>CleanupScheduleTests</c> checks.
/// </summary>
internal sealed class CleanupFailurePolicy : IHandlerPolicy
{
    private static readonly HashSet<Type> CleanupMessages = [typeof(CleanupInvitations), typeof(CleanupImports)];

    /// <inheritdoc />
    public void Apply(IReadOnlyList<HandlerChain> chains, GenerationRules rules, IServiceContainer container)
    {
        foreach (var chain in chains.Where(chain => CleanupMessages.Contains(chain.MessageType)))
        {
            chain.OnAnyException().Discard();
        }
    }
}
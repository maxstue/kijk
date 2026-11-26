using Kijk.Application.Imports.Cleanup;
using Kijk.Infrastructure.Jobs;

// Keep message namespaces stable: persisted Wolverine envelopes refer to these type identities.
namespace Kijk.Infrastructure.Imports;

/// <summary>Hourly trigger for the import cleanup, scheduled in <see cref="JobsDependencyInjection" />.</summary>
#pragma warning disable S2094 // Wolverine routes by message type; the trigger carries no data.
public sealed record CleanupImports;
#pragma warning restore S2094

/// <summary>Runs <see cref="CleanupImportsHandler" /> for each <see cref="CleanupImports" /> occurrence.</summary>
public static class CleanupImportsMessageHandler
{
    public static Task Handle(CleanupImports _, CleanupImportsHandler handler, CancellationToken cancellationToken) =>
        handler.CleanupAsync(cancellationToken);
}
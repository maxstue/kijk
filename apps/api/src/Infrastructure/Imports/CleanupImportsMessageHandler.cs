using Kijk.Application.Imports.Cleanup;

// Keep message namespaces stable: persisted Wolverine envelopes refer to these type identities.
namespace Kijk.Infrastructure.Imports;

/// <summary>Recurring trigger for the import cleanup, scheduled in <see cref="Jobs.JobsDependencyInjection" />.</summary>
#pragma warning disable S2094 // Wolverine routes by message type; the trigger carries no data.
public sealed record CleanupImports;
#pragma warning restore S2094

/// <summary>Wolverine handler for <see cref="CleanupImports" />. It only delegates to <see cref="CleanupImportsHandler" />.</summary>
public static class CleanupImportsMessageHandler
{
    public static Task Handle(CleanupImports _, CleanupImportsHandler handler, CancellationToken cancellationToken) =>
        handler.CleanupAsync(cancellationToken);
}
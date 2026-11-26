using Kijk.Application.Spaces.CleanupInvitations;
using Kijk.Infrastructure.Jobs;

// Keep message namespaces stable: persisted Wolverine envelopes refer to these type identities.
namespace Kijk.Infrastructure.Spaces;

/// <summary>Hourly trigger for the invitation cleanup, scheduled in <see cref="JobsDependencyInjection" />.</summary>
#pragma warning disable S2094 // Wolverine routes by message type; the trigger carries no data.
public sealed record CleanupInvitations;
#pragma warning restore S2094

/// <summary>Runs <see cref="CleanupInvitationsHandler" /> for each <see cref="CleanupInvitations" /> occurrence.</summary>
public static class CleanupInvitationsMessageHandler
{
    public static Task Handle(CleanupInvitations _, CleanupInvitationsHandler handler, CancellationToken cancellationToken) =>
        handler.CleanupAsync(cancellationToken);
}
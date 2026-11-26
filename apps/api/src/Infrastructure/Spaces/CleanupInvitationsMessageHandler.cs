using Kijk.Application.Spaces.CleanupInvitations;

// Keep message namespaces stable: persisted Wolverine envelopes refer to these type identities.
namespace Kijk.Infrastructure.Spaces;

/// <summary>Recurring trigger for the invitation cleanup, scheduled in <see cref="Jobs.JobsDependencyInjection" />.</summary>
#pragma warning disable S2094 // Wolverine routes by message type; the trigger carries no data.
public sealed record CleanupInvitations;
#pragma warning restore S2094

/// <summary>
/// Wolverine handler for <see cref="CleanupInvitations" />. It only delegates to <see cref="CleanupInvitationsHandler" />.
/// </summary>
public static class CleanupInvitationsMessageHandler
{
    public static Task Handle(CleanupInvitations _, CleanupInvitationsHandler handler, CancellationToken cancellationToken) =>
        handler.CleanupAsync(cancellationToken);
}
using Kijk.Application.Spaces.CleanupInvitations;

// Keep message namespaces stable: persisted Wolverine envelopes refer to these type identities.
namespace Kijk.Infrastructure.Spaces;

/// <summary>Recurring trigger for the invitation cleanup, scheduled in <see cref="Jobs.JobsDependencyInjection" />.</summary>
/// <param name="Occurrence">The scheduled time this run belongs to.</param>
public sealed record CleanupInvitations(DateTimeOffset Occurrence);

/// <summary>
/// Wolverine handler for <see cref="CleanupInvitations" />. It only delegates to <see cref="CleanupInvitationsHandler" />.
/// </summary>
public static class CleanupInvitationsMessageHandler
{
    /// <summary>Deletes closed invitations after their retention.</summary>
    /// <param name="_">The occurrence; Wolverine routes by its type.</param>
    /// <param name="handler">The invitation cleanup.</param>
    /// <param name="cancellationToken">A token to cancel the operation.</param>
    /// <returns>A task that completes when the cleanup is done.</returns>
    public static Task Handle(CleanupInvitations _, CleanupInvitationsHandler handler, CancellationToken cancellationToken) =>
        handler.CleanupAsync(cancellationToken);
}
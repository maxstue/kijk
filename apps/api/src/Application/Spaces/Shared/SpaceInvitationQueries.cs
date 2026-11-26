using Kijk.Domain.Entities;

namespace Kijk.Application.Spaces.Shared;

/// <summary>Shared filters for space invitations.</summary>
public static class SpaceInvitationQueries
{
    /// <summary>
    /// Keeps the invitations that can still be accepted: not accepted, declined, revoked or expired. Matches
    /// <see cref="SpaceInvitation.IsPending" />.
    /// </summary>
    /// <param name="invitations">The invitations.</param>
    /// <param name="utcNow">The current time.</param>
    /// <returns>The pending invitations.</returns>
    public static IQueryable<SpaceInvitation> Pending(this IQueryable<SpaceInvitation> invitations, DateTime utcNow) =>
        invitations.Where(item => item.AcceptedAt == null && item.DeclinedAt == null && item.RevokedAt == null && item.ExpiresAt > utcNow);

    /// <summary>
    /// Keeps the invitations that still block a new invitation for the same person in the unique index: not accepted,
    /// declined or revoked, but possibly expired.
    /// </summary>
    /// <param name="invitations">The invitations.</param>
    /// <returns>The unclosed invitations.</returns>
    public static IQueryable<SpaceInvitation> Unclosed(this IQueryable<SpaceInvitation> invitations) =>
        invitations.Where(item => item.AcceptedAt == null && item.DeclinedAt == null && item.RevokedAt == null);
}
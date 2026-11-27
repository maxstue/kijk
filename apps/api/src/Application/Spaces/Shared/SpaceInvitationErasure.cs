using Kijk.Application.Shared.Persistence;
using Kijk.Domain.Entities;

namespace Kijk.Application.Spaces.Shared;

/// <summary>Prepares local invitation deletions and gathers the IDs needed for provider cleanup.</summary>
internal static class SpaceInvitationErasure
{
    public static async Task<string[]> StageAsync(
        IAppDbContext dbContext, IQueryable<SpaceInvitation> invitations, CancellationToken cancellationToken)
    {
        var rows = await invitations.ToListAsync(cancellationToken);
        dbContext.SpaceInvitations.RemoveRange(rows);
        return rows.Select(item => item.ProviderInvitationId).OfType<string>().ToArray();
    }
}
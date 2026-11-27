using Kijk.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace Kijk.Application.Users.Invitations;

/// <summary>
/// Maps invitations to inbox entries of the invited person.
/// </summary>
[Mapper]
public static partial class ReceivedInvitationMapper
{
    /// <summary>
    /// Maps a materialized invitation with its space, role and creator to an inbox entry.
    /// </summary>
    /// <param name="source">The invitation.</param>
    /// <returns>The mapped response.</returns>
    [MapProperty(nameof(@SpaceInvitation.CreatedBy.Name), nameof(ReceivedInvitationResponse.InvitedByName))]
    public static partial ReceivedInvitationResponse ToReceivedResponse(this SpaceInvitation source);

    /// <summary>
    /// Projects invitations to inbox entries in the underlying query provider.
    /// </summary>
    /// <param name="source">The invitation query.</param>
    /// <returns>The projected response query.</returns>
    public static partial IQueryable<ReceivedInvitationResponse> ToReceivedResponse(this IQueryable<SpaceInvitation> source);
}
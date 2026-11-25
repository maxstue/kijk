using Kijk.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace Kijk.Application.Spaces.Shared;

/// <summary>
/// Maps space invitations to API responses.
/// </summary>
[Mapper]
public static partial class InvitationResponseMapper
{
    /// <summary>
    /// Maps a materialized invitation with its role and creator to a response.
    /// </summary>
    /// <param name="source">The invitation.</param>
    /// <returns>The mapped response.</returns>
    public static partial SpaceInvitationResponse ToResponse(this SpaceInvitation source);

    /// <summary>
    /// Projects invitations to responses in the underlying query provider.
    /// </summary>
    /// <param name="source">The invitation query.</param>
    /// <returns>The projected response query.</returns>
    public static partial IQueryable<SpaceInvitationResponse> ToResponse(this IQueryable<SpaceInvitation> source);
}
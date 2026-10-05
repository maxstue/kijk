using Kijk.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace Kijk.Application.Users.GetMe;

/// <summary>
/// Projects user entities to detailed current-user responses.
/// </summary>
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class GetMeUserResponseMapper
{
    /// <summary>
    /// Projects user entities to detailed responses in the underlying query provider.
    /// </summary>
    /// <param name="source">The user query.</param>
    /// <returns>The projected response query.</returns>
    public static partial IQueryable<GetMeUserResponse> ToResponse(this IQueryable<User> source);

    [MapProperty(nameof(User.UserSpaces), nameof(GetMeUserResponse.Spaces))]
    [MapperIgnoreTarget(nameof(GetMeUserResponse.UseExternalProfile))]
    [MapperIgnoreTarget(nameof(GetMeUserResponse.ExternalIdentity))]
    private static partial GetMeUserResponse Map(User source);

    [MapProperty(nameof(UserSpace.Space.Name), nameof(UserSpaceResponse.Name))]
    [MapProperty(nameof(UserSpace.Space.Description), nameof(UserSpaceResponse.Description))]
    [MapProperty(nameof(UserSpace.SpaceId), nameof(UserSpaceResponse.Id))]
    [MapProperty(new[] { nameof(UserSpace.Space), nameof(Space.IsPersonal) }, nameof(UserSpaceResponse.IsPersonal))]
    private static partial UserSpaceResponse MapSpace(UserSpace source);

    [MapProperty(nameof(Resource.Unit) + "." + nameof(Unit.Symbol), nameof(UserResourceResponse.Unit))]
    private static partial UserResourceResponse MapResource(Resource source);

    private static string MapPermission(Permission source) => source.Name;
}
using Kijk.Domain.Entities;
using Kijk.Shared;
using Riok.Mapperly.Abstractions;

namespace Kijk.Application.Users.Shared;

/// <summary>
/// Maps user entities to API responses.
/// </summary>
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class UserResponseMapper
{
    /// <summary>
    /// Maps a materialized user entity to a response.
    /// </summary>
    /// <param name="source">The user to map.</param>
    /// <param name="useDefaultResources">Whether the response should indicate that default resources are used.</param>
    /// <returns>The mapped response.</returns>
    public static partial UserResponse ToResponse(this User source, bool useDefaultResources);

    /// <summary>
    /// Projects user entities to responses in the underlying query provider.
    /// </summary>
    /// <param name="source">The user query.</param>
    /// <returns>The projected response query.</returns>
    public static partial IQueryable<UserResponse> ToResponse(this IQueryable<User> source);

    [MapPropertyFromSource(nameof(UserResponse.UseDefaultResources), Use = nameof(MapUseDefaultResources))]
    private static partial UserResponse Map(User source);

    private static bool? MapUseDefaultResources(User source) =>
        source.Resources.Any(resource => resource.CreatorType == CreatorType.System);
}
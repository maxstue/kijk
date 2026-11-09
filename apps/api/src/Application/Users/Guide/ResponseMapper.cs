using Kijk.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace Kijk.Application.Users.Guide;

/// <summary>Maps user-owned guide progress.</summary>
[Mapper]
public static partial class GuideResponseMapper
{
    /// <summary>Projects persisted guide progress.</summary>
    public static partial IQueryable<GuideResponse> ToGuideResponse(this IQueryable<User> source);

    /// <summary>Maps persisted guide progress.</summary>
    [MapperIgnoreTarget(nameof(GuideResponse.GuideVersion))]
    public static partial GuideResponse ToGuideResponse(this User source);
}
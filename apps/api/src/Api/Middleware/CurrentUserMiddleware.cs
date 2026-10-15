using System.Security.Claims;
using Kijk.Api.Authorization;
using Kijk.Api.Extensions;
using Kijk.Api.Mappers;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.AspNetCore.Authorization;

namespace Kijk.Api.Middleware;

/// <summary>
/// Middleware to set the current user.
/// </summary>
/// <param name="problemDetailsService">Writes problem-details responses.</param>
/// <param name="dbContext">The database context.</param>
/// <param name="currentUser">The current user.</param>
public class CurrentUserMiddleware(IProblemDetailsService problemDetailsService, AppDbContext dbContext, CurrentUser currentUser) : IMiddleware
{
    /// <inheritdoc />
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var endpoint = context.GetEndpoint();
        var isPublicEndpoint = endpoint?.Metadata.GetMetadata<IAuthorizeData>() is null
            || endpoint.Metadata.GetMetadata<IAllowAnonymous>() is not null;

        if (isPublicEndpoint)
        {
            await next(context);
            return;
        }

        if (await SetCurrentUser(context, endpoint) is not { } error)
        {
            await next(context);
            return;
        }

        context.Response.StatusCode = error.Type == ErrorType.NotFound
            ? StatusCodes.Status404NotFound
            : StatusCodes.Status401Unauthorized;
        await problemDetailsService.TryWriteAsync(new() { HttpContext = context, ProblemDetails = error.ToProblemDetails() });
    }

    private async Task<Error?> SetCurrentUser(HttpContext context, Endpoint? endpoint)
    {
        var extAuthId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(extAuthId))
        {
            return Error.Custom(ErrorType.Authentication, ErrorCodes.AuthenticationError, "Current user identifier claim is missing");
        }

        var spaceId = GetRouteSpaceId(context, endpoint);
        var userEntity = await GetUserFromDb(extAuthId, spaceId);
        currentUser.Principal = context.User;
        currentUser.User = userEntity;

        // Space ids of other users' spaces are not disclosed.
        return spaceId is not null && userEntity?.SpaceId is null
            ? Error.NotFound("Space could not be found")
            : null;
    }

    private static Guid? GetRouteSpaceId(HttpContext context, Endpoint? endpoint) =>
        endpoint?.Metadata.GetMetadata<SpaceScopedMetadata>() is { } metadata
        && Guid.TryParse(context.GetRouteValue(metadata.RouteParameter) as string, out var spaceId)
            ? spaceId
            : null;

    private Task<SimpleAuthUser?> GetUserFromDb(string sub, Guid? spaceId) => dbContext.Users
        .Where(x => x.AuthId == sub)
        .AsNoTracking()
        .ToSimpleAuthUser(spaceId)
        .FirstOrDefaultAsync();
}
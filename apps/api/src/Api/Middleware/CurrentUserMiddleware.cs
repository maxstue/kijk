using System.Security.Claims;
using Kijk.Api.Extensions;
using Kijk.Api.Mappers;
using Kijk.Infrastructure.Persistence;
using Kijk.Infrastructure.Telemetry;
using Kijk.Shared;
using Microsoft.AspNetCore.Authorization;

namespace Kijk.Api.Middleware;

/// <summary>
/// Middleware to set the current user.
/// </summary>
/// <param name="problemDetailsService">Writes problem-details responses.</param>
/// <param name="telemetryService">Reports errors to the telemetry service.</param>
/// <param name="dbContext">The database context.</param>
/// <param name="currentUser">The current user.</param>
public class CurrentUserMiddleware(IProblemDetailsService problemDetailsService, ITelemetryService telemetryService, AppDbContext dbContext, CurrentUser currentUser) : IMiddleware
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

        var (isSuccess, errorMessage) = await SetCurrentUser(context);
        if (isSuccess)
        {
            await next(context);
        }
        else
        {
            var problemDetails = Error.Custom(ErrorType.Authentication, ErrorCodes.AuthenticationError, errorMessage).ToProblemDetails();
            telemetryService.SendProblemDetails(problemDetails);

            await problemDetailsService.TryWriteAsync(new() { HttpContext = context, ProblemDetails = problemDetails });
        }
    }

    private async Task<(bool, string)> SetCurrentUser(HttpContext context)
    {
        var extAuthId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(extAuthId))
        {
            return (false, "Current user identifier claim is missing");
        }

        var userEntity = await GetUserFromDb(extAuthId);
        currentUser.Principal = context.User;

        currentUser.User = userEntity;
        return (true, string.Empty);
    }

    private Task<SimpleAuthUser?> GetUserFromDb(string sub) => dbContext.Users
        .Where(x => x.AuthId == sub)
        .AsNoTracking()
        .ToSimpleAuthUser()
        .FirstOrDefaultAsync();
}
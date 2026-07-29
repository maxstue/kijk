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
/// <param name="problemDetailsService"></param>
/// <param name="telemetryService"></param>
/// <param name="dbContext"></param>
/// <param name="currentUser"></param>
public class CurrentUserMiddleware(IProblemDetailsService problemDetailsService, ITelemetryService telemetryService, AppDbContext dbContext, CurrentUser currentUser) : IMiddleware
{
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

        var email = context.User.FindFirstValue(ClaimTypes.Email);
        var userEntity = await GetUserFromDb(extAuthId);
        currentUser.Principal = context.User;

        if (context.Request.Path.ToString().Contains("sign-in") && userEntity is null)
        {
            currentUser.User = new(
                Guid.CreateVersion7(),
                extAuthId,
                null,
                AppConstants.CreateUserIdentifier,
                email);
            return (true, string.Empty);
        }

        if (userEntity is null)
        {
            return (false, $"User for id '{extAuthId}' was not found");
        }

        if (userEntity.HouseholdId is null)
        {
            return (false, "User has no household");
        }

        currentUser.User = userEntity;
        return (true, string.Empty);
    }

    private Task<SimpleAuthUser?> GetUserFromDb(string sub) => dbContext.Users
        .Where(x => x.AuthId == sub)
        .AsNoTracking()
        .ToSimpleAuthUser()
        .FirstOrDefaultAsync();
}
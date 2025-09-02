using System.Security.Claims;
using Kijk.Api.Extensions;
using Kijk.Api.Services;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;

namespace Kijk.Api.Middleware;

/// <summary>
/// Middleware to set the current user.
/// </summary>
/// <param name="problemDetailsService"></param>
/// <param name="dbContext"></param>
/// <param name="currentUser"></param>
public class CurrentUserMiddleware(IProblemDetailsService problemDetailsService, IErrorReportingService errorReportingService, AppDbContext dbContext, CurrentUser currentUser) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var (isSuccess, errorMessage) = await SetCurrentUser(context);
        if (isSuccess)
        {
            await next(context);
        }
        else
        {
            var problemDetails = Error.Custom(ErrorType.Authentication, ErrorCodes.AuthenticationError, errorMessage!).ToProblemDetails();
            errorReportingService.SendProblemDetails(problemDetails);

            await problemDetailsService.TryWriteAsync(new() { HttpContext = context, ProblemDetails = problemDetails });
        }
    }

    private async Task<(bool, string?)> SetCurrentUser(HttpContext context)
    {
        if (context.Request.Path == "/" || AppConstants.AllowedOpenApiPaths.Any(x => context.Request.Path.ToString().Contains(x)))
        {
            return (true, null);
        }

        var extAuthId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (extAuthId == null)
        {
            return (false, $"User for id '{extAuthId}' was not found");
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
                email,
                true);
            return (true, null);
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
        return (true, null);
    }

    private Task<SimpleAuthUser?> GetUserFromDb(string sub) => dbContext.Users
        .Include(x => x.UserHouseholds)
        .Where(x => x.AuthId == sub)
        .Select(x => new SimpleAuthUser(x.Id, x.AuthId, x.GetActiveHouseHoldId(), x.Name, x.Email, x.FirstTime))
        .AsNoTracking()
        .AsSplitQuery()
        .FirstOrDefaultAsync();
}
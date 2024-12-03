using System.Security.Claims;
using System.Text.Json;

using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Common.Middleware;

public class CurrentUserMiddleware(AppDbContext dbContext, CurrentUser currentUser) : IMiddleware
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
            await HandleError(context, errorMessage);
        }
    }

    private async Task<(bool, string?)> SetCurrentUser(HttpContext context)
    {
        if (context.Request.Path == "/" || context.Request.Path.ToString().Contains("openapi"))
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
            // TODO use more values from token
            currentUser.User = new SimpleAuthUser(
                Guid.NewGuid(),
                extAuthId,
                Guid.Empty,
                AppConstants.CreateUserIdentifier,
                email,
                true);
            return (true, null);
        }

        if (userEntity is null)
        {
            return (false, $"User for id '{extAuthId}' was not found");
        }

        if (userEntity.HouseholdId == Guid.Empty)
        {
            return (false, "User has no household");
        }

        currentUser.User = userEntity;
        return (true, null);
    }

    private Task<SimpleAuthUser?> GetUserFromDb(string sub) => dbContext.Users
        .Include(x => x.UserHouseholds)
        .Where(x => x.AuthId == sub)
        .Select(x => SimpleAuthUser.Create(x))
        .AsNoTracking()
        .AsSplitQuery()
        .FirstOrDefaultAsync();

    private static async Task HandleError(HttpContext context, string? errorMessage)
    {
        context.Response.ContentType = "application/json";
        var resp = ApiResponseBuilder.Error(AppError.Basic(AppErrorCodes.NotFoundError, errorMessage));
        SentToSentry(resp);
        await context.Response.WriteAsync(JsonSerializer.Serialize(resp));
    }

    private static void SentToSentry(ApiResponse<List<AppError>> resp) => SentrySdk.CaptureMessage(
        resp.Data?[0].Message ?? "AuthError: Token or role is not valid",
        opt =>
        {
            opt.SetExtra("Response", resp);
            opt.SetExtra("Code", resp.Data?[0].Code);
        });
}
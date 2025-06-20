using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using UserResponse = Kijk.Application.Users.Shared.UserResponse;

namespace Kijk.Application.Users;

public record WelcomeUserRequest(string? UserName, bool? UseDefaultResources);

/// <summary>
/// Handler for creating a new user after the welcome process.
/// </summary>
public static class WelcomeUserHandler
{
    private static readonly ILogger Logger = Log.ForContext(typeof(WelcomeUserHandler));

    public static async Task<Results<Ok<UserResponse>, ProblemHttpResult>> HandleAsync(WelcomeUserRequest request, AppDbContext dbContext,
        CurrentUser currentUser, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            Logger.Error("User not found: {UserId}", currentUser.Id);
            return TypedResults.Problem(Error.NotFound("User not found").ToProblemDetails());
        }

        if (request.UserName is null)
        {
            Logger.Error("User name is null");
            return TypedResults.Problem(Error.Unexpected("User name is null").ToProblemDetails());
        }

        if (!user.FirstTime)
        {
            Logger.Error("User is already welcome");
            return TypedResults.Problem(Error.Unexpected("Your are already welcome").ToProblemDetails());
        }

        user.FirstTime = false;
        user.Name = request.UserName;

        if (request.UseDefaultResources is true)
        {
            var defaultCategories = await dbContext.Resources
                .Where(x => x.CreatorType == CreatorType.System)
                .ToListAsync(cancellationToken);
            user.SetDefaultResources(true, defaultCategories);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new UserResponse(
            user.Id,
            user.AuthId,
            user.Name,
            user.Email,
            user.FirstTime,
            user.Resources.Any(c => c.CreatorType == CreatorType.System)));
    }
}
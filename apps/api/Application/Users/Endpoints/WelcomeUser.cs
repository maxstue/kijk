using Kijk.Application.Users.Models;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Users.Endpoints;

public static class WelcomeUser
{
    private static readonly ILogger Logger = Log.ForContext(typeof(WelcomeUser));

    /// <summary>
    ///Updates a newly created user after the welcome page.
    /// </summary>
    /// <param name="welcomeUserRequest">The user init settings.</param>
    /// <param name="currentUser"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    public static async Task<Results<Ok<UserResponse>, ProblemHttpResult>> HandleAsync(
        WelcomeUserRequest welcomeUserRequest,
        AppDbContext dbContext,
        CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.Categories)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            Logger.Warning("Error: User not found");
            return TypedResults.Problem(Error.NotFound("User not found").ToProblemDetails());
        }

        if (welcomeUserRequest.UserName is null)
        {
            Logger.Warning("User name is null");
            return TypedResults.Problem(Error.Unexpected("User name is null").ToProblemDetails());
        }

        user.FirstTime = false;
        user.Name = welcomeUserRequest.UserName;

        if (welcomeUserRequest.UseDefaultCategories is true)
        {
            var defaultCategories = await dbContext.Categories
                .Where(x => x.CreatorType == CategoryCreatorType.Default)
                .ToListAsync(cancellationToken);
            user.SetDefaultCategories(true, defaultCategories);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new UserResponse(
            user.Id,
            user.AuthId,
            user.Name,
            user.Email,
            user.FirstTime,
            user.Categories.Where(c => c.CreatorType == CategoryCreatorType.Default).ToList().Count > 0));
    }
}
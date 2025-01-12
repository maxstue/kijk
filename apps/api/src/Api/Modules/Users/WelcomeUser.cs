using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Modules.Users;

public record WelcomeUserRequest(string? UserName, bool? UseDefaultCategories);

public record WelcomeUserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime,
    bool? UseDefaultCategories);

public static class WelcomeUser
{
    private static readonly ILogger Logger = Log.ForContext(typeof(WelcomeUser));

    public static RouteGroupBuilder MapWelcomeUser(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPut("/welcome", Handle);
        return groupBuilder;
    }

    /// <summary>
    ///Updates a newly created user after the welcome page.
    /// </summary>
    /// <param name="welcomeUserRequest">The user init settings.</param>
    /// <param name="currentUser"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    private static async Task<Results<Ok<WelcomeUserResponse>, ProblemHttpResult>> Handle(
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

        return TypedResults.Ok(new WelcomeUserResponse(
            user.Id,
            user.AuthId,
            user.Name,
            user.Email,
            user.FirstTime,
            user.Categories.Where(c => c.CreatorType == CategoryCreatorType.Default).ToList().Count > 0));
    }
}
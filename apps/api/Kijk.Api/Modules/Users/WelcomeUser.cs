using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Users;

public record WelcomeUserRequest(string? UserName, bool? UseDefaultCategories);

sealed file record WelcomeUserResponse(
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
    ///     Updates a newly created user after the welcome page.
    /// </summary>
    /// <param name="welcomeUserRequest">The user init settings.</param>
    /// <param name="currentUser"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    private static async Task<IResult> Handle(
        WelcomeUserRequest welcomeUserRequest,
        AppDbContext dbContext,
        CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        try
        {
            var userEntity = await dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (userEntity is null)
            {
                Logger.Warning("Error: User not found");
                return TypedResults.NotFound(ApiResponseBuilder.Error("Error: User not found"));
            }

            if (welcomeUserRequest.UserName is null)
            {
                Logger.Warning("User name is null");
                return TypedResults.BadRequest(ApiResponseBuilder.Error("User name is null"));
            }

            userEntity.FirstTime = false;
            userEntity.Name = welcomeUserRequest.UserName;

            if (welcomeUserRequest.UseDefaultCategories is true)
            {
                var defaultCategories = await dbContext.Categories
                    .Where(x => x.CreatorType == CategoryCreatorType.Default)
                    .ToListAsync(cancellationToken);
                userEntity.SetDefaultCategories(true, defaultCategories);
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            var response = new WelcomeUserResponse(
                userEntity.Id,
                userEntity.AuthId,
                userEntity.Name,
                userEntity.Email,
                userEntity.FirstTime,
                userEntity.Categories.Where(c => c.CreatorType == CategoryCreatorType.Default).ToList().Count > 0);

            return TypedResults.Ok(ApiResponseBuilder.Success(response));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}
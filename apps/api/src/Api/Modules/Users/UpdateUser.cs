using Kijk.Api.Common.Extensions;
using Kijk.Api.Common.Models;
using Kijk.Api.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Api.Modules.Users;

public record UpdateUserRequest(string? UserName, bool? UseDefaultCategories);

public record UserUpdateResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime,
    bool? UseDefaultCategories);

public static class UpdateUser
{
    private static readonly ILogger Logger = Log.ForContext(typeof(UpdateUser));

    public static RouteGroupBuilder MapUpdateUser(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPut("/", Handle);
        return groupBuilder;
    }

    /// <summary>
    ///     Updates the user with the given values..
    /// </summary>
    /// <param name="userUpdateRequest">The user update values.</param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <param name="dbContext"></param>
    /// <returns>A loaded User from database.</returns>
    private static async Task<Results<Ok<UserUpdateResponse>, ProblemHttpResult>> Handle(
        UpdateUserRequest userUpdateRequest,
        AppDbContext dbContext,
        CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var userEntity = await dbContext.Users
            .Include(x => x.Categories)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (userEntity is null)
        {
            Logger.Warning("Error: User not found");
            return TypedResults.Problem(Error.NotFound("User not found").ToProblemDetails());
        }

        if (userUpdateRequest.UserName is null)
        {
            Logger.Warning("User name is null");
            return TypedResults.Problem(Error.Unexpected("User name is null").ToProblemDetails());
        }

        userEntity.FirstTime = false;
        userEntity.Name = userUpdateRequest.UserName;

        var defaultCategories = await dbContext.Categories
            .Where(x => x.CreatorType == CategoryCreatorType.Default)
            .ToListAsync(cancellationToken);
        userEntity.SetDefaultCategories(userUpdateRequest.UseDefaultCategories, defaultCategories);

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new UserUpdateResponse(
            userEntity.Id,
            userEntity.AuthId,
            userEntity.Name,
            userEntity.Email,
            userEntity.FirstTime,
            userUpdateRequest.UseDefaultCategories);

        return TypedResults.Ok(response);
    }
}
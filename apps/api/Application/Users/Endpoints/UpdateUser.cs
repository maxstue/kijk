using Kijk.Application.Users.Models;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Users.Endpoints;

public static class UpdateUser
{
    private static readonly ILogger Logger = Log.ForContext(typeof(UpdateUser));

    /// <summary>
    /// Updates the user with the given values..
    /// </summary>
    /// <param name="userUpdateRequest">The user update values.</param>
    /// <param name="currentUser"></param>
    /// <param name="cancellationToken"></param>
    /// <param name="dbContext"></param>
    /// <returns>A loaded User from database.</returns>
    public static async Task<Results<Ok<UserResponse>, ProblemHttpResult>> HandleAsync(
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

        var response = new UserResponse(
            userEntity.Id,
            userEntity.AuthId,
            userEntity.Name,
            userEntity.Email,
            userEntity.FirstTime,
            userUpdateRequest.UseDefaultCategories);

        return TypedResults.Ok(response);
    }
}
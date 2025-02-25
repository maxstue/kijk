using System.Security.Cryptography;
using Kijk.Application.Users.Models;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Kijk.Shared.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kijk.Application.Users.Endpoints;

public static class SignInUser
{
    private static readonly ILogger Logger = Log.ForContext(typeof(SignInUser));

    /// <summary>
    /// Creates a new user or retrieves an existing user by the <see cref="CurrentUser"/> object.
    /// </summary>
    /// <param name="currentUser"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    public static async Task<Results<Ok<UserResponse>, ProblemHttpResult>> HandleAsync(AppDbContext dbContext, CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.User.Name == AppConstants.CreateUserIdentifier)
        {
            var newUser = User.Create(
                currentUser.AuthId,
                $"{AppConstants.CreateUserIdentifier}-{RandomNumberGenerator.GetInt32(0, int.MaxValue)}",
                currentUser.Email,
                null,
                true);

            var newHouseHold = Household.Create("New Household", true);
            var newUserHousehold = UserHousehold.Create(newUser, newHouseHold, Role.Admin, true);

            var newAccount = Account.Create(AppConstants.DefaultValues.AccountName, newUser.Id, newHouseHold.Id, AccountType.Checking);

            await dbContext.Accounts.AddAsync(newAccount, cancellationToken);
            await dbContext.Households.AddAsync(newHouseHold, cancellationToken);
            await dbContext.UserHouseholds.AddAsync(newUserHousehold, cancellationToken);

            var newUserEntry = await dbContext.Users.AddAsync(newUser, cancellationToken);
            var newUserEntity = newUserEntry.Entity;

            await dbContext.SaveChangesAsync(cancellationToken);

            var newUserResponse = new UserResponse(
                newUserEntity.Id,
                newUserEntity.AuthId,
                newUserEntity.Name,
                newUserEntity.Email,
                newUserEntity.FirstTime,
                newUserEntity.Categories.Where(c => c.CreatorType == CategoryCreatorType.Default).ToList().Count > 0);
            return TypedResults.Ok(newUserResponse);
        }

        var userEntity = await dbContext.Users
            .Include(x => x.Categories)
            .Where(x => x.Id == currentUser.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (userEntity is null)
        {
            Logger.Warning("Error: User not found but also no 'CreateUserIdentifier' was set");
            return TypedResults.Problem(Error.NotFound("User not found but also no 'CreateUserIdentifier' was set").ToProblemDetails());
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var updateUserResponse = new UserResponse(
            userEntity.Id,
            userEntity.AuthId,
            userEntity.Name,
            userEntity.Email,
            userEntity.FirstTime,
            userEntity.Categories.Where(c => c.CreatorType == CategoryCreatorType.Default).ToList().Count > 0);
        return TypedResults.Ok(updateUserResponse);
    }
}
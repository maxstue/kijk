using System.Security.Cryptography;

using Kijk.Api.Common.Models;
using Kijk.Api.Domain.Entities;
using Kijk.Api.Persistence;

namespace Kijk.Api.Modules.Users;

sealed file record SignInUserResponse(
    Guid Id,
    string? AuthId,
    string? Name,
    string? Email,
    bool? FirstTime,
    bool? UseDefaultCategories);

public static class SignInUser
{
    private static readonly ILogger Logger = Log.ForContext(typeof(SignInUser));

    public static RouteGroupBuilder MapSignInUser(this RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapGet("/sign-in", Handle);

        return groupBuilder;
    }

    /// <summary>
    ///     Creates a new user or retrieves an existing user by the <see cref="CurrentUser"/> object.
    /// </summary>
    /// <param name="currentUser"></param>
    /// <param name="dbContext"></param>
    /// <param name="cancellationToken"></param>
    /// <returns>A loaded User from database.</returns>
    private static async Task<IResult> Handle(AppDbContext dbContext, CurrentUser currentUser, CancellationToken cancellationToken)
    {
        try
        {
            if (currentUser.User.Name == AppConstants.CreateUserIdentifier)
            {
                var newUser = User.Create(
                    currentUser.AuthId,
                    $"{AppConstants.CreateUserIdentifier}-{RandomNumberGenerator.GetInt32(0, Int32.MaxValue)}",
                    currentUser.Email,
                    default,
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

                var newUserResponse = new SignInUserResponse(
                    newUserEntity.Id,
                    newUserEntity.AuthId,
                    newUserEntity.Name,
                    newUserEntity.Email,
                    newUserEntity.FirstTime,
                    newUserEntity.Categories.Where(c => c.CreatorType == CategoryCreatorType.Default).ToList().Count > 0);
                return TypedResults.Ok(ApiResponseBuilder.Success(newUserResponse));
            }

            var userEntity = await dbContext.Users
                .Include(x => x.Categories)
                .Where(x => x.Id == currentUser.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (userEntity is null)
            {
                Logger.Warning("Error: User not found but also no 'CreateUserIdentifier' was set");
                return TypedResults.NotFound(ApiResponseBuilder.Error("User not found but also no 'CreateUserIdentifier' was set"));
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            var updateUserResponse = new SignInUserResponse(
                userEntity.Id,
                userEntity.AuthId,
                userEntity.Name,
                userEntity.Email,
                userEntity.FirstTime,
                userEntity.Categories.Where(c => c.CreatorType == CategoryCreatorType.Default).ToList().Count > 0);
            return TypedResults.Ok(ApiResponseBuilder.Success(updateUserResponse));
        }
        catch (Exception e)
        {
            Logger.Warning(e, "Error: {Error}", e.Message);
            return TypedResults.BadRequest(ApiResponseBuilder.Error(e.Message));
        }
    }
}
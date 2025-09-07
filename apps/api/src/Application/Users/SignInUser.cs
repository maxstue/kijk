using System.Security.Cryptography;
using Kijk.Domain.Entities;
using Kijk.Infrastructure.Persistence;
using Kijk.Shared;
using Microsoft.Extensions.Logging;
using UserResponse = Kijk.Application.Users.Shared.UserResponse;

namespace Kijk.Application.Users;

/// <summary>
/// Handler for the sign in a user.
/// It returns only a subset of data for the current user.
/// </summary>
public class SignInUserHandler(AppDbContext dbContext, CurrentUser currentUser, ILogger<SignInUserHandler> logger) : IHandler
{
    public async Task<Result<UserResponse>> SignInAsync(CancellationToken cancellationToken)
    {
        if (currentUser.User.Name == AppConstants.CreateUserIdentifier)
        {
            var newUser = User.Init(currentUser.AuthId, $"{AppConstants.CreateUserIdentifier}-{RandomNumberGenerator.GetInt32(0, int.MaxValue)}",
                currentUser.Email);

            var adminRole = await dbContext.Roles.FirstOrDefaultAsync(x => x.Name == "Admin", cancellationToken);
            if (adminRole == null)
            {
                logger.LogError("Admin role was not found");
                return Error.Unexpected("Admin role was not found");
            }

            var newHouseHold = Household.Create("New Household");
            var newUserHousehold = UserHousehold.Create(newUser, newHouseHold, adminRole, true);

            await dbContext.Households.AddAsync(newHouseHold, cancellationToken);
            await dbContext.UserHouseholds.AddAsync(newUserHousehold, cancellationToken);

            var newUserEntry = await dbContext.Users.AddAsync(newUser, cancellationToken);
            var newUserEntity = newUserEntry.Entity;

            await dbContext.SaveChangesAsync(cancellationToken);

            return new UserResponse(
                newUserEntity.Id,
                newUserEntity.AuthId,
                newUserEntity.Name,
                newUserEntity.Email,
                newUserEntity.FirstTime,
                newUserEntity.Resources.Any(c => c.CreatorType == CreatorType.User));
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var userEntity = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .Include(x => x.Resources)
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        if (userEntity is null)
        {
            logger.LogError("User not found but also no 'CreateUserIdentifier' was set");
            return Error.NotFound("User not found but also no 'CreateUserIdentifier' was set");
        }

        var useDefaultResources = userEntity.Resources.Any(c => c.CreatorType == CreatorType.System);

        var updateUserResponse = new UserResponse(
            userEntity.Id,
            userEntity.AuthId,
            userEntity.Name,
            userEntity.Email,
            userEntity.FirstTime,
            useDefaultResources);

        return updateUserResponse;
    }
}
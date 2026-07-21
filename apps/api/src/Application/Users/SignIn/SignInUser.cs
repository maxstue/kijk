using System.Security.Cryptography;
using Kijk.Application.Abstractions.Persistence;
using Kijk.Application.Users.Shared;
using Kijk.Domain.Entities;
using Kijk.Shared;
using Microsoft.Extensions.Logging;

namespace Kijk.Application.Users.SignIn;

/// <summary>
/// Handler for the sign in a user.
/// It returns only a subset of data for the current user.
/// </summary>
public class SignInUserHandler(IAppDbContext dbContext, CurrentUser currentUser, ILogger<SignInUserHandler> logger) : IHandler
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
                return Error.Unexpected("Role was not found");
            }

            var newHouseHold = Household.Create("New Household");
            var newUserHousehold = UserHousehold.Create(newUser, newHouseHold, adminRole, true);

            await dbContext.Households.AddAsync(newHouseHold, cancellationToken);
            await dbContext.UserHouseholds.AddAsync(newUserHousehold, cancellationToken);

            var newUserEntry = await dbContext.Users.AddAsync(newUser, cancellationToken);
            var newUserEntity = newUserEntry.Entity;

            await dbContext.SaveChangesAsync(cancellationToken);

            return newUserEntity.ToResponse(newUserEntity.Resources.Any(resource => resource.CreatorType == CreatorType.User));
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var userEntity = await dbContext.Users
            .Where(x => x.Id == currentUser.Id)
            .AsNoTracking()
            .ToResponse()
            .FirstOrDefaultAsync(cancellationToken);

        if (userEntity is null)
        {
            logger.LogError("User not found but also no 'CreateUserIdentifier' was set");
            return Error.NotFound("User not found");
        }

        return userEntity;
    }
}